import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateEntityDraftAndSync } from '@/lib/services/entityUpdates';
import type { EntityKind } from '@/src/types/entities';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_KINDS: readonly EntityKind[] = ['kpi', 'metric', 'dimension', 'event', 'dashboard'];

function isEntityKind(value: unknown): value is EntityKind {
	return typeof value === 'string' && (ALLOWED_KINDS as readonly string[]).includes(value);
}

type UpdateBody = {
	data?: Record<string, unknown>;
};

export async function PUT(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
	try {
		const { kind, id } = await params;

		if (!isEntityKind(kind)) {
			return NextResponse.json({ error: 'Unsupported entity type' }, { status: 400 });
		}

		let body: UpdateBody;
		try {
			body = (await request.json()) as UpdateBody;
		} catch {
			return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
		}

		if (!body?.data || typeof body.data !== 'object') {
			return NextResponse.json({ error: 'Missing data payload' }, { status: 400 });
		}

		const supabase = await createClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError) {
			return NextResponse.json({ error: authError.message || 'Authentication failed' }, { status: 401 });
		}

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const result = await updateEntityDraftAndSync({
			kind,
			id,
			data: body.data,
			user,
			userClient: supabase,
		});

		return NextResponse.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to save entity';
		console.error('[ItemsAPI] Save failed:', error);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

