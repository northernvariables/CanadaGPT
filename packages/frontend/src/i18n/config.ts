import { Pathnames, LocalePrefix } from 'next-intl/routing';

export const defaultLocale = 'en' as const;
export const locales = ['en', 'fr'] as const;

export type Locale = (typeof locales)[number];

// Define path names for both locales
export const pathnames = {
  '/': '/',
  '/dashboard': '/dashboard',
  '/mps': '/mps',
  '/bills': '/bills',
  '/debates': '/debates',
  '/hansard': '/hansard',
  '/chamber': '/chamber',
  '/committees': '/committees',
  '/lobbying': '/lobbying',
  '/spending': '/spending',
  '/about': '/about',
  '/contact': '/contact',
  '/privacy': '/privacy',
  '/profile': '/profile',
  '/account': '/account',
} satisfies Pathnames<typeof locales>;

export const localePrefix: LocalePrefix<typeof locales> = 'always';

export const port = process.env.PORT || 3000;
export const host = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://localhost:${port}`;
