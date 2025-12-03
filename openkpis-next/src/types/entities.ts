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

export type Dimension = BaseEntity;
export type EventEntity = BaseEntity;
export type Dashboard = BaseEntity;

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

/**
 * Resolves the table prefix based on environment detection.
 * Priority:
 * 1. NEXT_PUBLIC_APP_ENV environment variable (explicit override)
 * 2. VERCEL_ENV (Vercel deployment environment: 'production', 'preview', 'development')
 * 3. Hostname detection from URL environment variables (openkpis.org = prod)
 * 4. Default to dev_ for all other cases
 * 
 * @returns 'prod_' for production, 'dev_' for development
 */
export function resolveTablePrefix(): string {
  // Priority 1: Check explicit environment variable (highest priority)
  const envVar = (process.env.NEXT_PUBLIC_APP_ENV || '').toLowerCase();
  if (envVar.startsWith('prod')) return 'prod_';
  if (envVar.startsWith('dev')) return 'dev_';

  // Priority 2: Vercel environment detection
  // VERCEL_ENV is set by Vercel: 'production', 'preview', or 'development'
  const vercelEnv = process.env.VERCEL_ENV || '';
  if (vercelEnv === 'production') return 'prod_';
  if (vercelEnv === 'preview' || vercelEnv === 'development') return 'dev_';

  // Priority 3: Hostname-based detection from environment variables
  // Check VERCEL_URL (available in Vercel deployments, format: deployment-name.vercel.app)
  const vercelUrl = process.env.VERCEL_URL || '';
  if (vercelUrl) {
    // VERCEL_URL doesn't include protocol, so check if it contains openkpis.org
    const urlLower = vercelUrl.toLowerCase();
    if (urlLower.includes('openkpis.org')) return 'prod_';
    // All other Vercel preview URLs are dev
    return 'dev_';
  }

  // Priority 4: Check NEXT_PUBLIC_APP_URL (current deployment URL)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (appUrl) {
    try {
      const url = new URL(appUrl);
      const hostname = url.hostname.toLowerCase();
      // Only openkpis.org (and subdomains) are production
      if (hostname === 'openkpis.org' || hostname.endsWith('.openkpis.org')) {
        return 'prod_';
      }
    } catch {
      // Invalid URL format, continue to next check
    }
  }

  // Priority 5: Check if we're explicitly configured for production
  // If NEXT_PUBLIC_APP_URL_PROD is set and matches current URL, we're prod
  const prodUrl = process.env.NEXT_PUBLIC_APP_URL_PROD || '';
  if (prodUrl && appUrl) {
    try {
      const prodUrlObj = new URL(prodUrl);
      const appUrlObj = new URL(appUrl);
      if (prodUrlObj.hostname.toLowerCase() === appUrlObj.hostname.toLowerCase()) {
        return 'prod_';
      }
    } catch {
      // Invalid URL, continue
    }
  }

  // Default: All non-production environments are dev
  // This includes:
  // - localhost (development)
  // - preview deployments (Vercel preview URLs)
  // - staging environments
  // - any other non-openkpis.org domains
  return 'dev_';
}

/**
 * Logical application environment label used for table prefix resolution.
 * We normalize everything to 'dev' or 'prod' so code can do simple equality checks.
 */
export function currentAppEnv(): 'dev' | 'prod' {
  const raw = (process.env.NEXT_PUBLIC_APP_ENV || '').toLowerCase();
  if (raw.startsWith('prod')) return 'prod';
  return 'dev';
}

export function sqlTableFor(kind: EntityKind): string {
  return withTablePrefix(tableFor(kind));
}

/**
 * Get table name with environment prefix.
 * Dev environment uses dev_ prefix, prod uses prod_ prefix.
 * Each environment has its own Supabase project with separate tables.
 */
export function withTablePrefix(table: string): string {
  return `${resolveTablePrefix()}${table}`;
}





