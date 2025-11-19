import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { EntityKind } from '@/src/types/entities';
import { tableFor, withTablePrefix } from '@/src/types/entities';
import { useAuth } from '@/app/providers/AuthClientProvider';

export type ItemType = 'kpi' | 'metric' | 'dimension' | 'event' | 'dashboard';
export type ItemStatus = 'draft' | 'published';

export interface BaseItemFormData {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  status: ItemStatus;
  formula?: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const pluralize = (type: ItemType) => tableFor(type as EntityKind);

interface UseItemFormOptions {
  type: ItemType;
  initial?: Partial<BaseItemFormData>;
  afterCreateRedirect?: (created: { id: string; slug: string }) => string;
}

export function useItemForm({ type, initial, afterCreateRedirect }: UseItemFormOptions) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<BaseItemFormData>({
    name: initial?.name || '',
    slug: initial?.slug || '',
    description: initial?.description || '',
    category: initial?.category || '',
    tags: initial?.tags || [],
    status: 'draft',
    formula: initial?.formula || '',
  });

  const [slugEdited, setSlugEdited] = useState<boolean>(false);

  const slugPreview = useMemo(
    () => generateSlug(formData.slug || formData.name),
    [formData.slug, formData.name]
  );

  const setField = useCallback(<K extends keyof BaseItemFormData>(key: K, value: BaseItemFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleNameChange = useCallback((newName: string) => {
    setFormData((prev) => {
      const next: BaseItemFormData = { ...prev, name: newName };
      if (!slugEdited) {
        next.slug = generateSlug(newName);
      }
      return next;
    });
  }, [slugEdited]);

  const handleSlugChange = useCallback((newSlug: string) => {
    setSlugEdited(true);
    setFormData((prev) => ({ ...prev, slug: newSlug }));
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentUser = user;
    if (!currentUser) {
      setError('Please sign in to create an item.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const userName = currentUser.user_metadata?.user_name || currentUser.email || 'unknown';
      const plural = pluralize(type);
      const tableName = withTablePrefix(plural);
      const slug = formData.slug || generateSlug(formData.name);

      const { data: existing } = await (supabase
        .from(tableName) as any)
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        setError('An item with this slug already exists. Please choose a different name.');
        setSaving(false);
        return;
      }

      const insertPayload: Record<string, any> = {
        name: formData.name,
        description: formData.description,
        slug,
        category: formData.category,
        tags: formData.tags,
        status: 'draft',
        created_by: userName,
        created_at: new Date().toISOString(),
      };

      if (type === 'kpi' || type === 'metric') {
        insertPayload.formula = formData.formula || null;
      }

      const { data: created, error: insertError } = await (supabase
        .from(tableName) as any)
        .insert(insertPayload)
        .select()
        .single();

      if (insertError || !created) {
        setError(insertError?.message || 'Failed to create item.');
        setSaving(false);
        return;
      }

      // Trigger GitHub sync (fire and forget - don't wait for it)
      try {
        fetch(`/api/${plural}/${created.id}/sync-github`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'created' }),
        }).catch(() => {
          // Ignore errors - GitHub sync is non-blocking
        });
      } catch {
        // Ignore errors - GitHub sync is non-blocking
      }

      // Reset saving state before redirect
      setSaving(false);
      
      // Redirect to the edit page or list page
      const redirectTo = afterCreateRedirect?.({ id: created.id, slug }) ?? `/${plural}`;
      router.push(redirectTo);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create item.';
      setError(message);
      setSaving(false);
    }
  }

  return {
    user,
    loading: authLoading,
    saving,
    error,
    formData,
    setField,
    setFormData,
    slugPreview,
    handleNameChange,
    handleSlugChange,
    handleSubmit,
  };
}
