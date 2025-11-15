'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LikeButton from '@/components/LikeButton';
import AddToAnalysisButton from '@/components/AddToAnalysisButton';
import { supabase } from '@/lib/supabase';

export default function MetricDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [metric, setMetric] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      supabase
        .from('metrics')
        .select('*')
        .eq('slug', slug)
        .single()
        .then(({ data }) => setMetric(data))
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </main>
    );
  }

  if (!metric) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Metric not found</h1>
        <Link href="/metrics" style={{ color: 'var(--ifm-color-primary)' }}>
          ← Back to Metrics
        </Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/metrics" style={{ color: 'var(--ifm-color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
        ← Back to Metrics
      </Link>
      <h1 style={{ fontSize: '2rem', fontWeight: 600, marginTop: '0.5rem' }}>{metric.name}</h1>
      {metric.description && <p style={{ color: 'var(--ifm-color-emphasis-700)' }}>{metric.description}</p>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
        {metric && (
          <>
            <LikeButton itemType="metric" itemId={metric.id} itemSlug={metric.slug} />
            <AddToAnalysisButton
              itemType="metric"
              itemId={metric.id}
              itemSlug={metric.slug}
              itemName={metric.name}
            />
          </>
        )}
      </div>
      {metric.formula && (
        <div style={{ background: 'var(--ifm-color-emphasis-50)', border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: 8, padding: '1rem', margin: '1rem 0' }}>
          <strong>Formula:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{metric.formula}</pre>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
        {metric.category && (
          <span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--ifm-color-emphasis-100)', borderRadius: 999, fontSize: '0.75rem' }}>
            {metric.category}
          </span>
        )}
        {(metric.tags || []).map((t: string) => (
          <span key={t} style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--ifm-color-emphasis-100)', borderRadius: 999, fontSize: '0.75rem' }}>
            {t}
          </span>
        ))}
      </div>
    </main>
  );
}




