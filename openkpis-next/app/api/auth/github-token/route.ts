import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * API endpoint to fetch the GitHub provider token
 * 
 * Since Supabase doesn't expose provider tokens in client sessions by default,
 * we store the token in a secure HTTP-only cookie during the OAuth callback
 * and retrieve it here for Giscus authentication.
 */
export async function GET() {
  try {
    // First, verify the user has a valid session
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ token: null, error: 'No session' }, { status: 200 });
    }

    // Try to get provider token from secure cookie (stored during OAuth callback)
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get('openkpis_github_token')?.value;
    
    if (tokenFromCookie) {
      return NextResponse.json({ token: tokenFromCookie }, { status: 200 });
    }

    // Fallback: Try to get provider token from session (might not be available)
    // Note: Supabase Session type doesn't include provider_token by default
    const sessionAny = session as unknown as Record<string, unknown>;
    const providerToken = 
      (sessionAny.provider_token as string | undefined) ||
      (sessionAny.provider_access_token as string | undefined) ||
      null;

    if (providerToken) {
      return NextResponse.json({ token: providerToken }, { status: 200 });
    }

    // Fallback: Try to get from user metadata
    const user = session.user;
    if (user?.user_metadata) {
      const metadata = user.user_metadata as Record<string, unknown>;
      const metadataToken = metadata.provider_token as string | undefined;
      
      if (metadataToken) {
        return NextResponse.json({ token: metadataToken }, { status: 200 });
      }
    }
    
    // Token not available
    return NextResponse.json({ 
      token: null, 
      error: 'GitHub provider token not available. Please sign in again.' 
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error fetching GitHub token:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub token' },
      { status: 500 }
    );
  }
}

