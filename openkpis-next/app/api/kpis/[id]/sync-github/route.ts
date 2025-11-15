import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { syncToGitHub } from '@/lib/services/github';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Get Supabase admin client
    const supabase = createAdminClient();

    // Fetch KPI from Supabase
    const { data: kpi, error: kpiError } = await supabase
      .from('kpis')
      .select('*')
      .eq('id', id)
      .single();

    if (kpiError || !kpi) {
      return NextResponse.json(
        { error: 'KPI not found' },
        { status: 404 }
      );
    }

    // Use central GitHub service with App auth
    const userLogin = kpi.created_by || 'unknown';
    const result = await syncToGitHub({
      tableName: 'kpis',
      record: kpi,
      action,
      userLogin,
      userName: kpi.created_by,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'GitHub sync failed' }, { status: 500 });
    }

    // Update Supabase record
    await supabase
      .from('kpis')
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
  } catch (error: any) {
    console.error('GitHub sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync to GitHub' },
      { status: 500 }
    );
  }
}
