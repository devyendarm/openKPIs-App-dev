'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

import type { AnyEntity } from '@/src/types/entities';

type FavoriteRecord = {
  item_type: 'kpi' | 'event' | 'dimension' | 'metric' | 'dashboard';
  item_id: string;
  item_slug: string | null;
  item_data: AnyEntity | null;
};

type ContributionRecord = {
  id: string;
  item_type: string;
  item_slug: string;
  action: string;
  created_at: string;
};

type Stats = {
  totalKPIs: number;
  totalEvents: number;
  totalDimensions: number;
  totalMetrics: number;
  totalLikes: number;
};

interface MyProfileClientProps {
  user: User;
  stats: Stats;
  favorites: FavoriteRecord[];
  contributions: ContributionRecord[];
}

export default function MyProfileClient({
  user,
  stats,
  favorites,
  contributions,
}: MyProfileClientProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'contributions'>('favorites');

  const userName =
    (user.user_metadata?.user_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    'User';
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) || null;

  const favoritesByType = useMemo(
    () => ({
      kpis: favorites.filter((f) => f.item_type === 'kpi' && f.item_data),
      events: favorites.filter((f) => f.item_type === 'event' && f.item_data),
      dimensions: favorites.filter((f) => f.item_type === 'dimension' && f.item_data),
      metrics: favorites.filter((f) => f.item_type === 'metric' && f.item_data),
      dashboards: favorites.filter((f) => f.item_type === 'dashboard' && f.item_data),
    }),
    [favorites]
  );

  const renderFavoriteSection = (items: FavoriteRecord[], label: string, basePath: string) => {
    if (!items.length) return null;

    return (
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
          {label} ({items.length})
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
          }}
        >
          {items.map((f) => {
            const itemName = f.item_data?.name || 'Unknown';
            const itemDescription = f.item_data?.description;
            const itemCategory = f.item_data?.category;
            const itemSlug = f.item_slug || f.item_data?.slug || '';
            const linkHref = itemSlug ? `${basePath}/${itemSlug}` : basePath;
            return (
              <div
                key={`${f.item_type}-${f.item_id}`}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--ifm-color-emphasis-50)',
                  borderRadius: '8px',
                  border: '1px solid var(--ifm-color-emphasis-200)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{itemName}</div>
                {itemDescription && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)', margin: 0 }}>
                    {itemDescription}
                  </p>
                )}
                {itemCategory && (
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: 'var(--ifm-color-emphasis-100)',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      color: 'var(--ifm-color-emphasis-700)',
                    }}
                  >
                    {itemCategory}
                  </span>
                )}
                <div style={{ marginTop: 'auto' }}>
                  <Link
                    href={linkHref}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--ifm-color-primary)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt={userName}
              width={64}
              height={64}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '2px solid var(--ifm-color-primary)',
                objectFit: 'cover',
              }}
              unoptimized
            />
          )}
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.25rem' }}>{userName}</h1>
            <p style={{ color: 'var(--ifm-color-emphasis-600)', fontSize: '0.875rem' }}>{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--ifm-color-emphasis-50)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--ifm-color-primary)' }}>
              {stats.totalKPIs}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)' }}>KPIs</div>
          </div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--ifm-color-emphasis-50)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--ifm-color-primary)' }}>
              {stats.totalEvents}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)' }}>Events</div>
          </div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--ifm-color-emphasis-50)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--ifm-color-primary)' }}>
              {stats.totalDimensions}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)' }}>Dimensions</div>
          </div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--ifm-color-emphasis-50)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--ifm-color-primary)' }}>
              {stats.totalMetrics}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)' }}>Metrics</div>
          </div>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--ifm-color-emphasis-50)',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--ifm-color-primary)' }}>
              {favorites.length}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-700)' }}>Favorites</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
          <button
            onClick={() => setActiveTab('favorites')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              backgroundColor: 'transparent',
              color:
                activeTab === 'favorites'
                  ? 'var(--ifm-color-primary)'
                  : 'var(--ifm-color-emphasis-700)',
              borderBottom:
                activeTab === 'favorites' ? '2px solid var(--ifm-color-primary)' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'favorites' ? 600 : 400,
            }}
          >
            Favorites
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              backgroundColor: 'transparent',
              color:
                activeTab === 'contributions'
                  ? 'var(--ifm-color-primary)'
                  : 'var(--ifm-color-emphasis-700)',
              borderBottom:
                activeTab === 'contributions'
                  ? '2px solid var(--ifm-color-primary)'
                  : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'contributions' ? 600 : 400,
            }}
          >
            Contributions
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--ifm-color-emphasis-600)',
              }}
            >
              <p>No favorites yet. Start exploring and like items you find useful!</p>
              <Link
                href="/kpis"
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--ifm-color-primary)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                }}
              >
                Browse KPIs
              </Link>
            </div>
          ) : (
            <div>
              {renderFavoriteSection(favoritesByType.kpis, 'Favorite KPIs', '/kpis')}
              {renderFavoriteSection(favoritesByType.events, 'Favorite Events', '/events')}
              {renderFavoriteSection(favoritesByType.dimensions, 'Favorite Dimensions', '/dimensions')}
              {renderFavoriteSection(favoritesByType.metrics, 'Favorite Metrics', '/metrics')}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contributions' && (
        <div>
          {contributions.length === 0 ? (
            <div
              style={{
                padding: '3rem',
                textAlign: 'center',
                color: 'var(--ifm-color-emphasis-600)',
              }}
            >
              <p>No contributions yet. Start creating or editing KPIs!</p>
              <Link
                href="/kpis/new"
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'var(--ifm-color-primary)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                }}
              >
                Create New KPI
              </Link>
            </div>
          ) : (
            <div>
              {contributions.map((contribution) => (
                <div
                  key={contribution.id}
                  style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    backgroundColor: 'var(--ifm-color-emphasis-50)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {contribution.action} {contribution.item_type}: {contribution.item_slug}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--ifm-color-emphasis-600)' }}>
                      {new Date(contribution.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Link
                    href={`/${contribution.item_type}/${contribution.item_slug}`}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--ifm-color-primary)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}


