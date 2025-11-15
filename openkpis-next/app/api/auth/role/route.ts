import { NextResponse } from 'next/server';
import { getUserRoleServer } from '@/lib/roles/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
	try {
		const supabase = await createClient();
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser();

		if (error || !user) {
			return NextResponse.json({ authenticated: false, role: 'contributor' }, { status: 200 });
		}

		const role = await getUserRoleServer();
		return NextResponse.json({ authenticated: true, role }, { status: 200 });
	} catch (e: any) {
		return NextResponse.json({ authenticated: false, role: 'contributor', error: e?.message || 'Unexpected error' }, { status: 500 });
	}
}




