import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { currentAppEnv, sqlTableFor } from '@/src/types/entities';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      const sbCookies = allCookies.map((c: { name: string }) => c.name).filter((n: string) => n.startsWith('sb-'));
      const h = await headers();
      const host = h.get('host') || null;
      const fwd = h.get('x-forwarded-host') || null;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
      let envProjectRef: string | null = null;
      try {
        if (supabaseUrl) {
          const m = supabaseUrl.match(/^https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
          envProjectRef = m ? m[1] : null;
        }
      } catch {}

      const cookieProjectRefs = Array.from(
        new Set(
          sbCookies
            .map((n: string) => {
              const m = n.match(/^sb-([a-z0-9-]+)-auth-token\./i);
              return m ? m[1] : null;
            })
            .filter(Boolean) as string[]
        )
      );

      const hasLegacyAccess = allCookies.some((c: { name: string }) => c.name === 'sb-access-token');
      const hasLegacyRefresh = allCookies.some((c: { name: string }) => c.name === 'sb-refresh-token');

      return NextResponse.json({
        ok: true,
        authenticated: false,
        debug: {
          cookieCount: allCookies.length,
          supabaseCookies: sbCookies,
          host,
          forwardedHost: fwd,
          supabaseUrl,
          envProjectRef,
          cookieProjectRefs,
          hasLegacyAccess,
          hasLegacyRefresh,
        },
      });
    }

    const appEnv = currentAppEnv();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_role')
      .eq('id', user.id)
      .eq('app_env', appEnv)
      .maybeSingle();

    const role = (profile?.user_role || user.user_metadata?.user_role || 'contributor').toLowerCase();

    // Probe admin client and a simple query
    let adminOk = false;
    let adminError: string | null = null;
    const draftCounts: Record<string, number> = {};
    try {
      const admin = createAdminClient();
      const tables = ['kpi', 'metric', 'dimension', 'event', 'dashboard'] as const;
      for (const kind of tables) {
        const table = sqlTableFor(kind);
        const { count, error } = await admin
          .from(table)
          .select('*', { count: 'exact', head: true })
          .eq('status', 'draft');
        if (error) throw error;
        draftCounts[table] = count ?? 0;
      }
      adminOk = true;
    } catch (error: unknown) {
      adminError = error instanceof Error ? error.message : String(error);
    }

    return NextResponse.json({
      ok: true,
      authenticated: true,
      user: { id: user.id, email: user.email },
      role,
      admin: { ok: adminOk, error: adminError, draftCounts },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}



