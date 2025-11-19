import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { syncToGitHub } from '@/lib/services/github';
import { withTablePrefix } from '@/src/types/entities';
import type { Metric } from '@/lib/types/database';

type MetricRow = Metric;
type SyncAction = 'created' | 'edited';

const metricsTable = withTablePrefix('metrics');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = (await request.json()) as { action?: SyncAction };
    const action = body.action ?? 'edited';

    const { data: metric, error } = await supabase
      .from(metricsTable)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !metric) {
      return NextResponse.json({ error: 'Metric not found' }, { status: 404 });
    }

    const userLogin = metric.created_by || 'unknown';
    const result = await syncToGitHub({
      tableName: 'metrics',
      record: metric,
      action,
      userLogin,
      userName: metric.created_by ?? undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'GitHub sync failed' }, { status: 500 });
    }

    await supabase
      .from(metricsTable)
      .update({
        github_commit_sha: result.commit_sha,
        github_pr_number: result.pr_number,
        github_pr_url: result.pr_url,
        github_file_path: result.file_path,
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      commit_sha: result.commit_sha,
      pr_number: result.pr_number,
      pr_url: result.pr_url,
      branch: result.branch,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sync to GitHub';
    console.error('GitHub sync error (metric):', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

