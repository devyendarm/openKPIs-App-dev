import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGithubProviderTokenFromCookies } from '@/lib/services/giscusTokens';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
	try {
		const cookieStore = await cookies();
		const supabase = await createClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = getGithubProviderTokenFromCookies(cookieStore);
		if (!token) {
			return NextResponse.json({ token: null }, { status: 404 });
		}

		return NextResponse.json({ token });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load GitHub token';
		console.error('[AuthAPI] github-token error:', error);
		return NextResponse.json({ error: message }, { status: 500 });
	}
}