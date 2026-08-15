import { useEffect, useState } from 'react';
import type {
  Article,
  Communication,
  Dossier,
  Lookups,
  Prospection,
  Settlement,
  Tranche,
} from '../types';

// Static prototype: every "API call" is a fetch of a bundled JSON file in
// /public/data, standing in for what will later be a real Spring Boot endpoint.

export interface DataBundle {
  prospections: Prospection[];
  dossiers: Dossier[];
  communications: Communication[];
  tranches: Tranche[];
  articles: Article[];
  settlements: Settlement[];
  lookups: Lookups;
}

interface DataState {
  data: DataBundle | null;
  loading: boolean;
  error: string | null;
}

let cache: DataBundle | null = null;
let inflight: Promise<DataBundle> | null = null;

async function loadAll(): Promise<DataBundle> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const files = [
      'prospections',
      'dossiers',
      'communications',
      'tranches',
      'articles',
      'settlements',
      'lookups',
    ] as const;

    const results = await Promise.all(
      files.map(async (name) => {
        const res = await fetch(`${import.meta.env.BASE_URL}data/${name}.json`);
        if (!res.ok) throw new Error(`Échec du chargement de ${name}.json (${res.status})`);
        return res.json();
      }),
    );

    const [prospections, dossiers, communications, tranches, articles, settlements, lookupsArr] =
      results;

    const bundle: DataBundle = {
      prospections,
      dossiers,
      communications,
      tranches,
      articles,
      settlements,
      lookups: lookupsArr[0],
    };
    cache = bundle;
    return bundle;
  })();

  return inflight;
}

/** Loads (and caches) the full prototype dataset once, shared across every page. */
export function useData(): DataState {
  const [state, setState] = useState<DataState>(() =>
    cache ? { data: cache, loading: false, error: null } : { data: null, loading: true, error: null },
  );

  useEffect(() => {
    // loadAll() resolves instantly from the module-level cache when already
    // populated, so this covers both the first load and later mounts.
    let cancelled = false;
    loadAll()
      .then((bundle) => {
        if (!cancelled) setState({ data: bundle, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
