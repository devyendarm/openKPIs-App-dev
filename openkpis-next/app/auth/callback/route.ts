import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  // Determine return URL: cookie > root
  const cookieReturn = req.cookies.get('openkpis_return_url')?.value;
  let to = '/';
  if (cookieReturn) {
    try {
      // Only allow same-origin relative paths
      const parsed = new URL(cookieReturn, url.origin);
      if (parsed.origin === url.origin) {
        to = parsed.pathname + parsed.search + parsed.hash;
      }
    } catch {
      to = '/';
    }
  }

  try {
    if (code) {
      const supabase = await createClient();
      // Exchange code for session and set auth cookies on the response
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // proceed to redirect anyway; client will reflect auth state via onAuthStateChange if set later
        // eslint-disable-next-line no-console
        console.error('Auth callback (server) exchange error:', error);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Auth callback (server) error:', err);
  }

  const res = NextResponse.redirect(new URL(to, url.origin));
  // Clear the cookie copy of return url
  res.cookies.set('openkpis_return_url', '', { path: '/', maxAge: 0 });
  return res;
}


