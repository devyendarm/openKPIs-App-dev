import { withTablePrefix } from '@/src/types/entities';
import type { SupabaseClient } from '@supabase/supabase-js';

const eventsTable = withTablePrefix('events');

type EventRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | string | null;
  status: 'draft' | 'published' | 'archived';
  created_by?: string | null;
  created_at?: string | null;
};

export type NormalizedEvent = Omit<EventRow, 'tags'> & {
  tags: string[];
};

function toStringArray(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((entry): entry is string => typeof entry === 'string');
        }
      } catch {
        return [trimmed];
      }
    }
    return [trimmed];
  }
  return [];
}

export function normalizeEvent(row: EventRow): NormalizedEvent {
  return {
    ...row,
    tags: toStringArray(row.tags),
  };
}

export async function fetchEventBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<NormalizedEvent | null> {
  const { data, error } = await supabase
    .from(eventsTable)
    .select('*')
    .eq('slug', slug)
    .maybeSingle<EventRow>();

  if (error || !data) {
    return null;
  }

  return normalizeEvent(data);
}

export { eventsTable };
