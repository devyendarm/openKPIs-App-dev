import type { User } from '@supabase/supabase-js';

import { createAdminClient } from '@/lib/supabase/server';
import type { AnyEntity, EntityKind } from '@/src/types/entities';
import { sqlTableFor } from '@/src/types/entities';

export interface ListEntitiesServerOptions {
  kind: EntityKind;
  includeIdentifiers?: string[];
  search?: string;
  limit?: number;
}

async function runQuery(
  table: string,
  options: ListEntitiesServerOptions,
) {
  // Use admin client (bypasses RLS) - matches DEV repo working version
  const admin = createAdminClient();
  let query = admin.from(table).select('*');

  const orParts: string[] = ['status.ilike.published'];
  
  if (options.includeIdentifiers?.length) {
    const identifiers = Array.from(
      new Set(
        options.includeIdentifiers
          .map((identifier) => identifier?.replace(/,/g, '').trim())
          .filter((identifier): identifier is string => Boolean(identifier)),
      ),
    );
    for (const identifier of identifiers) {
      orParts.push(`created_by.eq.${identifier}`);
    }
  }
  query = query.or(orParts.join(','));

  if (options.search) {
    const q = `%${options.search}%`;
    query = query.ilike('name', q);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  query = query
    .order('last_modified_at', { ascending: false })
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Failed to list entities');
  }
  return (data || []) as AnyEntity[];
}

export async function listEntitiesForServer(
  options: ListEntitiesServerOptions,
): Promise<AnyEntity[]> {
  // Always use the prefixed table name (e.g., dev_kpis, prod_kpis)
  const table = sqlTableFor(options.kind);
  return await runQuery(table, options);
}

export function sanitizeIdentifier(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.replace(/,/g, '').trim() || null;
}

export function collectUserIdentifiers(user: User | null): string[] {
  const identifiers = new Set<string>();
  const username = sanitizeIdentifier(user?.user_metadata?.user_name as string | undefined);
  const email = sanitizeIdentifier(user?.email || undefined);
  if (username) identifiers.add(username);
  if (email) identifiers.add(email);
	return Array.from(identifiers);
}
