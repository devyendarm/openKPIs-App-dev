'use client';

import Catalog from '@/components/Catalog';

export default function DashboardsPage() {
  return (
    <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>
      <Catalog section="dashboards" />
    </main>
  );
}

