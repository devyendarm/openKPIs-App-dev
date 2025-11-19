import { NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  const cookieStore = await nextCookies();
  const supabase = await createClient();

  if (!code) {
    return NextResponse.redirect(new URL('/', url.origin));
  }

  // Exchange the auth code for a session and set cookies
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/', url.origin));
  }
  
  // Determine where to send the user next
  const returnCookie = cookieStore.get('openkpis_return_url')?.value;
  const redirectTo = returnCookie ? decodeURIComponent(returnCookie) : '/';

  // Clear the temporary return URL cookie
  try {
    cookieStore.set('openkpis_return_url', '', { path: '/', maxAge: 0, sameSite: 'lax' });
  } catch {}

  // Try to extract and store the provider token
  // Supabase doesn't expose provider tokens in client sessions by default,
  // but we can capture it here during the OAuth callback and store it securely
  let providerToken: string | null = null;
  
  if (sessionData?.session) {
    const session = sessionData.session as unknown as Record<string, unknown>;
    // Try multiple possible property names
    providerToken = 
      (session.provider_token as string | undefined) ||
      (session.provider_access_token as string | undefined) ||
      null;
    
    // Also check the raw response data
    if (!providerToken && sessionData) {
      const dataAny = sessionData as unknown as Record<string, unknown>;
      providerToken = 
        (dataAny.provider_token as string | undefined) ||
        (dataAny.provider_access_token as string | undefined) ||
        null;
    }
  }
  
  // Create redirect response
  const redirectUrl = new URL(redirectTo, url.origin);
  redirectUrl.searchParams.set('_auth_success', '1');
  const response = NextResponse.redirect(redirectUrl, { status: 302 });
  
  // Store provider token in a secure HTTP-only cookie if available
  // This allows us to retrieve it later for Giscus authentication
  if (providerToken) {
    // Store in a secure, HTTP-only cookie that expires with the session
    // Use a short expiration (7 days) and secure settings
    response.cookies.set('openkpis_github_token', providerToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true, // Prevent JavaScript access for security
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',
    });
  }
  
  return response;
}



