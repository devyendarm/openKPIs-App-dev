import { createClient } from '@/lib/supabase/server';
import { collectUserIdentifiers, listEntitiesForServer } from '@/lib/server/entities';
import Catalog from '@/components/Catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DimensionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const items = await listEntitiesForServer({
    kind: 'dimension',
    includeIdentifiers: collectUserIdentifiers(user),
  });

  return <Catalog kind="dimension" items={items} />;
}