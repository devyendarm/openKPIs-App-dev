import { useEffect, useState } from 'react';
import type { EntityKind, AnyEntity } from '@/src/types/entities';
import { getEntityBySlug } from '@/lib/repository/entityRepository';

export function useEntity(kind: EntityKind, slug: string) {
  const [item, setItem] = useState<AnyEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getEntityBySlug(kind, slug)
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load item');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, slug]);

  return { item, loading, error };
}





