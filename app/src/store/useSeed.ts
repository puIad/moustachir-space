/**
 * store/useSeed.ts — React bootstrap hook for the Dexie seed.
 * ----------------------------------------------------------------------------
 * Runs seedIfNeeded() once on mount, exposes the live SeedStatus, and a reset()
 * that re-imports from seed.json. The app waits on `ready` before rendering data
 * screens; the dev DataStatus indicator reads `status`.
 */

import { useCallback, useEffect, useState } from 'react';
import { seedIfNeeded, resetToSeed, getSeedStatus, type SeedStatus } from '@/store/seed';

export interface SeedBootstrap {
  ready: boolean;
  status: SeedStatus | null;
  reset: () => Promise<void>;
}

export function useSeedBootstrap(): SeedBootstrap {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SeedStatus | null>(null);

  const refresh = useCallback(async () => {
    setStatus(await getSeedStatus());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await seedIfNeeded();
      if (cancelled) return;
      await refresh();
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const reset = useCallback(async () => {
    setReady(false);
    await resetToSeed();
    await refresh();
    setReady(true);
  }, [refresh]);

  return { ready, status, reset };
}
