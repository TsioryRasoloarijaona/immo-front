import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './api';
import { cacheGeneration, readCachedValue, writeCachedValue } from './apiCache';

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (Object.is(value, debounced)) return;
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
    // `debounced` lu mais hors deps : l'y mettre relancerait le minuteur à chaque stabilisation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return debounced;
}

/** Vider les caches ne suffit pas : un `useApi` monté ne relit rien tant que ses
 * deps ne bougent pas. D'où ce registre, pour tout relancer après une synchronisation. */
const mountedRunners = new Set<() => Promise<void>>();

export function refetchAllApis(): void {
  for (const run of mountedRunners) void run();
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Erreur inconnue.';
}

/** Quand les deps changent, l'ancien `data` reste affiché jusqu'à la réponse : une page
 * détail doit être montée avec `key={id}`. `cacheKey` est un nom logique, pas une URL. */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
  cacheKey?: string,
): ApiState<T> {
  const key = cacheKey === undefined ? null : `${cacheKey}:${JSON.stringify(deps)}`;
  const keyRef = useRef(key);
  const [data, setData] = useState<T | null>(() => {
    if (key === null) return null;
    const cached = readCachedValue(key);
    return cached.hit ? (cached.value as T) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const callId = useRef(0);
  const fetcherRef = useRef(fetcher);

  // Doit rester déclaré avant l'effet des deps (ordre d'exécution) : `fetcher`
  // est souvent une flèche inline, l'avoir en dépendance relancerait à chaque rendu.
  useEffect(() => {
    fetcherRef.current = fetcher;
    keyRef.current = key;
  });

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (): Promise<void> => {
    const id = ++callId.current;
    const activeKey = keyRef.current;
    if (activeKey !== null) {
      const cached = readCachedValue(activeKey);
      if (cached.hit) setData(cached.value as T);
    }
    setLoading(true);
    setError(null);
    const isStale = () => !mounted.current || callId.current !== id;
    try {
      let gen = cacheGeneration();
      let result = await fetcherRef.current();
      if (isStale()) return;
      // Cache vidé pendant le vol (mutation, logout) : la réponse date d'avant,
      // on relance une fois. Une seule : un fetcher qui vide lui-même le cache
      // bouclerait ; si le cache a encore bougé, la réponse est posée mais pas mise en cache.
      if (gen !== cacheGeneration()) {
        gen = cacheGeneration();
        result = await fetcherRef.current();
        if (isStale()) return;
      }
      if (activeKey !== null && gen === cacheGeneration()) writeCachedValue(activeKey, result);
      setData(result);
      setLoading(false);
    } catch (err: unknown) {
      if (isStale()) return;
      setError(errorMessage(err));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRunners.add(run);
    return () => {
      mountedRunners.delete(run);
    };
  }, [run]);

  return { data, loading, error, refetch: run };
}
