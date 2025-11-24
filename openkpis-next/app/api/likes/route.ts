import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addLike, loadLikeSummary, removeLike } from '@/lib/services/likes';
import type { EntityKind } from '@/src/types/entities';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type LikePayload = {
	itemType?: string;
	itemId?: string;
	itemSlug?: string;
};

const ALLOWED_TYPES: ReadonlySet<EntityKind> = new Set(['kpi', 'metric', 'dimension', 'event', 'dashboard']);

function isEntityKind(value: unknown): value is EntityKind {
	return typeof value === 'string' && ALLOWED_TYPES.has(value as EntityKind);
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

async function resolveUserId() {
	const supabase = await createClient();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error) {
		throw error;
	}

	return { supabase, userId: user?.id ?? null };
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const itemType = searchParams.get('itemType');
	const itemId = searchParams.get('itemId');

	if (!isEntityKind(itemType) || !isNonEmptyString(itemId)) {
		return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
	}

	try {
		const { supabase, userId } = await resolveUserId();
		const summary = await loadLikeSummary(supabase, { itemType, itemId, userId });
		return NextResponse.json(summary);
	} catch (error) {
		console.error('[LikesAPI] Failed to load summary:', error);
		return NextResponse.json({ error: 'Failed to load likes' }, { status: 500 });
	}
}

export async function POST(request: Request) {
	let payload: LikePayload;
	try {
		payload = await request.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
	}

	const { itemType, itemId, itemSlug } = payload;

	if (!isEntityKind(itemType) || !isNonEmptyString(itemId) || !isNonEmptyString(itemSlug)) {
		return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
	}

	try {
		const { supabase, userId } = await resolveUserId();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await addLike(supabase, { itemType, itemId, itemSlug, userId });
		const summary = await loadLikeSummary(supabase, { itemType, itemId, userId });
		return NextResponse.json(summary);
	} catch (error) {
		console.error('[LikesAPI] Failed to add like:', error);
		return NextResponse.json({ error: 'Failed to add like' }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	let payload: LikePayload;
	try {
		payload = await request.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
	}

	const { itemType, itemId } = payload;

	if (!isEntityKind(itemType) || !isNonEmptyString(itemId)) {
		return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
	}

	try {
		const { supabase, userId } = await resolveUserId();
		if (!userId) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await removeLike(supabase, { itemType, itemId, userId });
		const summary = await loadLikeSummary(supabase, { itemType, itemId, userId });
		return NextResponse.json(summary);
	} catch (error) {
		console.error('[LikesAPI] Failed to remove like:', error);
		return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 });
	}
}

