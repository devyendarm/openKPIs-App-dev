'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

export interface KPIListItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  tags?: string[] | null;
  category?: string | null;
  industry?: string[] | null;
  status: 'draft' | 'published' | 'archived';
  created_by?: string | null;
}

interface KPIsClientProps {
  items: KPIListItem[];
  initialUser: User | null;
}

export default function KPIsClient({ items, initialUser }: KPIsClientProps) {
  const searchParams = useSearchParams();
  const debugMode = (searchParams.get('debug') || '') === '1';

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const [tagFilter, setTagFilter] = useState(searchParams.get('tag') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [industryFilter, setIndustryFilter] = useState(searchParams.get('industry') || '');

  const tags = useMemo(
    () => Array.from(new Set(items.flatMap((kpi) => kpi.tags || []))).sort(),
    [items],
  );
  const categories = useMemo(
    () => Array.from(new Set(items.map((kpi) => kpi.category).filter(Boolean) as string[])).sort(),
    [items],
  );
  const industries = useMemo(
    () => Array.from(new Set(items.flatMap((kpi) => kpi.industry || []))).sort(),
    [items],
  );

  const filteredKPIs = useMemo(() => {
    if (debugMode) return items;
    const queryLower = searchQuery.trim().toLowerCase();
    return items.filter((kpi) => {
      const searchableText = [
        kpi.name,
        kpi.description,
        ...(kpi.tags || []),
        kpi.category,
        ...(kpi.industry || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchQuery = !queryLower || searchableText.includes(queryLower);
      const matchTag = !tagFilter || (kpi.tags || []).includes(tagFilter);
      const matchCategory = !categoryFilter || kpi.category === categoryFilter;
      const matchIndustry = !industryFilter || (kpi.industry || []).includes(industryFilter);

      return matchQuery && matchTag && matchCategory && matchIndustry;
    });
  }, [items, searchQuery, tagFilter, categoryFilter, industryFilter, debugMode]);

  const user = initialUser;

  return (
    <main className="page-main-wide">
      <div className="page-header">
        <div className="page-header-main">
          <h1 className="page-header-title">KPIs</h1>
          <p className="page-header-subtitle">
            Standardized KPI definitions with formulas, implementation guides, and platform equivalents.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/kpis/new" prefetch={false} className="btn btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Add New KPI
          </Link>
        </div>
      </div>

      <div className="kpi-filters">
        <div className="kpi-filters-field" style={{ flex: '1 1 200px' }}>
          <label className="form-label">Search</label>
          <input
            type="text"
            placeholder="Search KPIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="kpi-filters-input"
          />
        </div>

        <div className="kpi-filters-field">
          <label className="form-label">Tag</label>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="kpi-filters-input"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className="kpi-filters-field">
          <label className="form-label">Category</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="kpi-filters-input"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="kpi-filters-field">
          <label className="form-label">Industry</label>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="kpi-filters-input"
          >
            <option value="">All Industries</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="kpi-count">
        {`${filteredKPIs.length} ${filteredKPIs.length === 1 ? 'KPI' : 'KPIs'} found`}
      </div>

      {debugMode && (
        <div className="msg msg-warning" style={{ margin: '1rem 0' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Debug (not visible in production):</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
            loaded={items.length} filtered={filteredKPIs.length} user={(user?.email || user?.user_metadata?.user_name || 'none')}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 6 }}>
            slugs: {items.slice(0, 5).map((kpi) => kpi.slug).join(', ')}
          </div>
        </div>
      )}

      <div className="kpi-grid">
        {filteredKPIs.map((kpi) => (
          <Link
            key={kpi.id}
            href={`/kpis/${kpi.slug}`}
            prefetch={false}
            className="kpi-card-link"
          >
            <div className="kpi-card">
              <div className="kpi-card-header">
                <h3 className="kpi-card-title">
                  {kpi.name}
                  {kpi.status === 'draft' && (
                    <span className="kpi-card-draft">Draft</span>
                  )}
                </h3>
              </div>

              {kpi.description && <p className="kpi-card-description">{kpi.description}</p>}

              <div className="kpi-card-tags">
                {kpi.category && (
                  <span className="kpi-card-tag">
                    {kpi.category}
                  </span>
                )}
                {kpi.tags &&
                  kpi.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="kpi-card-tag">
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredKPIs.length === 0 && (
        <div className="empty-state">
          <p>No KPIs found. Try adjusting your filters.</p>
          {!user && (
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              <Link href="/kpis/new" prefetch={false} style={{ color: 'var(--ifm-color-primary)' }}>
                Create the first KPI
              </Link>
            </p>
          )}
        </div>
      )}
    </main>
  );
}


