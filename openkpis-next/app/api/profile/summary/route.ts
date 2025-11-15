import { createClient } from '@/lib/supabase/server';
import { ok, unauthorized, error } from '@/lib/api/response';

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

    const [
      { data: profile },
      { data: likes },
      { data: contributions },
      { data: insights },
      { data: analyses },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).single(),
      supabase
        .from('likes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('contributions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('user_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('user_analyses')
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
  } catch (error: any) {
    console.error('[Profile Summary] Error:', error);
    return error(error?.message || 'Failed to load profile summary', 500);
  }
}




