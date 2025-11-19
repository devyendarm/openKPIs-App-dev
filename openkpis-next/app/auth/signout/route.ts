import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    
    // Clear any auth-related cookies
    const cookieStore = await cookies();
    try {
      cookieStore.set('sb-access-token', '', { path: '/', maxAge: 0, sameSite: 'lax' });
      cookieStore.set('sb-refresh-token', '', { path: '/', maxAge: 0, sameSite: 'lax' });
      cookieStore.set('openkpis_github_token', '', { path: '/', maxAge: 0, sameSite: 'lax' });
    } catch {}
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to sign out';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

