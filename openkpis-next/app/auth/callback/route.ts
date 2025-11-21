import { NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  const requestCookies = await nextCookies();

  if (!code) {
    return NextResponse.redirect(new URL('/', url.origin));
  }

  // Prepare redirect target early
  const returnCookie = requestCookies.get('openkpis_return_url')?.value;
  const redirectTo = returnCookie ? decodeURIComponent(returnCookie) : '/';
  const redirectUrl = new URL(redirectTo, url.origin);
  redirectUrl.searchParams.set('_auth_success', '1');
  const response = NextResponse.redirect(redirectUrl, { status: 302 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[auth/callback] Missing Supabase env vars');
    return response;
  }

  // Use a server client that writes auth cookies directly onto this response
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return requestCookies.get(name)?.value;
      },
      set(name: string, value: string, options?: Parameters<typeof response.cookies.set>[2]) {
        response.cookies.set(name, value, options);
      },
      remove(name: string, options?: Parameters<typeof response.cookies.set>[2]) {
        response.cookies.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });

  // Exchange the auth code for a session and set cookies on the response
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error);
    return NextResponse.redirect(new URL('/', url.origin));
  }

  // Clear the temporary return URL cookie (on the response so it propagates)
  try {
    response.cookies.set('openkpis_return_url', '', { path: '/', maxAge: 0, sameSite: 'lax' });
  } catch {}

  // Try to extract and store the provider token for Giscus
  let providerToken: string | null = null;

  if (sessionData?.session) {
    const session = sessionData.session as unknown as Record<string, unknown>;
    providerToken =
      (session.provider_token as string | undefined) ||
      (session.provider_access_token as string | undefined) ||
      null;

    if (!providerToken && sessionData) {
      const dataAny = sessionData as unknown as Record<string, unknown>;
      providerToken =
        (dataAny.provider_token as string | undefined) ||
        (dataAny.provider_access_token as string | undefined) ||
        null;
    }
  }

  if (providerToken) {
    response.cookies.set('openkpis_github_token', providerToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  return response;
}



