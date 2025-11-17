import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED = new Set(['kpis', 'metrics', 'dimensions', 'events', 'dashboards']);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const table = url.searchParams.get('table') || '';
  if (!ALLOWED.has(table)) {
    return NextResponse.json({ ok: false, error: 'Invalid table' }, { status: 400 });
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    // case-insensitive match for published
    .ilike('status', 'published');

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, table, publishedCount: count ?? 0 });
}


