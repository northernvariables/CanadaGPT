/**
 * Supabase client utilities
 *
 * This file provides Supabase client instances for browser contexts.
 * - Browser client: For client-side auth operations, real-time subscriptions
 * - Admin client: For server-side operations that bypass RLS (API routes only)
 *
 * Note: Server component utilities are in supabase-server.ts to avoid
 * importing next/headers in client components
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

/**
 * Client-side Supabase client
 * Use this in React components and client-side code
 *
 * Example:
 * ```tsx
 * import { supabase } from '@/lib/supabase';
 *
 * const { data, error } = await supabase.auth.signInWithPassword({
 *   email, password
 * });
 * ```
 */
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

/**
 * Admin Supabase client (service role)
 * Use this for admin operations that bypass RLS
 * NEVER expose this client to the frontend
 *
 * Example (API route):
 * ```tsx
 * import { getAdminClient } from '@/lib/supabase';
 *
 * // Update user profile as admin (bypasses RLS)
 * const admin = getAdminClient();
 * await admin.from('user_profiles').update({ ... }).eq('id', userId);
 * ```
 */
export function getAdminClient() {
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(
    supabaseUrl || '',
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

/**
 * Type definitions for database tables
 * These should match your Supabase schema
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  subscription_tier: 'FREE' | 'BASIC' | 'PRO';
  monthly_usage: number;
  usage_reset_date: string;
  api_key?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}


/**
 * Increment user's query usage count
 * Call this after each AI chat query
 */
export async function incrementUsage(userId: string): Promise<void> {
  const admin = getAdminClient();

  const { error } = await admin.rpc('increment_user_usage', {
    user_id: userId
  });

  if (error) {
    console.error('Error incrementing usage:', error);
  }
}

/**
 * Get Supabase auth callback URL for OAuth providers
 *
 * Example:
 * ```tsx
 * const redirectTo = getAuthCallbackURL();
 * await supabase.auth.signInWithOAuth({
 *   provider: 'google',
 *   options: { redirectTo }
 * });
 * ```
 */
export function getAuthCallbackURL(): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                  'http://localhost:3000';

  return `${baseUrl}/auth/callback`;
}
