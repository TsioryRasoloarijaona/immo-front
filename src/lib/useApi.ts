import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './api';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-runs the fetcher, keeping the previous data visible while it does. */
  refetch: () => void;
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Erreur inconnue.';
}

/**
 * Runs `fetcher` whenever `deps` changes and exposes {data, loading, error}.
 * Ignores results from a stale in-flight call (e.g. deps changed again
 * before the first request resolved) and from calls made after unmount.
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: React.DependencyList): ApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const callId = useRef(0);
  const fetcherRef = useRef(fetcher);

  // Keeps fetcherRef pointed at the latest closure without needing `fetcher`
  // itself in the run/effect dependency arrays (which would re-fire on every
  // render for an inline arrow function). Runs after commit, before the
  // deps-effect below fires (effects run in declaration order).
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(() => {
    const id = ++callId.current;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (callId.current !== id) return;
        setData(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (callId.current !== id) return;
        setError(errorMessage(err));
        setLoading(false);
      });
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(run, deps);

  return { data, loading, error, refetch: run };
}
