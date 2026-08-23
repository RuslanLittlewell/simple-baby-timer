import { useCallback, useEffect, useRef } from 'react';

import { useAppStore } from '@/state/app-state';





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
