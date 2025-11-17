import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const gtm = process.env.NEXT_PUBLIC_GTM_ID || '';

  const mask = (v: string) => (v ? `${v.slice(0, 8)}...(${v.length})` : '');

  return NextResponse.json({
    ok: true,
    runtime: process.env.NEXT_RUNTIME || 'node',
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? mask(url) : '(missing)',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? mask(anon) : '(missing)',
      NEXT_PUBLIC_APP_URL: appUrl ? mask(appUrl) : '(missing)',
      NEXT_PUBLIC_GTM_ID: gtm ? mask(gtm) : '(missing)',
      NODE_ENV: process.env.NODE_ENV || '',
    },
  });
}


