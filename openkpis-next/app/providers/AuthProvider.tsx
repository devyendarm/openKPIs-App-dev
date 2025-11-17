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
					// Try client role first
					let r = await getUserRoleClient();
					// Fallback to server-resolved role (more reliable on first load)
					try {
						const resp = await fetch('/api/debug/auth', { cache: 'no-store' });
						const dj = await resp.json();
						if (dj?.user?.role && (dj.user.role === 'admin' || dj.user.role === 'editor' || dj.user.role === 'contributor')) {
							r = dj.user.role;
						}
					} catch {}
					if (!mounted) return;
					setRole(r as any);
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
			if (nextUser) {
				let r = await getUserRoleClient();
				try {
					const resp = await fetch('/api/debug/auth', { cache: 'no-store' });
					const dj = await resp.json();
					if (dj?.user?.role && (dj.user.role === 'admin' || dj.user.role === 'editor' || dj.user.role === 'contributor')) {
						r = dj.user.role;
					}
				} catch {}
				setRole(r as any);
			}
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


