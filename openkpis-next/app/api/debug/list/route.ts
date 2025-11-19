import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withTablePrefix } from '@/src/types/entities';

type AllowedTable = 'kpis' | 'metrics' | 'dimensions' | 'events' | 'dashboards';

const ALLOWED = new Set<AllowedTable>(['kpis', 'metrics', 'dimensions', 'events', 'dashboards']);

function isAllowedTable(value: string): value is AllowedTable {
  return ALLOWED.has(value as AllowedTable);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tableParam = url.searchParams.get('table') || '';
  if (!isAllowedTable(tableParam)) {
    return NextResponse.json({ ok: false, error: 'Invalid table' }, { status: 400 });
  }
  const table = tableParam;
  const prefixedTable = withTablePrefix(table);

  const includeMine = (url.searchParams.get('includeMine') || '').toLowerCase() === 'true';
  const search = url.searchParams.get('search') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 1000);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from(prefixedTable).select('*').limit(limit);

  // (status ilike 'published') OR (created_by in [gh, email])
  const orParts: string[] = ['status.ilike.published'];
  if (includeMine && user) {
    const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
    const gh = typeof metadata.user_name === 'string' ? metadata.user_name : undefined;
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



