'use client';

import React from 'react';
import Link from 'next/link';
import type { EntityKind } from '@/src/types/entities';
import { useEntity } from '@/hooks/useEntity';
import LikeButton from '@/components/LikeButton';
import AddToAnalysisButton from '@/components/AddToAnalysisButton';

interface Props {
	kind: EntityKind;
	slug: string;
}

function getPath(kind: EntityKind): string {
	switch (kind) {
		case 'kpi': return '/kpis';
		case 'event': return '/events';
		case 'dimension': return '/dimensions';
		case 'metric': return '/metrics';
		case 'dashboard': return '/dashboards';
		default: return '/';
	}
}

export default function EntityDetail({ kind, slug }: Props) {
	const { item, loading, error } = useEntity(kind, slug);

	if (loading) {
		return (
			<main style={{ padding: '2rem', textAlign: 'center' }}>
				<p>Loading...</p>
			</main>
		);
	}

	if (error || !item) {
		return (
			<main style={{ padding: '2rem', textAlign: 'center' }}>
				<h1>Not found</h1>
				<Link href={getPath(kind)} style={{ color: 'var(--ifm-color-primary)' }}>
					← Back
				</Link>
			</main>
		);
	}

	return (
		<main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
			<Link href={getPath(kind)} style={{ color: 'var(--ifm-color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}>
				← Back
			</Link>
			<h1 style={{ fontSize: '2rem', fontWeight: 600, marginTop: '0.5rem' }}>{item.name}</h1>
			{item.description ? (
				<p style={{ color: 'var(--ifm-color-emphasis-700)' }}>{item.description}</p>
			) : null}

			{/* Tags/category */}
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
				{item.category ? (
					<span style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--ifm-color-emphasis-100)', borderRadius: 999, fontSize: '0.75rem' }}>
						{item.category}
					</span>
				) : null}
				{(item.tags ?? []).map((t) => (
					<span key={t} style={{ padding: '0.25rem 0.75rem', backgroundColor: 'var(--ifm-color-emphasis-100)', borderRadius: 999, fontSize: '0.75rem' }}>
						{t}
					</span>
				))}
			</div>

			{/* Actions */}
			<div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
				<LikeButton itemType={kind} itemId={item.id} itemSlug={item.slug} />
				<AddToAnalysisButton itemType={kind} itemId={item.id} itemSlug={item.slug} itemName={item.name} />
			</div>
		</main>
	);
}




