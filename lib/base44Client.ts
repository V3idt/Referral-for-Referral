/**
 * Client API - Now powered by Supabase
 * This file maintains backward compatibility with the original Base44 client interface
 * while using Supabase as the backend
 */

import { api } from './supabase/api';

// Re-export the Supabase API with the same interface as Base44
export const base44 = api;

// Type exports for backward compatibility
export type { Database } from './supabase/database.types';
