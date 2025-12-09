import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [forkPreferenceEnabled, setForkPreferenceEnabled] = useState<boolean | null>(null);
  const [showForkModal, setShowForkModal] = useState(false);
  const [forkProgress, setForkProgress] = useState(0);
  const [forkPreferenceLoading, setForkPreferenceLoading] = useState(true);

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

  // Load user's GitHub fork preference
  useEffect(() => {
    if (!user) {
      setForkPreferenceLoading(false);
      return;
    }

    async function loadPreference() {
      try {
        const response = await fetch('/api/user/settings/github-contributions', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setForkPreferenceEnabled(data.enabled === true);
        }
      } catch (error) {
        console.warn('Failed to load GitHub fork preference:', error);
      } finally {
        setForkPreferenceLoading(false);
      }
    }

    loadPreference();
  }, [user]);


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

  // Shared submission logic
  const submitItem = useCallback(async (githubContributionMode?: 'internal_app' | 'fork_pr') => {
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
    
    // If fork+PR mode, show progress
    if (githubContributionMode === 'fork_pr') {
      setForkProgress(10);
    }

    try {
      const slug = formData.slug || generateSlug(formData.name);
      
      // Simulate progress for fork+PR (since we can't track actual GitHub API progress)
      if (githubContributionMode === 'fork_pr') {
        setForkProgress(20); // Item creation started
      }

      // Call unified API route that handles:
      // 1. Item creation
      // 2. Contribution record creation
      // 3. GitHub sync
      const response = await fetch('/api/items/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type,
          name: formData.name.trim(),
          slug,
          description: formData.description || undefined,
          category: formData.category || undefined,
          tags: formData.tags || [],
          formula: formData.formula || undefined,
          githubContributionMode, // Pass the mode explicitly
        }),
      });
      
      if (githubContributionMode === 'fork_pr') {
        setForkProgress(40); // API call in progress
      }

      const data = await response.json();
      
      if (githubContributionMode === 'fork_pr') {
        setForkProgress(60); // Response received
      }

      if (!response.ok) {
        // Handle API errors
        const errorMessage = data.error || `Failed to create ${type}. Status: ${response.status}`;
        setError(errorMessage);
        setSaving(false);
        setShowForkModal(false);
        setForkProgress(0);
        return;
      }

      if (!data.success || !data.item) {
        setError('Item was created but response was invalid. Please refresh and check.');
        setSaving(false);
        if (githubContributionMode === 'fork_pr') {
          setShowForkModal(false);
          setForkProgress(0);
        }
        return;
      }

      if (githubContributionMode === 'fork_pr') {
        setForkProgress(80); // Item created, GitHub sync in progress
      }

      // Log GitHub sync status
      if (data.github) {
        if (data.github.success) {
          if (githubContributionMode === 'fork_pr') {
            setForkProgress(95); // GitHub sync successful
          }
        } else {
          // GitHub sync failed
          if (githubContributionMode === 'fork_pr') {
            // For fork+PR, show error since user explicitly chose this mode
            const githubError = data.github.error || 'GitHub sync failed';
            setError(`Item created successfully, but ${githubError}. You can view it in the editor.`);
            setForkProgress(0);
            setShowForkModal(false);
            setSaving(false);
            return; // Don't redirect - let user see the error
          } else {
            // For Quick Create, GitHub sync failure is non-critical
            console.warn('GitHub sync failed (non-critical):', data.github.error);
          }
        }
      }

      // Reset saving state
      setSaving(false);
      
      if (githubContributionMode === 'fork_pr') {
        setForkProgress(100); // Complete
        // Wait a moment to show 100% before redirecting
        await new Promise(resolve => setTimeout(resolve, 500));
        setShowForkModal(false);
      }

      // Use window.location.href for full page reload to ensure clean state
      // This avoids race conditions with router.push()
      const redirectTo = afterCreateRedirect?.({ 
        id: data.item.id, 
        slug: data.item.slug 
      }) ?? `/${pluralize(type)}`;
      
      window.location.href = redirectTo;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create item.';
      setError(message);
      setSaving(false);
      if (githubContributionMode === 'fork_pr') {
        setShowForkModal(false);
        setForkProgress(0);
      }
    }
  }, [formData, user, type, afterCreateRedirect]);

  // Handle Quick Create (always uses GitHub App flow - existing behavior)
  const handleQuickCreate = useCallback(() => {
    submitItem('internal_app'); // Explicitly use GitHub App flow (existing behavior)
  }, [submitItem]);

  // Handle Fork + Create (fork+PR mode)
  // Immediately start the fork+PR flow, show modal with progress
  const handleForkCreate = useCallback(() => {
    // Show modal with progress immediately
    setShowForkModal(true);
    setSaving(true);
    
    // Start fork+PR flow immediately (don't wait for preference)
    submitItem('fork_pr');
  }, [submitItem]);

  // Handle form submit (for Enter key, defaults to Quick Create)
  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleQuickCreate();
  }, [handleQuickCreate]);

  // This function is no longer needed - we start fork+PR immediately
  // Keeping for backward compatibility but it won't be called
  const handleForkModalConfirmAfterEnable = useCallback(() => {
    // No-op - fork+PR starts immediately when button is clicked
  }, []);

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
    // Fork+PR related
    handleQuickCreate,
    handleForkCreate,
    forkPreferenceEnabled,
    forkPreferenceLoading,
    showForkModal,
    setShowForkModal,
    forkProgress,
    handleForkModalConfirm: handleForkModalConfirmAfterEnable,
  };
}
