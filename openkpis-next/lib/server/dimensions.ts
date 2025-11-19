import { withTablePrefix } from '@/src/types/entities';
import type { SupabaseClient } from '@supabase/supabase-js';

const dimensionsTable = withTablePrefix('dimensions');

type DimensionRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | string | null;
  status: 'draft' | 'published' | 'archived';
  created_by?: string | null;
  created_at?: string | null;
  last_modified_by?: string | null;
  last_modified_at?: string | null;
};

export type NormalizedDimension = Omit<DimensionRow, 'tags'> & {
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

export function normalizeDimension(row: DimensionRow): NormalizedDimension {
  return {
    ...row,
    tags: toStringArray(row.tags),
  };
}

export async function fetchDimensionBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<NormalizedDimension | null> {
  const { data, error } = await supabase
    .from(dimensionsTable)
    .select('*')
    .eq('slug', slug)
    .maybeSingle<DimensionRow>();

  if (error || !data) {
    return null;
  }

  return normalizeDimension(data);
}

export { dimensionsTable };
