import React from 'react';
import type { User, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import AuthClientProvider from './AuthClientProvider';
import { currentAppEnv } from '@/src/types/entities';
type Role = 'admin' | 'editor' | 'contributor';
type UserProfileRow = {
  id: string;
  user_role: Role | null;
  role?: Role | null;
  is_admin?: boolean | null;
  is_editor?: boolean | null;
  [key: string]: unknown;
};

async function resolveUserRole(supabase: SupabaseClient, user: User) {
	const appEnv = currentAppEnv();

	const { data: profile, error } = await supabase
		.from('user_profiles')
		.select('user_role, role, is_admin, is_editor')
		.eq('id', user.id)
		.eq('app_env', appEnv)
		.maybeSingle();

	if (error && (error as PostgrestError).code !== 'PGRST116') {
		console.error('[AuthProvider] Error loading profile:', error);
	}

	let profileData = profile;

	const githubUsername =
		(user.user_metadata?.user_name as string | undefined) ||
		(user.user_metadata?.preferred_username as string | undefined) ||
		null;
	const fullName = (user.user_metadata?.full_name as string | undefined) || null;
	const email = user.email || null;
	const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) || null;

	if (!profileData) {
		const { data: inserted, error: insertError } = await supabase
			.from('user_profiles')
			.insert({
				id: user.id,
				app_env: appEnv,
				user_role: 'contributor',
				github_username: githubUsername,
				full_name: fullName,
				email,
				avatar_url: avatarUrl,
				role: 'user',
				is_editor: false,
				is_admin: false,
				last_active_at: new Date().toISOString(),
			})
			.select('user_role, role, is_admin, is_editor')
			.single();
		if (insertError) {
			console.error('[AuthProvider] Error creating profile:', insertError);
		} else {
			profileData = inserted;
		}
	} else {
		const { error: updateError } = await supabase
			.from('user_profiles')
			.update({
				app_env: appEnv,
				github_username: githubUsername,
				full_name: fullName,
				email,
				avatar_url: avatarUrl,
				last_active_at: new Date().toISOString(),
			})
			.eq('id', user.id)
			.eq('app_env', appEnv);
		if (updateError) {
			console.error('[AuthProvider] Error updating profile:', updateError);
		}
	}

	const resolvedRole =
		(profileData?.user_role ||
			profileData?.role ||
			(user.user_metadata?.user_role as string | undefined) ||
			'contributor')?.toString().toLowerCase() as Role;

	if (resolvedRole === 'admin' || resolvedRole === 'editor') {
		return resolvedRole;
	}
	if (profileData?.is_admin) return 'admin';
	if (profileData?.is_editor) return 'editor';
	return 'contributor';
}

export default async function AuthProvider({ children }: { children: React.ReactNode }) {
	const supabase = await createClient();
	const {
		data: { session },
	} = await supabase.auth.getSession();

	const initialUser = session?.user ?? null;
	const initialRole: Role = initialUser ? await resolveUserRole(supabase, initialUser) : 'contributor';

	return (
		<AuthClientProvider initialSession={session ?? null} initialUser={initialUser} initialRole={initialRole}>
			{children}
		</AuthClientProvider>
	);
}
