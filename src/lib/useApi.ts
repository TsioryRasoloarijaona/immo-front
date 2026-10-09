import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from './api';
import { cacheGeneration, readCachedValue, writeCachedValue } from './apiCache';

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

/** Registre des `run` de tous les `useApi` actuellement montés.
 *
 * Sert au bouton de synchronisation (POST /api/synchronisation) : une fois le
 * cycle terminé, les données affichées peuvent être périmées sur *toutes* les
 * pages — pas seulement celle qui a cliqué. Les caches sont déjà vidés (toute
 * mutation passe par `clearApiCache` dans api.ts), mais un `useApi` monté ne
 * relit rien tant que ses deps ne bougent pas : ce registre permet de re-runner
 * chaque requête montée, en gardant les données précédentes visibles pendant
 * le refetch (même comportement que `refetch`). */
const mountedRunners = new Set<() => Promise<void>>();

/** Re-lance toutes les requêtes `useApi` actuellement montées. À appeler
 * après une invalidation globale hors-page (cycle de synchronisation). */
export function refetchAllApis(): void {
  for (const run of mountedRunners) void run();
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Re-runs the fetcher, keeping the previous data visible while it does.
   * Resolves once the new data (or error) is set. */
  refetch: () => Promise<void>;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Erreur inconnue.';
}

/**
 * Runs `fetcher` whenever `deps` changes and exposes {data, loading, error}.
 * Ignores results from a stale in-flight call (deps changed again before it
 * resolved) and results arriving after unmount; a result that started before
 * a cache clear is not written and the request is re-run.
 *
 * Quand la clé change, l'ancien `data` reste affiché jusqu'à la réponse : une
 * page détail doit donc être montée avec `key={id}`.
 *
 * `cacheKey` — nom logique de la requête (« dossiers », « prospection-devis »),
 * pas une URL. Quand il est fourni, la dernière valeur obtenue est mémorisée
 * dans `apiCache` sous cette clé + les dépendances, puis relue *pendant le
 * premier rendu* du montage suivant. Revenir sur une page repeint donc
 * immédiatement les données connues au lieu de repasser par `LoadingState`,
 * la revalidation restant visible via `loading` (zone grisée par
 * `ResultsRegion`). Sans clé : comportement d'origine, chaque montage repart
 * de zéro.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
  cacheKey?: string,
): ApiState<T> {
  // Les dépendances font partie de la clé : une autre page ou un autre filtre
  // sont d'autres requêtes. Rien n'est calculé quand aucune clé n'est donnée.
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

  // Keeps fetcherRef pointed at the latest closure without needing `fetcher`
  // itself in the run/effect dependency arrays (which would re-fire on every
  // render for an inline arrow function). Runs after commit, before the
  // deps-effect below fires (effects run in declaration order).
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
    // Changement de dépendances : la valeur affichée est celle de la clé
    // précédente, on repeint celle de la nouvelle si on l'a déjà vue.
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
      // bouclerait ; si le cache a encore bougé, la réponse n'est pas posée.
      if (gen !== cacheGeneration()) {
        gen = cacheGeneration();
        result = await fetcherRef.current();
        if (isStale()) return;
      }
      if (gen === cacheGeneration()) {
        if (activeKey !== null) writeCachedValue(activeKey, result);
        setData(result);
      }
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

  // Inscription au registre global pour `refetchAllApis` — voir en tête de
  // fichier. `run` est stable (useCallback []), une inscription par montage.
  useEffect(() => {
    mountedRunners.add(run);
    return () => {
      mountedRunners.delete(run);
    };
  }, [run]);

  return { data, loading, error, refetch: run };
}
