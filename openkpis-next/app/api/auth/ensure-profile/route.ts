import type { PostgrestError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { ok, error, unauthorized } from '@/lib/api/response';
import { currentAppEnv } from '@/src/types/entities';

type UserProfileRow = {
  id: string;
  user_role: string;
  app_env: 'dev' | 'prod';
};

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return unauthorized();
    }

    const appEnv = currentAppEnv();

    const githubUsername =
      (user.user_metadata?.user_name as string | undefined) ||
      (user.user_metadata?.preferred_username as string | undefined) ||
      null;
    const fullName = (user.user_metadata?.full_name as string | undefined) || null;
    const email = user.email || null;
    const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) || null;

    const { data: existing, error: selectError } = await supabase
      .from('user_profiles')
      .select('id, user_role, app_env')
      .eq('id', user.id)
      .eq('app_env', appEnv)
      .maybeSingle();

    if (selectError && (selectError as PostgrestError).code !== 'PGRST116') {
      // If it's not "No rows" error
      return error(selectError.message, 500);
    }

    if (!existing) {
      const defaultRole = 'contributor';
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          app_env: appEnv,
          user_role: defaultRole,
          github_username: githubUsername,
          full_name: fullName,
          email: email,
          avatar_url: avatarUrl,
          role: 'user',
          is_editor: false,
          is_admin: false,
          last_active_at: new Date().toISOString(),
        });
      if (insertError) {
        return error(insertError.message, 500);
      }
      return ok({ created: true, role: defaultRole });
    }

    // Row exists; update enrichment fields and last_active_at (do not override role)
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        app_env: appEnv,
        github_username: githubUsername,
        full_name: fullName,
        email: email,
        avatar_url: avatarUrl,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      return error(updateError.message, 500);
    }

    return ok({ created: false, role: existing.user_role });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return error(message, 500);
  }
}


