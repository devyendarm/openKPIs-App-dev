import React from 'react';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import GiscusComments from '@/components/GiscusComments';
import Sidebar from '@/components/Sidebar';
import TableOfContents from '@/components/TableOfContents';
import LikeButton from '@/components/LikeButton';
import AddToAnalysisButton from '@/components/AddToAnalysisButton';
import { withTablePrefix } from '@/src/types/entities';
import { collectUserIdentifiers } from '@/lib/server/entities';

const eventsTable = withTablePrefix('events');

type EventRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  tags?: string[] | string | null;
  status: 'draft' | 'published' | 'archived';
  created_by?: string | null;
  created_at?: string | null;
};

function toStringArray(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((entry): entry is string => typeof entry === 'string');
        }
      } catch {
        return [trimmed];
      }
    }
    return [trimmed];
  }
  return [];
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const { data: rawEvent, error } = await admin
    .from(eventsTable)
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  const event = rawEvent as EventRow | null;

  if (error || !event) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Event Not Found</h1>
        <Link href="/events" style={{ color: 'var(--ifm-color-primary)' }}>← Back to Events</Link>
      </main>
    );
  }

  const identifiers = collectUserIdentifiers(user);
  const isOwner = event.created_by ? identifiers.includes(event.created_by) : false;
  const isVisible = event.status === 'published' || isOwner;

  if (!isVisible) {
    return (
      <main style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Event Not Available</h1>
        <p style={{ color: 'var(--ifm-color-emphasis-600)' }}>
          This event is still in draft. Sign in with the account that created it to view the content.
        </p>
        <Link href="/events" style={{ color: 'var(--ifm-color-primary)' }}>← Back to Events</Link>
      </main>
    );
  }

  const normalizedEvent = {
    ...event,
    tags: toStringArray(event.tags),
  };

  const canEdit = isOwner && normalizedEvent.status === 'draft';

  return (
    <main style={{ maxWidth: '100%', margin: '0 auto', padding: '2rem 1rem', overflowX: 'hidden' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(200px, 250px) minmax(0, 1fr) minmax(200px, 280px)', 
        gap: '1.5rem',
        width: '100%',
        maxWidth: '100%',
      }}>
        <Sidebar section="events" />

        <article style={{ minWidth: 0, overflowWrap: 'break-word', wordWrap: 'break-word' }}>
          <div style={{
            marginBottom: '2rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--ifm-color-emphasis-200)',
          }}>
            <Link href="/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--ifm-color-primary)', textDecoration: 'none', marginBottom: '1rem' }}>
              ← Back to Events
            </Link>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {normalizedEvent.name}
                  {normalizedEvent.status === 'draft' && (
                    <span style={{
                      marginLeft: '0.75rem',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#fbbf24',
                      color: '#78350f',
                      borderRadius: '4px',
                    }}>
                      Draft
                    </span>
                  )}
                </h1>
                {normalizedEvent.description && (
                  <p style={{ fontSize: '1.125rem', color: 'var(--ifm-color-emphasis-600)' }}>
                    {normalizedEvent.description}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <LikeButton itemType="event" itemId={normalizedEvent.id} itemSlug={normalizedEvent.slug} />
                <AddToAnalysisButton
                  itemType="event"
                  itemId={normalizedEvent.id}
                  itemSlug={normalizedEvent.slug}
                  itemName={normalizedEvent.name}
                />
                {canEdit && (
                  <Link
                    href={`/events/${slug}/edit`}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: 'var(--ifm-color-primary)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Edit
                  </Link>
                )}
              </div>
            </div>
          </div>
          <section id="details" style={{ marginBottom: '3rem' }}>
            <h2 id="event-details" style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Event Details</h2>
            <div style={{ backgroundColor: 'var(--ifm-color-emphasis-50)', borderRadius: '12px', padding: '2rem' }}>
              {normalizedEvent.category && <div style={{ marginBottom: '1rem' }}><strong>Category:</strong> {normalizedEvent.category}</div>}
              {normalizedEvent.tags && normalizedEvent.tags.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Tags:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {normalizedEvent.tags.map((tag: string) => (
                      <span key={tag} style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--ifm-color-primary)', color: 'white', borderRadius: '4px', fontSize: '0.875rem' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '0.75rem' }}><strong>Created by:</strong> {normalizedEvent.created_by}</div>
              {normalizedEvent.created_at && (
                <div><strong>Created at:</strong> {new Date(normalizedEvent.created_at).toLocaleDateString()}</div>
              )}
            </div>
          </section>

          <div style={{ marginTop: '3rem' }}>
            <GiscusComments term={slug} category="events" />
          </div>
        </article>

        <TableOfContents />
      </div>
    </main>
  );
}

