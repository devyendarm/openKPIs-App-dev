import { createClient } from '@/lib/supabase/server';
import { collectUserIdentifiers, listEntitiesForServer } from '@/lib/server/entities';
import Catalog from '@/components/Catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const items = await listEntitiesForServer({
    kind: 'dashboard',
    includeIdentifiers: collectUserIdentifiers(user),
  });

  return <Catalog kind="dashboard" items={items} />;
}