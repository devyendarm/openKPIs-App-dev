import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Octokit } from '@octokit/rest';

const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'devyendarm';
const GITHUB_CONTENT_REPO = process.env.GITHUB_CONTENT_REPO_NAME || 'openKPIs-Content';

const TABLE = 'metrics';
const TYPE_LABEL = 'Metric';
const DATA_LAYER_DIR = 'metrics';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const supabase = createAdminClient();

    const { data: metric, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !metric) {
      return NextResponse.json({ error: `${TYPE_LABEL} not found` }, { status: 404 });
    }

    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\n/g, '\n');
    const installationId = process.env.GITHUB_INSTALLATION_ID;

    if (!appId || !privateKey || !installationId) {
      return NextResponse.json(
        { error: 'GitHub credentials not configured' },
        { status: 500 }
      );
    }

    const octokit = new Octokit({
      auth: {
        appId,
        privateKey,
        installationId: parseInt(installationId, 10),
      },
    });

    const yamlContent = generateYAML(metric);
    const fileName = `${metric.slug || metric.name || metric.id}.yml`;
    const filePath = `data-layer/${DATA_LAYER_DIR}/${fileName}`;

    const { data: mainBranch } = await octokit.git.getRef({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      ref: 'heads/main',
    });

    const baseSha = mainBranch.object.sha;

    let existingPR: any = null;
    let branchName: string;

    if (metric.github_pr_number) {
      try {
        const { data: pr } = await octokit.pulls.get({
          owner: GITHUB_OWNER,
          repo: GITHUB_CONTENT_REPO,
          pull_number: metric.github_pr_number,
        });
        existingPR = pr;
        branchName = pr.head.ref;
      } catch (e) {
        branchName = `${action}-${TYPE_LABEL.toLowerCase()}-${metric.slug || metric.id}-${Date.now()}`;
      }
    } else {
      branchName = `${action}-${TYPE_LABEL.toLowerCase()}-${metric.slug || metric.id}-${Date.now()}`;
    }

    let existingFileSha: string | undefined;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner: GITHUB_OWNER,
        repo: GITHUB_CONTENT_REPO,
        path: filePath,
        ref: branchName,
      });
      if ('sha' in existingFile) {
        existingFileSha = existingFile.sha;
      }
    } catch (e) {
      // file does not exist yet; continue
    }

    if (!existingPR) {
      try {
        await octokit.git.createRef({
          owner: GITHUB_OWNER,
          repo: GITHUB_CONTENT_REPO,
          ref: `refs/heads/${branchName}`,
          sha: baseSha,
        });
      } catch (e: any) {
        if (!e.message?.includes('already exists')) {
          throw e;
        }
      }
    }

    const statusSuffix = metric.status === 'published' ? ' (Published)' : '';
    const actionLabel = action === 'created' ? 'Add' : 'Update';

    const { data: commitData } = await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo: GITHUB_CONTENT_REPO,
      path: filePath,
      message: `${actionLabel} ${TYPE_LABEL}: ${metric.name || metric.slug}${statusSuffix}`,
      content: Buffer.from(yamlContent).toString('base64'),
      branch: branchName,
      sha: existingFileSha,
      committer: {
        name: 'OpenKPIs Bot',
        email: 'bot@openkpis.org',
      },
      author: {
        name: metric.created_by,
        email: `${metric.created_by}@users.noreply.github.com`,
      },
    });

    let prData: any;
    if (existingPR) {
      prData = existingPR;
      const prBody = `**Contributed by**: @${metric.created_by}\n\n**Action**: ${action}\n**Type**: ${TYPE_LABEL}\n**Status**: ${metric.status}\n\n---\n\n${metric.description || 'No description provided.'}`;
      await octokit.pulls.update({
        owner: GITHUB_OWNER,
        repo: GITHUB_CONTENT_REPO,
        pull_number: existingPR.number,
        title: `${actionLabel} ${TYPE_LABEL}: ${metric.name || metric.slug}${statusSuffix || ' (Draft)'}`,
        body: prBody,
      });
    } else {
      const { data: newPR } = await octokit.pulls.create({
        owner: GITHUB_OWNER,
        repo: GITHUB_CONTENT_REPO,
        title: `${actionLabel} ${TYPE_LABEL}: ${metric.name || metric.slug}${metric.status === 'draft' ? ' (Draft)' : ' (Ready for Review)'}`,
        head: branchName,
        base: 'main',
        body: `**Contributed by**: @${metric.created_by}\n\n**Action**: ${action}\n**Type**: ${TYPE_LABEL}\n**Status**: ${metric.status}\n\n---\n\n${metric.description || 'No description provided.'}`,
        maintainer_can_modify: true,
      });
      prData = newPR;
    }

    await supabase
      .from(TABLE)
      .update({
        github_commit_sha: commitData.commit.sha,
        github_pr_number: prData.number,
        github_pr_url: prData.html_url,
        github_file_path: filePath,
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      commit_sha: commitData.commit.sha,
      pr_number: prData.number,
      pr_url: prData.html_url,
      branch: branchName,
    });
  } catch (error: any) {
    console.error(`[GitHub Sync] ${TYPE_LABEL} error:`, error);
    return NextResponse.json(
      { error: error?.message || `Failed to sync ${TYPE_LABEL.toLowerCase()}` },
      { status: 500 }
    );
  }
}

function formatLabel(key: string): string {
  return key
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function formatLine(key: string, value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const label = formatLabel(key);

  if (typeof value === 'string') {
    if (!value.trim()) return null;
    if (value.includes('\n')) {
      return `${label}: |\n  ${value.split('\n').join('\n  ')}`;
    }
    return `${label}: ${value}`;
  }

  if (Array.isArray(value)) {
    if (!value.length) return null;
    return `${label}: [${value.join(', ')}]`;
  }

  if (typeof value === 'object') {
    const serialized = JSON.stringify(value, null, 2);
    if (serialized === '{}' || serialized === '[]') return null;
    return `${label}: |\n  ${serialized.split('\n').join('\n  ')}`;
  }

  return `${label}: ${value}`;
}

function generateYAML(record: any): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [
    `# ${TYPE_LABEL}: ${record.name || record.slug || record.id}`,
    `# Generated: ${timestamp}`,
    `# Contributed by: ${record.created_by || 'unknown'}`,
    '',
  ];

  const preferredOrder = [
    'name',
    'slug',
    'description',
    'category',
    'formula',
    'calculation',
    'value_type',
    'tags',
    'status',
    'created_by',
    'created_at',
    'last_modified_by',
    'last_modified_at',
  ];

  const skipKeys = new Set([
    'id',
    'github_pr_number',
    'github_pr_url',
    'github_commit_sha',
    'github_file_path',
  ]);

  const handled = new Set<string>();

  for (const key of preferredOrder) {
    if (key in record && !skipKeys.has(key)) {
      const formatted = formatLine(key, record[key]);
      if (formatted) {
        lines.push(formatted);
      }
      handled.add(key);
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (handled.has(key) || skipKeys.has(key)) continue;
    const formatted = formatLine(key, value);
    if (formatted) {
      lines.push(formatted);
    }
  }

  return lines.join('\n');
}
