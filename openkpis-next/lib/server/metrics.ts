import { withTablePrefix } from '@/src/types/entities';
import type { Metric } from '@/lib/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

const metricsTable = withTablePrefix('metrics');

type MetricRow = Metric & {
  tags?: string[] | string | null;
};

export type NormalizedMetric = Omit<MetricRow, 'tags'> & {
  tags: string[];
};

export function toStringArray(value: string[] | string | null | undefined): string[] {
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

export function normalizeMetric(row: MetricRow): NormalizedMetric {
  return {
    ...row,
    tags: toStringArray(row.tags),
  };
}

export async function fetchMetricBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<NormalizedMetric | null> {
  const { data, error } = await supabase
    .from(metricsTable)
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return normalizeMetric(data as MetricRow);
}

export { metricsTable };
