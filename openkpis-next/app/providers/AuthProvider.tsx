'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getUserRoleClient } from '@/lib/roles/client';

type AuthContextValue = {
	user: User | null;
	role: 'admin' | 'editor' | 'contributor';
	loading: boolean;
	refresh: () => void;
};

const AuthContext = createContext<AuthContextValue>({
	user: null,
	role: 'contributor',
	loading: true,
	refresh: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [role, setRole] = useState<'admin' | 'editor' | 'contributor'>('contributor');
	const [loading, setLoading] = useState(true);
	const [version, setVersion] = useState(0);

	useEffect(() => {
		let mounted = true;
		async function init() {
			try {
				const { data } = await supabase.auth.getSession();
				const u = data.session?.user ?? null;
				if (!mounted) return;
				setUser(u);
				if (u) {
					const r = await getUserRoleClient();
					if (!mounted) return;
					setRole(r);
				} else {
					setRole('contributor');
				}
			} finally {
				if (mounted) setLoading(false);
			}
		}
		init();

		const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
			const nextUser = session?.user ?? null;
			setUser(nextUser);
			if (nextUser) setRole(await getUserRoleClient());
			else setRole('contributor');
			// bump context to notify consumers that depend on version changes
			setVersion((v) => v + 1);
			// also keep legacy custom event for existing listeners
			window.dispatchEvent(new CustomEvent('openkpis-auth-change', { detail: { user: nextUser } }));
		});

		return () => {
			sub.subscription.unsubscribe();
			mounted = false;
		};
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			role,
			loading,
			refresh: () => setVersion((v) => v + 1),
		}),
		[user, role, loading, version]
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	return useContext(AuthContext);
}


