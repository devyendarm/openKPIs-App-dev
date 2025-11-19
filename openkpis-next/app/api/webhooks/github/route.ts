import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { withTablePrefix } from '@/src/types/entities';
import crypto from 'crypto';

/**
 * GitHub Webhook Handler
 * 
 * Updates contribution status when PRs are merged or closed.
 * 
 * Configure in GitHub:
 * - Settings → Webhooks → Add webhook
 * - Payload URL: https://your-domain.com/api/webhooks/github
 * - Content type: application/json
 * - Secret: Set GITHUB_WEBHOOK_SECRET env variable
 * - Events: Pull requests
 */

interface GitHubWebhookPayload {
  action: string;
  pull_request?: {
    id: number;
    number: number;
    state: string;
    merged: boolean;
    merged_at: string | null;
    closed_at: string | null;
    head: {
      ref: string;
    };
    base: {
      ref: string;
    };
    user?: {
      login: string;
    };
    body?: string;
  };
  repository?: {
    name: string;
    owner: {
      login: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-hub-signature-256');
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      const body = await request.text();
      const expectedSignature = `sha256=${crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')}`;

      if (signature !== expectedSignature) {
        console.error('[GitHub Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      // Parse the verified body
      const payload = JSON.parse(body) as GitHubWebhookPayload;
      await processWebhook(payload);
    } else {
      // If no secret configured, log warning but process anyway (for development)
      if (!webhookSecret) {
        console.warn('[GitHub Webhook] GITHUB_WEBHOOK_SECRET not configured - skipping signature verification');
      }
      const payload = (await request.json()) as GitHubWebhookPayload;
      await processWebhook(payload);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('[GitHub Webhook] Error processing webhook:', error);
    const message = error instanceof Error ? error.message : 'Failed to process webhook';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function processWebhook(payload: GitHubWebhookPayload) {
  // Only process pull_request events
  if (!payload.pull_request) {
    return;
  }

  const pr = payload.pull_request;
  const action = payload.action;

  // Only process when PR is closed (merged or not merged)
  if (action !== 'closed') {
    return;
  }

  // Extract item info from PR branch name
  // Branch format: {action}-{tableName}-{slug}-{timestamp}
  const branchName = pr.head.ref;
  const branchParts = branchName.split('-');

  if (branchParts.length < 3) {
    console.warn(`[GitHub Webhook] Unexpected branch format: ${branchName}`);
    return;
  }

  // Extract table name (second part) and slug (third part onwards, minus timestamp)
  const tableName = branchParts[1]; // e.g., 'kpis', 'metrics', etc.
  const slugParts = branchParts.slice(2, -1); // Everything except last (timestamp)
  const slug = slugParts.join('-');

  if (!tableName || !slug) {
    console.warn(`[GitHub Webhook] Could not extract table/slug from branch: ${branchName}`);
    return;
  }

  const supabase = createAdminClient();
  const tableNameWithPrefix = withTablePrefix(tableName);

  // Find the item by slug
  const { data: item, error: itemError } = await supabase
    .from(tableNameWithPrefix)
    .select('id, slug, github_pr_number')
    .eq('slug', slug)
    .maybeSingle();

  if (itemError || !item) {
    console.warn(`[GitHub Webhook] Item not found for slug: ${slug}`, itemError);
    return;
  }

  // Verify this PR belongs to this item (optional but recommended)
  if (item.github_pr_number && item.github_pr_number !== pr.number) {
    // Check if there's a match by PR number in any of the item's PRs
    // For now, we'll update based on slug match
    console.log(`[GitHub Webhook] PR number mismatch (item: ${item.github_pr_number}, webhook: ${pr.number}), but continuing with slug match`);
  }

  // Determine new contribution status
  let newStatus: 'completed' | 'failed' = 'failed';
  if (pr.merged) {
    newStatus = 'completed';
  }

  // Update contribution records for this item
  const contributionsTable = withTablePrefix('contributions');
  const { error: updateError } = await supabase
    .from(contributionsTable)
    .update({
      status: newStatus,
    })
    .eq('item_id', item.id)
    .eq('item_type', tableName.slice(0, -1)); // Remove 's' from plural (e.g., 'kpis' → 'kpi')

  if (updateError) {
    console.error(`[GitHub Webhook] Error updating contributions for item ${item.id}:`, updateError);
  } else {
    console.log(`[GitHub Webhook] Updated contribution status to '${newStatus}' for item ${item.id} (PR #${pr.number})`);
  }

  // If merged, update the item's GitHub PR number (if not already set)
  // Note: We don't update github_commit_sha here because:
  // 1. The webhook payload doesn't include merge_commit_sha directly
  // 2. The commit SHA is already stored when syncToGitHub is called
  // 3. We can fetch it from GitHub API if needed later
  if (pr.merged) {
    const { error: itemUpdateError } = await supabase
      .from(tableNameWithPrefix)
      .update({
        github_pr_number: pr.number,
        github_pr_url: `https://github.com/${payload.repository?.owner?.login || 'unknown'}/${payload.repository?.name || 'unknown'}/pull/${pr.number}`,
      })
      .eq('id', item.id);

    if (itemUpdateError) {
      console.error(`[GitHub Webhook] Error updating item ${item.id}:`, itemUpdateError);
    }
  }
}

