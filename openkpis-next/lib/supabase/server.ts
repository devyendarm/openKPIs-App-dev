/**
 * Supabase Client for Server-Side (API Routes, Server Components)
 * Uses unified environment variables (no _DEV suffix)
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getSupabaseServerConfig(useAnonKey: boolean = true) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

  if (useAnonKey) {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !anonKey) {
      throw new Error('[Supabase] Missing server auth envs: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    return { url, key: anonKey };
  }

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceRole) {
    throw new Error('[Supabase] Missing server admin envs: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return { url, key: serviceRole };
}

/**
 * Create Supabase client for server-side operations with user session support
 * Use this in API routes that need to access the current user's session
 */
export async function createClient() {
  const cookieStore = await cookies();
  const config = getSupabaseServerConfig(true);

  return createServerClient(config.url, config.key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: { path?: string; maxAge?: number; sameSite?: 'lax' | 'strict' | 'none'; httpOnly?: boolean; secure?: boolean }) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // ignore in server components
        }
      },
      remove(name: string, options?: { path?: string; maxAge?: number; sameSite?: 'lax' | 'strict' | 'none'; httpOnly?: boolean; secure?: boolean }) {
        try {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        } catch {
          // ignore in server components
        }
      }
    },
  });
}

/**
 * Create admin Supabase client (bypasses RLS)
 * Use only for server-side admin operations
 */
export function createAdminClient() {
  const config = getSupabaseServerConfig(false);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
  return createSupabaseClient(config.url, config.key);
}

