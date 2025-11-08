/**
 * Server-side Supabase client utilities
 *
 * This file provides Supabase client instances for server-side contexts:
 * - Server Components
 * - Server Actions
 * - API Routes
 *
 * Uses cookies() from next/headers for authentication state.
 */

import { createServerClient as createServerClientSSR, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for Server Components and Server Actions
 * Automatically handles auth cookies for authenticated requests
 *
 * Example (Server Component):
 * ```tsx
 * import { createServerClient } from '@/lib/supabase-server';
 *
 * export default async function Page() {
 *   const supabase = createServerClient();
 *   const { data } = await supabase.from('posts').select('*');
 *   return <div>{data}</div>;
 * }
 * ```
 *
 * Example (Server Action):
 * ```tsx
 * 'use server';
 * import { createServerClient } from '@/lib/supabase-server';
 *
 * export async function createPost() {
 *   const supabase = createServerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   // ... create post
 * }
 * ```
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createServerClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Cookie setting can fail in Server Components
            // This is expected and can be ignored
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Cookie removal can fail in Server Components
            // This is expected and can be ignored
          }
        },
      },
    }
  );
}

/**
 * Creates an admin Supabase client with service role key
 * Bypasses Row Level Security - use with caution!
 * Only use in trusted server-side contexts
 *
 * Example:
 * ```tsx
 * import { createAdminClient } from '@/lib/supabase-server';
 *
 * export async function moderatePost(postId: string) {
 *   const admin = createAdminClient();
 *   await admin.from('forum_posts').update({ is_deleted: true }).eq('id', postId);
 * }
 * ```
 */
export function createAdminClient() {
  const { createClient } = require('@supabase/supabase-js');

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
