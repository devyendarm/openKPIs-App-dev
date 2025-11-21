import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withTablePrefix } from '@/src/types/entities';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user (validated)
    const { data: { user } } = await supabase.auth.getUser();
    const userId: string | null = user?.id ?? null;

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user's saved analyses
    const { data: analyses, error: analysesError } = await supabase
      .from(withTablePrefix('user_analyses'))
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (analysesError) {
      console.error('[Get Saved Analyses] Error:', analysesError);
      return NextResponse.json(
        { error: analysesError.message || 'Failed to fetch analyses' },
        { status: 500 }
      );
    }

    // Fetch user's saved insights
    const { data: insights, error: insightsError } = await supabase
      .from(withTablePrefix('user_insights'))
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (insightsError) {
      console.error('[Get Saved Insights] Error:', insightsError);
      // Don't fail if insights can't be fetched, just log it
    }

    // Fetch user's dashboards (use validated user for lookup)
    const userName = user.user_metadata?.user_name || user.email || '';
    
    const { data: dashboards, error: dashboardsError } = await supabase
      .from(withTablePrefix('dashboards'))
      .select('*')
      .eq('created_by', userName || '')
      .order('created_at', { ascending: false });

    if (dashboardsError) {
      console.error('[Get Saved Dashboards] Error:', dashboardsError);
      // Don't fail if dashboards can't be fetched, just log it
    }

    return NextResponse.json({
      success: true,
      analyses: analyses || [],
      insights: insights || [],
      dashboards: dashboards || [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch saved analyses';
    console.error('[Get Saved Analyses] Error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

