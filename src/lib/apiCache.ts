// Le cache GET d'api.ts garde la promesse, pas la valeur : useApi repartirait de
// `loading` à chaque montage. Ici la valeur résolue, lue pendant le premier rendu,
// sous une clé logique (pas une URL) à laquelle useApi ajoute les dépendances.

interface ValueEntry {
  value: unknown;
  expiresAt: number;
}

// Plus long que le TTL du cache GET : ces valeurs ne sont jamais servies seules,
// toujours suivies d'une revalidation.
const TTL_MS = 5 * 60_000;

const MAX_ENTRIES = 200;

const store = new Map<string, ValueEntry>();

let generation = 0;

/** Une réponse partie avant un vidage (logout, mutation) ne doit plus réécrire le cache. */
export function cacheGeneration(): number {
  return generation;
}

/** `hit` distingue « rien en cache » d'une valeur légitimement `null`. */
export function readCachedValue(key: string): { hit: boolean; value: unknown } {
  const entry = store.get(key);
  if (!entry) return { hit: false, value: null };
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return { hit: false, value: null };
  }
  // Réinsertion : Map garde l'ordre d'insertion, l'éviction devient LRU et non FIFO.
  store.delete(key);
  store.set(key, entry);
  return { hit: true, value: entry.value };
}

export function writeCachedValue(key: string, value: unknown): void {
  store.delete(key);
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

const clearListeners = new Set<() => void>();

export function onCacheClear(listener: () => void): void {
  clearListeners.add(listener);
}

export function clearCachedValues(): void {
  generation += 1;
  store.clear();
  for (const listener of clearListeners) listener();
}
