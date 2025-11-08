/**
 * Party Constants and Utilities
 *
 * Centralized configuration for Canadian political parties including:
 * - Party metadata (names, colors, branding)
 * - URL slug mappings
 * - Helper functions for party information lookup
 */

export interface PartyInfo {
  name: string;
  slug: string;
  color: string;
  darkColor: string;
  lightColor: string;
  textColor: string;
  logoPath?: string;
  fullName: string;
}

/**
 * Official Canadian political party configurations
 * Colors are based on each party's official branding
 */
export const PARTIES: Record<string, PartyInfo> = {
  'Liberal': {
    name: 'Liberal',
    slug: 'liberal',
    color: '#DC2626', // red-600
    darkColor: '#B91C1C', // red-700
    lightColor: '#FEE2E2', // red-100
    textColor: '#FFFFFF',
    logoPath: '/party-logos/liberal.svg',
    fullName: 'Liberal Party of Canada',
  },
  'Conservative': {
    name: 'Conservative',
    slug: 'conservative',
    color: '#2563EB', // blue-600
    darkColor: '#1D4ED8', // blue-700
    lightColor: '#DBEAFE', // blue-100
    textColor: '#FFFFFF',
    logoPath: '/party-logos/conservative.svg',
    fullName: 'Conservative Party of Canada',
  },
  'NDP': {
    name: 'NDP',
    slug: 'ndp',
    color: '#F97316', // orange-500
    darkColor: '#EA580C', // orange-600
    lightColor: '#FFEDD5', // orange-100
    textColor: '#FFFFFF',
    logoPath: '/party-logos/ndp.svg',
    fullName: 'New Democratic Party',
  },
  'Bloc Québécois': {
    name: 'Bloc Québécois',
    slug: 'bloc-quebecois',
    color: '#06B6D4', // cyan-500
    darkColor: '#0891B2', // cyan-600
    lightColor: '#CFFAFE', // cyan-100
    textColor: '#FFFFFF',
    logoPath: '/party-logos/bloc.svg',
    fullName: 'Bloc Québécois',
  },
  'Green': {
    name: 'Green',
    slug: 'green',
    color: '#16A34A', // green-600
    darkColor: '#15803D', // green-700
    lightColor: '#DCFCE7', // green-100
    textColor: '#FFFFFF',
    logoPath: '/party-logos/green.svg',
    fullName: 'Green Party of Canada',
  },
  'Independent': {
    name: 'Independent',
    slug: 'independent',
    color: '#6B7280', // gray-500
    darkColor: '#4B5563', // gray-600
    lightColor: '#F3F4F6', // gray-100
    textColor: '#FFFFFF',
    logoPath: '/party-logos/independent.svg',
    fullName: 'Independent',
  },
};

/**
 * Get party information by party name
 * Handles case-insensitive lookup and partial matches
 */
export function getPartyInfo(partyName: string | null | undefined): PartyInfo | null {
  if (!partyName) return null;

  // Direct match
  if (PARTIES[partyName]) {
    return PARTIES[partyName];
  }

  // Case-insensitive match
  const normalizedName = partyName.trim();
  for (const [key, value] of Object.entries(PARTIES)) {
    if (key.toLowerCase() === normalizedName.toLowerCase()) {
      return value;
    }
  }

  // Partial match for variations (e.g., "Bloc" matches "Bloc Québécois")
  for (const [key, value] of Object.entries(PARTIES)) {
    if (key.toLowerCase().includes(normalizedName.toLowerCase()) ||
        normalizedName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Return Independent as fallback for unknown parties
  return PARTIES['Independent'];
}

/**
 * Get party slug for URL routing
 * Converts party name to URL-safe slug
 */
export function getPartySlug(partyName: string | null | undefined): string {
  const partyInfo = getPartyInfo(partyName);
  return partyInfo?.slug || 'independent';
}

/**
 * Get party name from slug
 * Used for reverse lookup from URL params
 */
export function getPartyFromSlug(slug: string | null | undefined): PartyInfo | null {
  if (!slug) return null;

  const normalizedSlug = slug.toLowerCase().trim();
  for (const party of Object.values(PARTIES)) {
    if (party.slug === normalizedSlug) {
      return party;
    }
  }

  return null;
}

/**
 * Get all parties as an array
 * Useful for rendering party lists or filters
 */
export function getAllParties(): PartyInfo[] {
  return Object.values(PARTIES);
}

/**
 * Get major parties (excludes Independent)
 * Useful for filter buttons
 */
export function getMajorParties(): PartyInfo[] {
  return Object.values(PARTIES).filter(p => p.slug !== 'independent');
}

/**
 * Get Tailwind CSS classes for party badge
 * Returns ready-to-use className string
 */
export function getPartyBadgeClasses(partyName: string | null | undefined, active: boolean = false): string {
  const party = getPartyInfo(partyName);
  if (!party) return 'bg-bg-secondary text-text-secondary';

  if (active) {
    return `text-white transition-colors`;
  }

  return `bg-bg-secondary hover:opacity-80 transition-all`;
}

/**
 * Get inline styles for party-themed elements
 * Use when dynamic colors are needed (Tailwind JIT doesn't support dynamic classes)
 */
export function getPartyStyles(partyName: string | null | undefined, active: boolean = false): React.CSSProperties {
  const party = getPartyInfo(partyName);
  if (!party) {
    return {
      backgroundColor: active ? '#6B7280' : '#F3F4F6',
      color: active ? '#FFFFFF' : '#6B7280',
    };
  }

  return {
    backgroundColor: active ? party.color : party.lightColor,
    color: active ? party.textColor : party.darkColor,
    borderColor: party.color,
  };
}
