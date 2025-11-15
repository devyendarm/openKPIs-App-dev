import { createClient, createAdminClient } from '@/lib/supabase/server';
import EditorReviewClient from './EditorReviewClient';
import type { DraftItem, DraftItemType } from './types';
import Link from 'next/link';
import { getUserRoleServer } from '@/lib/roles/server';

export async function generateMetadata() {
  const role = await getUserRoleServer();
  if (role !== 'admin' && role !== 'editor') {
    return {
      robots: {
        index: false,
        follow: false,
      },
    } as any;
  }
  return {} as any;
}

interface TableConfig {
  key: DraftItemType;
  table: string;
}

const TABLES: TableConfig[] = [
  { key: 'kpi', table: 'kpis' },
  { key: 'metric', table: 'metrics' },
  { key: 'dimension', table: 'dimensions' },
  { key: 'event', table: 'events' },
  { key: 'dashboard', table: 'dashboards' },
];

export default async function EditorReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Role check via shared helper; allow admin and editor access
  const role = await getUserRoleServer();
  const isAuthorized = role === 'admin' || role === 'editor';

  if (authError || !user || !isAuthorized) {
    return (
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          You are not authorized to access this page
        </h1>
        <p style={{ marginBottom: '1rem', color: 'var(--ifm-color-emphasis-700)' }}>
          This section is restricted to administrators and editors.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'var(--ifm-color-primary)',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Explore KPIs
        </Link>
      </main>
    );
  }

  const admin = createAdminClient();

  const draftPromises = TABLES.map(async (config) => {
    const { data, error } = await admin
      .from(config.table)
      .select('id, name, slug, status, created_by, created_at, updated_at:last_modified_at, github_pr_number')
      .eq('status', 'draft')
      .order('last_modified_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      return [] as DraftItem[];
    }

    return data.map((item: any) => ({
      ...item,
      type: config.key,
    })) as DraftItem[];
  });

  const draftsByType = await Promise.all(draftPromises);
  const drafts = draftsByType.flat();

  drafts.sort((a, b) => {
    const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
    const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
    return bDate - aDate;
  });

  const editorName =
    (user?.user_metadata?.user_name as string | undefined) ||
    user?.email ||
    user?.id ||
    'Guest';

  return (
    <EditorReviewClient
      editorName={editorName}
      initialItems={drafts}
    />
  );
}
