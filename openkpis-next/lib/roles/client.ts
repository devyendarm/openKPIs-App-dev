import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase/auth';
import { withTablePrefix } from '@/src/types/entities';
export type UserRole = 'admin' | 'editor' | 'contributor';

type UserProfileRow = {
  user_role?: UserRole | null;
  role?: UserRole | null;
  is_admin?: boolean | null;
  is_editor?: boolean | null;
};

export async function getUserRoleClient(): Promise<UserRole> {
	const user = await getCurrentUser();
	if (!user) return 'contributor';

	const metaRole = (user.user_metadata?.user_role as string | undefined)?.toLowerCase();
	if (metaRole === 'admin' || metaRole === 'editor') return metaRole;

	const { data } = await supabase
		.from(withTablePrefix('user_profiles'))
		.select('user_role, role, is_admin, is_editor')
		.eq('id', user.id)
		.maybeSingle();

	const profileData = data as UserProfileRow | null;

	const candidate =
		profileData?.user_role ??
		profileData?.role ??
		(user.user_metadata?.user_role as string | undefined) ??
		'contributor';

	let role = candidate.toString().toLowerCase();

	if (role !== 'admin' && role !== 'editor') {
		if (profileData?.is_admin) {
			role = 'admin';
		} else if (profileData?.is_editor) {
			role = 'editor';
		}
	}

	if (role === 'admin') return 'admin';
	if (role === 'editor') return 'editor';
	return 'contributor';
}
