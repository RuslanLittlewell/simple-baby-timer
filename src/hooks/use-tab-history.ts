import { usePathname } from 'expo-router';
import { useEffect } from 'react';

const TAB_ROUTES = ['/activity', '/calendar', '/regimes', '/settings'] as const;

export type TabRoute = (typeof TAB_ROUTES)[number];

const isTabRoute = (path: string): path is TabRoute =>
  (TAB_ROUTES as readonly string[]).includes(path);



const visited: TabRoute[] = [];


export function useTabHistory(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (!isTabRoute(pathname) || visited[visited.length - 1] === pathname) return;
    visited.push(pathname);
    if (visited.length > 2) visited.shift();
  }, [pathname]);
}



export function previousTabRoute(): TabRoute | null {
  return visited.length > 1 ? visited[0] : null;
}
