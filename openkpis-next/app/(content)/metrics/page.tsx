import { createClient } from '@/lib/supabase/server';
import { collectUserIdentifiers, listEntitiesForServer } from '@/lib/server/entities';
import Catalog from '@/components/Catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MetricsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const items = await listEntitiesForServer({
    kind: 'metric',
    includeIdentifiers: collectUserIdentifiers(user),
  });

  return <Catalog kind="metric" items={items} />;
}