import { NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const cookies = await nextCookies();
  const supabase = await createClient();

  const { data: sessionData } = await supabase.auth.getSession();
  const { data: userData } = await supabase.auth.getUser();

  // Detect presence of supabase cookies without exposing values
  const cookieNames = ['sb-access-token', 'sb-refresh-token'];
  const cookiePresence: Record<string, boolean> = {};
  for (const name of cookieNames) {
    cookiePresence[name] = !!cookies.get(name)?.value;
  }

  return NextResponse.json({
    ok: true,
    runtime: process.env.NEXT_RUNTIME || 'node',
    hasSession: !!sessionData.session,
    user: userData.user
      ? {
          id: userData.user.id,
          email: userData.user.email,
          provider: userData.user.app_metadata?.provider || null,
          user_name: userData.user.user_metadata?.user_name || null,
        }
      : null,
    cookies: cookiePresence,
  });
}


