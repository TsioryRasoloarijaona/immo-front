// ---------------------------------------------------------------------------
// Cache de valeurs pour `useApi` — le pendant « mémoire entre deux montages »
// du cache de requêtes GET d'`api.ts`.
//
// Les deux ne font pas le même travail :
//
//   - `api.ts` met en cache la *promesse* d'un GET par URL (30 s). Il évite
//     l'aller-retour réseau et déduplique deux appels simultanés, mais il ne
//     peut rien contre le rendu : `useApi` repart de `data: null,
//     loading: true` à chaque montage, et comme les effets passifs s'exécutent
//     après la peinture, l'écran affiche un `LoadingState` au moins une frame
//     à chaque navigation — même quand la réponse sort du cache sans requête.
//
//   - ce module-ci mémorise la *valeur déjà résolue*, sous une clé logique
//     fournie par l'appelant. `useApi` la lit pendant le premier rendu, donc
//     revenir sur une page repeint immédiatement les données connues et
//     revalide derrière (`loading` reste vrai, `ResultsRegion` grise la zone).
//
// La clé est logique (« dossiers », « prospection-devis »), pas une URL : elle
// n'a pas à suivre la construction des URLs dans `api.ts`, donc les deux
// couches ne peuvent pas diverger. `useApi` y ajoute les dépendances.
// ---------------------------------------------------------------------------

interface ValueEntry {
  value: unknown;
  expiresAt: number;
}

/** Plus long que le TTL du cache GET (30 s) : ces valeurs ne sont jamais
 * servies seules, toujours accompagnées d'une revalidation. La borne existe
 * pour ne pas repeindre des données très anciennes sur un onglet laissé
 * ouvert une demi-journée. */
const TTL_MS = 5 * 60_000;

/** Une page de liste crée une entrée par combinaison de filtres/recherche, et
 * chaque frappe débouncée en produit une nouvelle. Sans borne, une longue
 * session accumulerait des réponses complètes indéfiniment. */
const MAX_ENTRIES = 200;

const store = new Map<string, ValueEntry>();

/** `hit` distingue « rien en cache » d'une valeur légitimement `null` —
 * plusieurs fetchers résolvent `null` quand leur identifiant est absent. */
export function readCachedValue(key: string): { hit: boolean; value: unknown } {
  const entry = store.get(key);
  if (!entry) return { hit: false, value: null };
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return { hit: false, value: null };
  }
  // Réinsertion = entrée la plus récente (Map conserve l'ordre d'insertion),
  // ce qui donne une éviction LRU et non FIFO.
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

/** Appelé par `api.ts` après toute mutation réussie, en même temps que le
 * cache GET : une valeur mémorisée ne doit pas survivre à l'écriture qui la
 * périme. */
export function clearCachedValues(): void {
  store.clear();
}
