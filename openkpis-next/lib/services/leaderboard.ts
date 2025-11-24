import type { SupabaseClient } from '@supabase/supabase-js';
import { withTablePrefix, currentAppEnv } from '@/src/types/entities';

export type LeaderboardRow = {
	userId: string; // canonical handle we display (prefers github username)
	full_name?: string | null;
	github_username?: string | null;
	avatar_url?: string | null;
	total_kpis: number;
	total_events: number;
	total_dimensions: number;
	total_metrics: number;
	total_contributions: number;
};

type CountsByHandle = Record<
	string,
	{
		kpis: number;
		events: number;
		dimensions: number;
		metrics: number;
	}
>;

async function fetchCreatedBy(client: SupabaseClient, table: string): Promise<string[]> {
	const result: string[] = [];
	const from = client.from(table).select('created_by');
	// No filtering by status by default; count all authored items
	const { data, error } = await from;
	if (error) {
		// Log and continue with empty
		// eslint-disable-next-line no-console
		console.error('[Leaderboard] Failed to fetch created_by from', table, error);
		return result;
	}
	for (const row of data as Array<{ created_by?: string | null }>) {
		if (row.created_by && typeof row.created_by === 'string') {
			result.push(row.created_by.trim());
		}
	}
	return result;
}

export async function computeLeaderboard(client: SupabaseClient): Promise<LeaderboardRow[]> {
	const tables = {
		kpis: withTablePrefix('kpis'),
		events: withTablePrefix('events'),
		dimensions: withTablePrefix('dimensions'),
		metrics: withTablePrefix('metrics'),
	};

	// Fetch created_by lists for each entity type in parallel
	const [kpiAuthors, eventAuthors, dimensionAuthors, metricAuthors] = await Promise.all([
		fetchCreatedBy(client, tables.kpis),
		fetchCreatedBy(client, tables.events),
		fetchCreatedBy(client, tables.dimensions),
		fetchCreatedBy(client, tables.metrics),
	]);

	const counts: CountsByHandle = {};
	const ensure = (handle: string) => {
		if (!counts[handle]) {
			counts[handle] = { kpis: 0, events: 0, dimensions: 0, metrics: 0 };
		}
		return counts[handle];
	};

	for (const uid of kpiAuthors) ensure(uid).kpis++;
	for (const uid of eventAuthors) ensure(uid).events++;
	for (const uid of dimensionAuthors) ensure(uid).dimensions++;
	for (const uid of metricAuthors) ensure(uid).metrics++;

	const handles = Object.keys(counts);
	if (handles.length === 0) return [];

	// Fetch display info from user_profiles for this app env by github_username and by email
	const appEnv = currentAppEnv();
	const { data: profilesByGithub, error: errorGithub } = await client
		.from('user_profiles')
		.select('id, full_name, github_username, email, avatar_url, app_env')
		.in('github_username', handles)
		.eq('app_env', appEnv);

	const { data: profilesByEmail, error: errorEmail } = await client
		.from('user_profiles')
		.select('id, full_name, github_username, email, avatar_url, app_env')
		.in('email', handles)
		.eq('app_env', appEnv);

	if (errorGithub && (errorGithub as unknown as { message?: string }).message) {
		// eslint-disable-next-line no-console
		console.error('[Leaderboard] Failed to fetch user profiles by github_username', errorGithub);
	}
	if (errorEmail && (errorEmail as unknown as { message?: string }).message) {
		// eslint-disable-next-line no-console
		console.error('[Leaderboard] Failed to fetch user profiles by email', errorEmail);
	}

	type Profile = { id: string; full_name?: string | null; github_username?: string | null; email?: string | null; avatar_url?: string | null };
	const profileByGithub = new Map<string, Profile>();
	const profileByEmail = new Map<string, Profile>();
	for (const p of ((profilesByGithub as Profile[] | null) || [])) {
		if (p.github_username) profileByGithub.set(p.github_username, p);
	}
	for (const p of ((profilesByEmail as Profile[] | null) || [])) {
		if (p.email) profileByEmail.set(p.email, p);
	}

	const rows: LeaderboardRow[] = handles.map((handle) => {
		const c = counts[handle];
		const total = c.kpis + c.events + c.dimensions + c.metrics;
		// Prefer mapping by github username first, then fallback to email match
		let prof: Profile | undefined = profileByGithub.get(handle);
		if (!prof && handle.includes('@')) {
			prof = profileByEmail.get(handle);
		}
		// Derive display handle: prefer profile.github_username, else if handle looks like username use it
		const ghUser = prof?.github_username || (handle.includes('@') ? null : handle);
		return {
			userId: ghUser || handle,
			full_name: prof?.full_name ?? null,
			github_username: ghUser ?? null,
			avatar_url: prof?.avatar_url ?? null,
			total_kpis: c.kpis,
			total_events: c.events,
			total_dimensions: c.dimensions,
			total_metrics: c.metrics,
			total_contributions: total,
		};
	});

	rows.sort((a, b) => b.total_contributions - a.total_contributions);
	return rows;
}


