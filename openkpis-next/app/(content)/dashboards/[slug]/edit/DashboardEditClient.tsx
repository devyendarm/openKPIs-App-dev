'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthClientProvider';
import type { NormalizedDashboard } from '@/lib/server/dashboards';

const CATEGORY_OPTIONS = [
  'Conversion',
  'Revenue',
  'Engagement',
  'Retention',
  'Acquisition',
  'Performance',
  'Quality',
  'Efficiency',
  'Satisfaction',
  'Growth',
  'Other',
];

type FormData = {
  name: string;
  description: string;
  category: string;
  tags: string[];
};

type DashboardEditClientProps = {
  dashboard: NormalizedDashboard;
  slug: string;
  canEdit: boolean;
};

export default function DashboardEditClient({ dashboard, slug, canEdit }: DashboardEditClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  const initialFormData = useMemo<FormData>(
    () => ({
      name: dashboard.name || '',
      description: dashboard.description || '',
      category: dashboard.category || '',
      tags: dashboard.tags ?? [],
    }),
    [dashboard],
  );

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || formData.tags.includes(trimmed)) return;
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  async function handleSave() {
    if (!user) {
      setError('You need to sign in to save changes.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/items/dashboard/${dashboard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: formData }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || 'Failed to update dashboard.');
      }

      router.push(`/dashboards/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dashboard.');
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Editing unavailable</h1>
        <p style={{ color: 'var(--ifm-color-emphasis-700)' }}>
          You do not have permission to edit this dashboard. Sign in with the owner account if you believe this is an error.
        </p>
        <Link href={`/dashboards/${slug}`} style={{ color: 'var(--ifm-color-primary)' }}>
          ← Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <Link
        href={`/dashboards/${slug}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--ifm-color-primary)',
          textDecoration: 'none',
          marginBottom: '1rem',
          fontSize: '0.875rem',
        }}
      >
        ← Cancel Editing
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Edit Dashboard: {formData.name || dashboard.name}</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--ifm-color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save All'}
          </button>
          <span style={{ fontSize: '0.825rem', color: 'var(--ifm-color-emphasis-600)', textAlign: 'right' }}>
            Saves update the draft in Supabase. Publishing happens via Editorial Review.
          </span>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: '6px',
              fontSize: '1rem',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: '6px',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: '6px',
              fontSize: '1rem',
            }}
          >
            <option value="">None</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Tags</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add a tag and press Enter"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: '6px',
              fontSize: '1rem',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {formData.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'var(--ifm-color-primary)',
                  color: '#fff',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '1rem',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
