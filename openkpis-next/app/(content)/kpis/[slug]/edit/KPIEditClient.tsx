'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { withTablePrefix } from '@/src/types/entities';
import { useAuth } from '@/app/providers/AuthClientProvider';
import type { NormalizedKpi } from '@/lib/server/kpis';

const kpisTable = withTablePrefix('kpis');

const CATEGORIES = ['Conversion', 'Revenue', 'Engagement', 'Retention', 'Acquisition', 'Performance', 'Quality', 'Efficiency', 'Satisfaction', 'Growth', 'Other'];
const INDUSTRIES = ['Retail', 'E-commerce', 'SaaS', 'Healthcare', 'Education', 'Finance', 'Media', 'Technology', 'Manufacturing', 'Other'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const KPI_TYPES = ['Counter', 'Rate', 'Ratio', 'Percentage', 'Average', 'Sum'];
const SCOPES = ['User', 'Session', 'Event', 'Global'];

export type KpiStatus = 'draft' | 'published' | 'archived';

type FormData = {
  name: string;
  description: string;
  formula: string;
  category: string;
  tags: string[];
  industry: string;
  priority: string;
  core_area: string;
  scope: string;
  kpi_type: string;
  measure: string;
  aggregation_window: string;
  ga4_implementation: string;
  adobe_implementation: string;
  amplitude_implementation: string;
  data_layer_mapping: string;
  xdm_mapping: string;
  dependencies: string;
  bi_source_system: string;
  report_attributes: string;
  dashboard_usage: string;
  segment_eligibility: string;
  related_kpis: string[];
  sql_query: string;
  calculation_notes: string;
  details: string;
};

type AdditionalKpiFields = {
  dependencies?: string | null;
  bi_source_system?: string | null;
  report_attributes?: string | null;
  dashboard_usage?: string | null;
  segment_eligibility?: string | null;
  measure?: string | null;
};

export type EditableKpi = NormalizedKpi & AdditionalKpiFields;

type KpiUpdatePayload = {
  // Core fields
  name: string;
  description: string;
  formula: string;
  category: string;
  tags: string[];

  // Business context
  industry: string[];
  priority: string;
  core_area: string;
  scope: string;

  // Technical
  kpi_type: string;
  aggregation_window: string;

  // Platform implementation
  ga4_implementation: string;
  adobe_implementation: string;
  amplitude_implementation: string;

  // Data mappings
  data_layer_mapping: string;
  xdm_mapping: string;

  // SQL & documentation
  sql_query: string;
  calculation_notes: string;
  details: string;

  // Governance / audit
  status: KpiStatus;
  last_modified_by: string;
  last_modified_at: string;
};

type KPIEditClientProps = {
  kpi: EditableKpi;
  slug: string;
  canEdit: boolean;
};

export default function KPIEditClient({ kpi, slug, canEdit }: KPIEditClientProps) {
  const router = useRouter();
  const { user } = useAuth();

  const initialFormState: FormData = useMemo(
    () => ({
      name: kpi.name || '',
      description: kpi.description || '',
      formula: kpi.formula || '',
      category: kpi.category || '',
      tags: kpi.tags ?? [],
      industry: kpi.industry?.[0] || '',
      priority: kpi.priority || '',
      core_area: kpi.core_area || '',
      scope: kpi.scope || '',
      kpi_type: kpi.kpi_type || '',
      measure: kpi.measure || '',
      aggregation_window: kpi.aggregation_window || '',
      ga4_implementation: kpi.ga4_implementation || '',
      adobe_implementation: kpi.adobe_implementation || '',
      amplitude_implementation: kpi.amplitude_implementation || '',
      data_layer_mapping: kpi.data_layer_mapping || '',
      xdm_mapping: kpi.xdm_mapping || '',
      dependencies: kpi.dependencies || '',
      bi_source_system: kpi.bi_source_system || '',
      report_attributes: kpi.report_attributes || '',
      dashboard_usage: kpi.dashboard_usage || '',
      segment_eligibility: kpi.segment_eligibility || '',
      related_kpis: kpi.related_kpis ?? [],
      sql_query: kpi.sql_query || '',
      calculation_notes: kpi.calculation_notes || '',
      details: kpi.details || '',
    }),
    [kpi],
  );

  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [activeTab, setActiveTab] = useState(0);
  const [tagInput, setTagInput] = useState('');
  const [relatedInput, setRelatedInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userName =
    (user?.user_metadata?.user_name as string | undefined) ||
    user?.email ||
    null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || formData.tags.includes(trimmed)) return;
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const handleAddRelated = () => {
    const trimmed = relatedInput.trim();
    if (!trimmed || formData.related_kpis.includes(trimmed)) return;
    setFormData((prev) => ({ ...prev, related_kpis: [...prev.related_kpis, trimmed] }));
    setRelatedInput('');
  };

  const handleRemoveRelated = (value: string) => {
    setFormData((prev) => ({ ...prev, related_kpis: prev.related_kpis.filter((item) => item !== value) }));
  };

  async function handleSave() {
    if (!userName) {
      setError('You need to sign in to save changes.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { industry: industryString } = formData;

      // Build a payload that matches the actual Supabase KPI columns.
      // We intentionally do NOT send fields that are not yet in the schema
      // (e.g. dependencies, measure, etc.) to avoid update failures.
      const updatePayload: KpiUpdatePayload = {
        // Core
        name: formData.name,
        description: formData.description,
        formula: formData.formula,
        category: formData.category,
        tags: formData.tags,

        // Business context
        industry: industryString ? [industryString] : [],
        priority: formData.priority,
        core_area: formData.core_area,
        scope: formData.scope,

        // Technical
        kpi_type: formData.kpi_type,
        aggregation_window: formData.aggregation_window,

        // Platform implementation
        ga4_implementation: formData.ga4_implementation,
        adobe_implementation: formData.adobe_implementation,
        amplitude_implementation: formData.amplitude_implementation,

        // Data mappings
        data_layer_mapping: formData.data_layer_mapping,
        xdm_mapping: formData.xdm_mapping,

        // SQL & docs
        sql_query: formData.sql_query,
        calculation_notes: formData.calculation_notes,
        details: formData.details,

        // Governance
        status: 'draft' as KpiStatus,
        last_modified_by: userName,
        last_modified_at: new Date().toISOString(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from(kpisTable) as any)
        .update(updatePayload)
        .eq('id', kpi.id);

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update KPI.');
      }

      const syncResponse = await fetch(`/api/kpis/${kpi.id}/sync-github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edited' }),
      });

      if (!syncResponse.ok) {
        const payload = await syncResponse.json().catch(() => null);
        throw new Error(payload?.error || 'GitHub sync failed.');
      }

      router.push(`/kpis/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update KPI.');
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Editing unavailable</h1>
        <p style={{ color: 'var(--ifm-color-emphasis-700)' }}>
          You do not have permission to edit this KPI. Please contact an administrator if you believe this is an error.
        </p>
        <Link href={`/kpis/${slug}`} style={{ color: 'var(--ifm-color-primary)' }}>
          ← Back to KPI
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
      <Link
        href={`/kpis/${slug}`}
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
        <h1 style={{ fontSize: '2rem', fontWeight: 600 }}>Edit KPI: {formData.name || kpi.name}</h1>
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
            Saved as draft, will be Published only after the Editorial Review.
          </span>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      <div style={{
        borderBottom: '1px solid var(--ifm-color-emphasis-200)',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {['Basic Info', 'Business Context', 'Technical', 'Platform Implementation', 'Data Mappings', 'SQL', 'Documentation'].map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === idx ? '2px solid var(--ifm-color-primary)' : '2px solid transparent',
                color: activeTab === idx ? 'var(--ifm-color-primary)' : 'var(--ifm-font-color-base)',
                fontWeight: activeTab === idx ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ minHeight: '400px' }}>
        {activeTab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Formula</label>
              <input
                type="text"
                value={formData.formula}
                onChange={(e) => setFormData((prev) => ({ ...prev, formula: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontFamily: 'monospace',
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
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
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
        )}

        {activeTab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Industry</label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                }}
              >
                <option value="">None</option>
                {INDUSTRIES.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                }}
              >
                <option value="">None</option>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Core Area</label>
              <input
                type="text"
                value={formData.core_area}
                onChange={(e) => setFormData((prev) => ({ ...prev, core_area: e.target.value }))}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Scope</label>
              <select
                value={formData.scope}
                onChange={(e) => setFormData((prev) => ({ ...prev, scope: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                }}
              >
                <option value="">None</option>
                {SCOPES.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Related KPIs</label>
              <input
                type="text"
                value={relatedInput}
                onChange={(e) => setRelatedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRelated();
                  }
                }}
                placeholder="Add related KPI slug and press Enter"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {formData.related_kpis.map((item) => (
                  <span
                    key={item}
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
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveRelated(item)}
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
        )}

        {activeTab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>KPI Type</label>
              <select
                value={formData.kpi_type}
                onChange={(e) => setFormData((prev) => ({ ...prev, kpi_type: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                }}
              >
                <option value="">None</option>
                {KPI_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Measure</label>
              <input
                type="text"
                value={formData.measure}
                onChange={(e) => setFormData((prev) => ({ ...prev, measure: e.target.value }))}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Aggregation Window</label>
              <input
                type="text"
                value={formData.aggregation_window}
                onChange={(e) => setFormData((prev) => ({ ...prev, aggregation_window: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '1rem',
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>GA4 Implementation</label>
              <textarea
                value={formData.ga4_implementation}
                onChange={(e) => setFormData((prev) => ({ ...prev, ga4_implementation: e.target.value }))}
                rows={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Adobe Implementation</label>
              <textarea
                value={formData.adobe_implementation}
                onChange={(e) => setFormData((prev) => ({ ...prev, adobe_implementation: e.target.value }))}
                rows={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Amplitude Implementation</label>
              <textarea
                value={formData.amplitude_implementation}
                onChange={(e) => setFormData((prev) => ({ ...prev, amplitude_implementation: e.target.value }))}
                rows={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Data Layer Mapping</label>
              <textarea
                value={formData.data_layer_mapping}
                onChange={(e) => setFormData((prev) => ({ ...prev, data_layer_mapping: e.target.value }))}
                rows={8}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>XDM Mapping</label>
              <textarea
                value={formData.xdm_mapping}
                onChange={(e) => setFormData((prev) => ({ ...prev, xdm_mapping: e.target.value }))}
                rows={8}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--ifm-color-emphasis-300)',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 5 && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>SQL Query</label>
            <textarea
              value={formData.sql_query}
              onChange={(e) => setFormData((prev) => ({ ...prev, sql_query: e.target.value }))}
              rows={15}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--ifm-color-emphasis-300)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            />
          </div>
        )}

        {activeTab === 6 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Calculation Notes</label>
              <textarea
                value={formData.calculation_notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, calculation_notes: e.target.value }))}
                rows={8}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Details</label>
              <textarea
                value={formData.details}
                onChange={(e) => setFormData((prev) => ({ ...prev, details: e.target.value }))}
                rows={10}
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
          </div>
        )}
      </div>
    </main>
  );
}
