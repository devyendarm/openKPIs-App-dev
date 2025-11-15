export type DraftItemType = 'kpi' | 'metric' | 'dimension' | 'event' | 'dashboard';

export interface DraftItem {
  id: string;
  name: string | null;
  slug: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  github_pr_number?: number | null;
  type: DraftItemType;
}
