/**
 * NextAuth v5 Configuration
 *
 * Handles authentication with multiple OAuth providers and credentials.
 * Manages user profiles, accounts, and session data.
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Facebook from 'next-auth/providers/facebook';
import LinkedIn from 'next-auth/providers/linkedin';
import Credentials from 'next-auth/providers/credentials';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { encryptToken } from '@/lib/encryption';

const supabaseAdmin = getSupabaseAdmin();

export const {auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Check if user exists in database
        const { data: profile, error } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('email', credentials.email as string)
          .single();

        if (error || !profile) {
          throw new Error('Invalid credentials');
        }

        // Use Supabase auth for password verification
        const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        });

        if (authError || !authData.user) {
          throw new Error('Invalid credentials');
        }

        return {
          id: profile.id,
          email: profile.email,
          name: profile.full_name || profile.display_name,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account, profile: oauthProfile }) {
      // Initial sign in
      if (user) {
        // Create or update profile
        const { data: existingProfile } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('email', user.email!)
          .maybeSingle();

        let userId: string;

        if (!existingProfile) {
          // Generate a new UUID for the profile
          const { randomUUID } = await import('crypto');
          const newUserId = randomUUID();

          // Create new profile
          const { data: newProfile, error } = await supabaseAdmin
            .from('user_profiles')
            .insert({
              id: newUserId,
              email: user.email,
              full_name: user.name,
              display_name: user.name || user.email?.split('@')[0],
              avatar_url: user.image,
              subscription_tier: 'FREE',
              monthly_usage: 0,
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating profile:', error);
            throw new Error('Failed to create user profile');
          }
          userId = newProfile.id;
        } else {
          userId = existingProfile.id;

          // Update existing profile with latest OAuth info
          await supabaseAdmin
            .from('user_profiles')
            .update({
              full_name: user.name || existingProfile.full_name,
              display_name: user.name || existingProfile.display_name,
              avatar_url: user.image || existingProfile.avatar_url,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }

        token.id = userId;

        // Store subscription info and dates in token
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('subscription_tier, monthly_usage, created_at, usage_reset_date')
          .eq('id', userId)
          .single();

        if (profile) {
          token.subscriptionTier = profile.subscription_tier;
          token.monthlyUsage = profile.monthly_usage;
          token.createdAt = profile.created_at;
          token.usageResetDate = profile.usage_reset_date;
        }

        // If this is an OAuth sign in, store the account
        if (account && account.provider !== 'credentials') {
          const { data: existingAccount } = await supabaseAdmin
            .from('accounts')
            .select('id')
            .eq('provider', account.provider)
            .eq('provider_account_id', account.providerAccountId!)
            .maybeSingle();

          if (!existingAccount) {
            // Encrypt tokens before storing
            await supabaseAdmin.from('accounts').insert({
              user_id: userId,
              type: account.type,
              provider: account.provider,
              provider_account_id: account.providerAccountId,
              access_token: account.access_token ? encryptToken(account.access_token) : null,
              refresh_token: account.refresh_token ? encryptToken(account.refresh_token) : null,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token ? encryptToken(account.id_token) : null,
            });
          } else {
            // Update existing account tokens
            await supabaseAdmin
              .from('accounts')
              .update({
                access_token: account.access_token ? encryptToken(account.access_token) : null,
                refresh_token: account.refresh_token ? encryptToken(account.refresh_token) : null,
                expires_at: account.expires_at,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingAccount.id);
          }
        }

        // Fetch linked providers
        const { data: accounts } = await supabaseAdmin
          .from('accounts')
          .select('provider')
          .eq('user_id', userId);

        if (accounts) {
          token.linkedProviders = accounts.map((acc: any) => acc.provider);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.subscriptionTier = token.subscriptionTier as string;
        session.user.monthlyUsage = token.monthlyUsage as number;
        session.user.createdAt = token.createdAt as string;
        session.user.usageResetDate = token.usageResetDate as string;
        session.user.linkedProviders = token.linkedProviders as string[];
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - refresh token data daily
  },
  secret: process.env.NEXTAUTH_SECRET,
});
