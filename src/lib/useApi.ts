import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './api';

/** Trailing-edge debounce for a value fed into a `useApi` dependency array.
 *
 * Every list page put its raw search box state straight into `useApi`'s deps,
 * so typing "BENANI" fired six requests — and because each one flips
 * `loading` back to true, the results area was torn down and rebuilt on every
 * keystroke. Debouncing the value used for *fetching* (while the input itself
 * stays immediate, so typing never feels laggy) collapses that to one request
 * after the user stops typing.
 *
 * 300ms is the usual sweet spot: long enough to swallow a normal typing
 * cadence, short enough that the wait after the last character isn't felt. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (Object.is(value, debounced)) return;
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
    // `debounced` is intentionally read but not depended on — including it
    // would restart the timer each time it settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return debounced;
}

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
