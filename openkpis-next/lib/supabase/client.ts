/**
 * Supabase Client for Browser
 * Uses unified environment variables (no _DEV suffix)
 */

import { createBrowserClient } from '@supabase/ssr';

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('[Supabase] Missing env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.');
  }
  return { url, key: anonKey };
}

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client can only be used in client components');
  }

  if (!supabaseClient) {
    const { url, key } = getSupabaseConfig();
    supabaseClient = createBrowserClient(url, key);
  }

  return supabaseClient;
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = client[prop as keyof typeof client];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});