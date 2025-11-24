import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type { EntityKind } from '@/src/types/entities';
import { withTablePrefix } from '@/src/types/entities';

const likesTable = withTablePrefix('likes');

export type LikeSummary = {
	count: number;
	liked: boolean;
};

type BaseParams = {
	itemType: EntityKind;
	itemId: string;
};

type WithUser = BaseParams & {
	userId: string;
};

type WithUserAndSlug = WithUser & {
	itemSlug: string;
};

function normalizeCount(value: number | null): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function isUniqueViolation(error: PostgrestError): boolean {
	return error.code === '23505' || error.details?.includes('duplicate key value');
}

export async function loadLikeSummary(
	client: SupabaseClient,
	params: BaseParams & { userId?: string | null }
): Promise<LikeSummary> {
	const { itemType, itemId, userId } = params;

	const { count, error: countError } = await client
		.from(likesTable)
		.select('*', { count: 'exact', head: true })
		.eq('item_type', itemType)
		.eq('item_id', itemId);

	if (countError) {
		throw countError;
	}

	if (!userId) {
		return { count: normalizeCount(count), liked: false };
	}

	const { data, error: likeError } = await client
		.from(likesTable)
		.select('id')
		.eq('item_type', itemType)
		.eq('item_id', itemId)
		.eq('user_id', userId)
		.limit(1);

	if (likeError) {
		throw likeError;
	}

	const liked = Array.isArray(data) && data.length > 0;

	return {
		count: normalizeCount(count),
		liked,
	};
}

export async function addLike(client: SupabaseClient, params: WithUserAndSlug): Promise<void> {
	const { itemType, itemId, itemSlug, userId } = params;
	const { error } = await client.from(likesTable).insert({
		user_id: userId,
		item_type: itemType,
		item_id: itemId,
		item_slug: itemSlug,
	});

	if (error && !isUniqueViolation(error)) {
		throw error;
	}
}

export async function removeLike(client: SupabaseClient, params: WithUser): Promise<void> {
	const { itemType, itemId, userId } = params;
	const { error } = await client
		.from(likesTable)
		.delete()
		.eq('item_type', itemType)
		.eq('item_id', itemId)
		.eq('user_id', userId);

	if (error) {
		throw error;
	}
}

