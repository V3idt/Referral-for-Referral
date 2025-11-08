/**
 * Supabase Client for Client-Side Operations
 * This client is used in client components
 */

import { createBrowserClient } from '@supabase/ssr';
import { env } from '../env';
import type { Database } from './database.types';

export function createClient() {
  return createBrowserClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY
  );
}

// Singleton instance for client-side
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
}

export const supabase = getSupabase();

