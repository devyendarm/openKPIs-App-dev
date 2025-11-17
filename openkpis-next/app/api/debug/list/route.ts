import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED = new Set(['kpis', 'metrics', 'dimensions', 'events', 'dashboards']);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const table = url.searchParams.get('table') || '';
  if (!ALLOWED.has(table)) {
    return NextResponse.json({ ok: false, error: 'Invalid table' }, { status: 400 });
  }

  const includeMine = (url.searchParams.get('includeMine') || '').toLowerCase() === 'true';
  const search = url.searchParams.get('search') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1000);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from(table).select('*').limit(limit);

  // (status ilike 'published') OR (created_by in [gh, email])
  const orParts: string[] = ['status.ilike.published'];
  if (includeMine && user) {
    const gh = (user.user_metadata as any)?.user_name as string | undefined;
    const email = user.email || undefined;
    if (gh) orParts.push(`created_by.eq.${gh}`);
    if (email) orParts.push(`created_by.eq.${email}`);
  }
  query = query.or(orParts.join(','));

  if (search) {
    const q = `%${search}%`;
    // NOTE: Adding another .or() would overwrite prior OR group, so apply simple AND search on name
    query = query.ilike('name', q);
  }

  const { data, error } = await query.order('last_modified_at', { ascending: false }).order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, table, count: (data || []).length, data });
}



