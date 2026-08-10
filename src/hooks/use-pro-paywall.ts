import { useCallback, useEffect, useRef } from 'react';

import { useAppStore } from '@/state/app-state';

// The paywall is a single modal in the root layout; locked screens ask for it
// through here instead of rendering a gate of their own. The optional handler
// runs when the paywall closes and is told whether PRO ended up unlocked, so a
// screen can either resume what the user was after or step back out of it.
export function useProPaywall(): (onClosed?: (unlocked: boolean) => void) => void {
  const pendingPaywall = useAppStore((state) => state.pendingPaywall);
  const setPendingPaywall = useAppStore((state) => state.setPendingPaywall);
  const onClosed = useRef<((unlocked: boolean) => void) | null>(null);

  useEffect(() => {
    if (pendingPaywall || !onClosed.current) return;
    const closed = onClosed.current;
    onClosed.current = null;
    closed(useAppStore.getState().proActive);
  }, [pendingPaywall]);

  return useCallback(
    (handler?: (unlocked: boolean) => void) => {
      onClosed.current = handler ?? null;
      setPendingPaywall(true);
    },
    [setPendingPaywall],
  );
}
