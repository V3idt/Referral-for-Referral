import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a page URL for routing
 * This helper converts page names to Next.js routes
 */
export function createPageUrl(pageName: string): string {
  const routes: Record<string, string> = {
    Home: '/',
    MyLinks: '/my-links',
    Messages: '/messages',
    Exchanges: '/exchanges',
  };

  return routes[pageName] || '/';
}
