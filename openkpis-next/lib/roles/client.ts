import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase/auth';

export type UserRole = 'admin' | 'editor' | 'contributor';

export async function getUserRoleClient(): Promise<UserRole> {
	const user = await getCurrentUser();
	if (!user) return 'contributor';

	const metaRole = (user.user_metadata?.user_role as string | undefined)?.toLowerCase();
	if (metaRole === 'admin' || metaRole === 'editor') return metaRole;

	const { data } = (await supabase
		.from('user_profiles')
		.select('user_role, role, is_admin, is_editor')
		.eq('id', user.id)
		.maybeSingle()) as any;

	let role =
		(data?.user_role ||
			data?.role ||
			(user.user_metadata?.user_role as string | undefined) ||
			'contributor')?.toString().toLowerCase();

	if (!['editor', 'admin'].includes(role)) {
		if (data?.is_admin) {
			role = 'admin';
		} else if (data?.is_editor) {
			role = 'editor';
		}
	}

	if (role === 'admin') return 'admin';
	if (role === 'editor') return 'editor';
	return 'contributor';
}




