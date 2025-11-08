/**
 * Supabase Client for Server-Side Operations
 * This client is used in server components and API routes
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '../env';
import type { Database } from './database.types';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie errors in middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookie errors in middleware
          }
        },
      },
    }
  );
}

