import { createClient } from '@/lib/supabase/server';
import { collectUserIdentifiers, listEntitiesForServer } from '@/lib/server/entities';
import KPIsClient from './KPIsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KPIsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const items = await listEntitiesForServer({
    kind: 'kpi',
    includeIdentifiers: collectUserIdentifiers(user),
  });

  return <KPIsClient items={items} initialUser={user} />;
}
