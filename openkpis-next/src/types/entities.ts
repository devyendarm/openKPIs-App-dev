export type EntityKind = 'kpi' | 'metric' | 'dimension' | 'event' | 'dashboard';

export type EntityStatus = 'draft' | 'published' | 'archived';

export interface BaseEntity {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | null;
  status: EntityStatus;
  created_by?: string | null;
  created_at?: string | null;
  last_modified_by?: string | null;
  last_modified_at?: string | null;
}

export interface Kpi extends BaseEntity {
  formula?: string | null;
}

export interface Metric extends BaseEntity {
  formula?: string | null;
}

export interface Dimension extends BaseEntity {}
export interface EventEntity extends BaseEntity {}
export interface Dashboard extends BaseEntity {}

export type AnyEntity = Kpi | Metric | Dimension | EventEntity | Dashboard;

export function tableFor(kind: EntityKind): string {
  switch (kind) {
    case 'kpi':
      return 'kpis';
    case 'metric':
      return 'metrics';
    case 'dimension':
      return 'dimensions';
    case 'event':
      return 'events';
    case 'dashboard':
      return 'dashboards';
  }
}





