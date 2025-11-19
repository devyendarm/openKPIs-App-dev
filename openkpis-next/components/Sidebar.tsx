import { createClient } from '@/lib/supabase/server';
import { withTablePrefix } from '@/src/types/entities';
import type { SidebarItem } from './SidebarClient';
import SidebarClient from './SidebarClient';

interface SidebarProps {
  section: 'kpis' | 'dimensions' | 'events' | 'metrics';
}

export default async function Sidebar({ section }: SidebarProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tableName = withTablePrefix(section);

  const userName =
    (user?.user_metadata as Record<string, unknown>)?.['user_name'] as string | undefined ||
    (user?.user_metadata as Record<string, unknown>)?.['email'] as string | undefined ||
    user?.email ||
    null;

  let query = supabase
    .from(tableName)
    .select('id, slug, name, status, created_by')
    .order('name');

  if (userName) {
    query = query.or(`status.eq.published,created_by.eq.${userName}`);
  } else {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading sidebar items:', {
      message: (error as { message?: string })?.message,
      code: (error as { code?: string })?.code,
    });
  }

  const items: SidebarItem[] = (data || []).map((item) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    status: item.status,
  }));

  return <SidebarClient section={section} items={items} />;
}
