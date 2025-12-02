import { createClient } from '@/lib/supabase/server';
import { ok, unauthorized, error } from '@/lib/api/response';
import { withTablePrefix } from '@/src/types/entities';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    const userId = user.id;

    const likesTable = withTablePrefix('likes');
    const contributionsTable = withTablePrefix('contributions');
    const insightsTable = withTablePrefix('user_insights');
    const analysesTable = withTablePrefix('user_analyses');

    const [
      { data: profile },
      { data: likes },
      { data: contributions },
      { data: insights },
      { data: analyses },
    ] = await Promise.all([
      supabase
        .from(withTablePrefix('user_profiles'))
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from(likesTable)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from(contributionsTable)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from(insightsTable)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from(analysesTable)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const payload = {
      profile: profile || null,
      counts: {
        likes: likes?.length || 0,
        contributions: contributions?.length || 0,
        insights: insights?.length || 0,
        analyses: analyses?.length || 0,
      },
      likes: likes || [],
      contributions: contributions || [],
      insights: insights || [],
      analyses: analyses || [],
    };

    return ok(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load profile summary';
    console.error('[Profile Summary] Error:', err);
    return error(message, 500);
  }
}




