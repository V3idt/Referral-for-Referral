import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Create a URL for a page
 */
export function createPageUrl(page: string): string {
  return `/${page.toLowerCase().replace(/\s+/g, '-')}`;
}

/**
 * Get a consistent color for a user based on their initials
 * Similar to Telegram's approach
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'from-red-400 to-pink-500',
    'from-orange-400 to-red-500',
    'from-amber-400 to-orange-500',
    'from-yellow-400 to-amber-500',
    'from-lime-400 to-green-500',
    'from-green-400 to-emerald-500',
    'from-emerald-400 to-teal-500',
    'from-teal-400 to-cyan-500',
    'from-cyan-400 to-blue-500',
    'from-blue-400 to-indigo-500',
    'from-indigo-400 to-purple-500',
    'from-purple-400 to-pink-500',
    'from-pink-400 to-rose-500',
    'from-rose-400 to-red-500',
  ];

  // Simple hash function to get consistent color based on name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
