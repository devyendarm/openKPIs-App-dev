import React from 'react';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { STATUS } from '@/lib/supabase/auth';
import { fetchMetricBySlug } from '@/lib/server/metrics';
import MetricEditClient from './MetricEditClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MetricEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Sign in required</h1>
        <p style={{ color: 'var(--ifm-color-emphasis-700)' }}>
          Please sign in with GitHub to edit metrics.
        </p>
        <Link href={`/metrics/${slug}`} style={{ color: 'var(--ifm-color-primary)' }}>
          ← Back to Metric
        </Link>
      </main>
    );
  }

  const admin = createAdminClient();
  const metric = await fetchMetricBySlug(admin, slug);

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

  const userName =
    (user.user_metadata?.user_name as string | undefined) ||
    user.email ||
    null;

  const isOwner = !!userName && metric.created_by === userName;

  if (!isOwner || metric.status !== STATUS.DRAFT) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Edit unavailable</h1>
        <p style={{ color: 'var(--ifm-color-emphasis-700)' }}>
          Once a metric is published it can only be updated through Editorial Review.
        </p>
        <Link href={`/metrics/${slug}`} style={{ color: 'var(--ifm-color-primary)' }}>
          ← Back to Metric
        </Link>
      </main>
    );
  }

  return <MetricEditClient metric={metric} slug={slug} canEdit />;
}





