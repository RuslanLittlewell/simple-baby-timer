import { usePathname } from 'expo-router';
import { useEffect } from 'react';

const TAB_ROUTES = ['/activity', '/calendar', '/regimes', '/settings'] as const;

export type TabRoute = (typeof TAB_ROUTES)[number];

const isTabRoute = (path: string): path is TabRoute =>
  (TAB_ROUTES as readonly string[]).includes(path);

// Native tabs keep no trail of visited tabs — goBack() returns to the first one
// regardless of where the user came from — so the last two are recorded here.
const visited: TabRoute[] = [];

// Mounted once, in the root layout: every navigation changes the pathname.
export function useTabHistory(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (!isTabRoute(pathname) || visited[visited.length - 1] === pathname) return;
    visited.push(pathname);
    if (visited.length > 2) visited.shift();
  }, [pathname]);
}

// The tab the user was on before the current one; null when there was none
// (a cold start straight into the current tab).
export function previousTabRoute(): TabRoute | null {
  return visited.length > 1 ? visited[0] : null;
}
