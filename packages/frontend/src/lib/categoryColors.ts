/**
 * Shared category color mappings for expense data
 * Used across expense charts and expense displays for consistent styling
 *
 * IMPORTANT: Classes must be written out explicitly for Tailwind JIT to detect them
 */

export interface CategoryColors {
  bgClass: string;
  textClass: string;
  badgeClasses: string;
}

// Explicit class definitions for Tailwind JIT compilation
export const EXPENSE_CATEGORY_COLORS: Record<string, CategoryColors> = {
  'Salaries': {
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-400',
    badgeClasses: 'bg-blue-500/20 text-blue-400',
  },
  'Travel': {
    bgClass: 'bg-green-500',
    textClass: 'text-green-400',
    badgeClasses: 'bg-green-500/20 text-green-400',
  },
  'Hospitality': {
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-400',
    badgeClasses: 'bg-yellow-500/20 text-yellow-400',
  },
  'Office': {
    bgClass: 'bg-purple-500',
    textClass: 'text-purple-400',
    badgeClasses: 'bg-purple-500/20 text-purple-400',
  },
  'Contracts': {
    bgClass: 'bg-red-500',
    textClass: 'text-red-400',
    badgeClasses: 'bg-red-500/20 text-red-400',
  },
  'Other': {
    bgClass: 'bg-gray-500',
    textClass: 'text-gray-400',
    badgeClasses: 'bg-gray-500/20 text-gray-400',
  },
};

/**
 * Get color classes for a category with fallback to 'Other'
 */
export function getCategoryColors(category: string | null | undefined): CategoryColors {
  if (!category) {
    return EXPENSE_CATEGORY_COLORS['Other'];
  }
  return EXPENSE_CATEGORY_COLORS[category] || EXPENSE_CATEGORY_COLORS['Other'];
}

/**
 * Get just the background color class (for chart bars)
 */
export function getCategoryBgColor(category: string | null | undefined): string {
  return getCategoryColors(category).bgClass;
}

/**
 * Get badge classes (background + text color for pills)
 */
export function getCategoryBadgeClasses(category: string | null | undefined): string {
  return getCategoryColors(category).badgeClasses;
}
