import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Synchronisation état ↔ URL pour les filtres, la recherche, la pagination et
// les onglets.
//
// Avant : chaque page de liste tenait ses filtres dans `useState`, donc une
// vue filtrée n'était ni partageable, ni mettable en favori, et disparaissait
// au rechargement comme au retour arrière. Sur un CRM à onze listes, c'est la
// fonction « envoie-moi ce que tu regardes » qui manque.
//
// **`replace` et non `push`.** Chaque frappe dans une recherche produirait
// sinon une entrée d'historique, et il faudrait taper `Retour` autant de fois
// qu'on a tapé de caractères pour sortir de la page. En `replace`, l'URL reste
// partageable et survit au rechargement — ce qui est l'objectif — sans
// détourner le bouton Retour de son rôle : revenir à l'écran précédent.
//
// **Les valeurs par défaut ne sont pas écrites.** Une liste sans filtre garde
// une URL propre ; un paramètre présent signifie toujours un choix explicite.

/** Chaîne simple (recherche, référence…). */
export function useUrlString(key: string, defaultValue = ''): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;

  const setValue = useCallback(
    (v: string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!v || v === defaultValue) next.delete(key);
          else next.set(key, v);
          return next;
        },
        { replace: true },
      );
    },
    [key, defaultValue, setParams],
  );

  return [value, setValue];
}

/** Liste de valeurs (multi-select), sérialisée en `a,b,c`. */
export function useUrlStringArray(key: string): [string[], (v: string[]) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  // Mémoïsé : `split` rendrait un tableau neuf à chaque rendu, et ces valeurs
  // servent de dépendances à des `useApi` — une nouvelle identité relancerait
  // la requête en boucle.
  const value = useMemo(() => (raw ? raw.split(',').filter(Boolean) : []), [raw]);

  const setValue = useCallback(
    (v: string[]) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v.length === 0) next.delete(key);
          else next.set(key, v.join(','));
          return next;
        },
        { replace: true },
      );
    },
    [key, setParams],
  );

  return [value, setValue];
}

/** Valeur d'un ensemble fermé (onglet, énumération de filtre). Une valeur
 * inconnue dans l'URL retombe sur le défaut plutôt que d'être propagée : un
 * lien trafiqué ou périmé ne doit pas mettre l'écran dans un état impossible. */
export function useUrlEnum<T extends string>(key: string, allowed: readonly T[], defaultValue: T): [T, (v: T) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key) as T | null;
  const value = raw && allowed.includes(raw) ? raw : defaultValue;

  const setValue = useCallback(
    (v: T) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v === defaultValue) next.delete(key);
          else next.set(key, v);
          return next;
        },
        { replace: true },
      );
    },
    [key, defaultValue, setParams],
  );

  return [value, setValue];
}

/** Numéro de page, exposé en base 1 dans l'URL (`?page=2`) et manipulé en
 * base 0 dans le code, comme l'attend l'API. La page 1 n'est jamais écrite. */
export function useUrlPage(key = 'page'): [number, (v: number) => void] {
  const [params, setParams] = useSearchParams();
  const parsed = Number.parseInt(params.get(key) ?? '', 10);
  const value = Number.isFinite(parsed) && parsed > 1 ? parsed - 1 : 0;

  const setValue = useCallback(
    (v: number) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (v <= 0) next.delete(key);
          else next.set(key, String(v + 1));
          return next;
        },
        { replace: true },
      );
    },
    [key, setParams],
  );

  return [value, setValue];
}

/** Objet de filtres complet, pour les barres de filtres partagées qui
 * manipulent un état d'un bloc (`ProspectionFilterBarState`) plutôt que des
 * champs séparés. Les tableaux sont sérialisés en `a,b,c`, les chaînes telles
 * quelles, et toute valeur égale au défaut est absente de l'URL.
 *
 * `defaults` sert aussi de schéma : seules ses clés sont lues, donc un
 * paramètre étranger dans l'URL est ignoré au lieu d'entrer dans l'état. */
export function useUrlFilters<T extends object>(
  defaults: T,
): [T, <K extends keyof T>(key: K, value: T[K]) => void] {
  const [params, setParams] = useSearchParams();

  // Reconstruit à chaque changement d'URL seulement : cet objet alimente des
  // dépendances de `useApi`, une identité neuve à chaque rendu relancerait les
  // requêtes en boucle.
  const value = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const raw = params.get(String(key));
      if (raw === null) continue;
      out[key] = (
        Array.isArray(defaults[key]) ? raw.split(',').filter(Boolean) : raw
      ) as T[keyof T];
    }
    return out;
    // `defaults` est un littéral recréé à chaque rendu par les appelants ; le
    // comparer par identité rendrait le mémo inutile. Seule l'URL compte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const setValue = useCallback(
    <K extends keyof T>(key: K, v: T[K]) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const name = String(key);
          const def = defaults[key];
          const serialized = Array.isArray(v) ? v.join(',') : String(v ?? '');
          const serializedDefault = Array.isArray(def) ? def.join(',') : String(def ?? '');
          if (!serialized || serialized === serializedDefault) next.delete(name);
          else next.set(name, serialized);
          return next;
        },
        { replace: true },
      );
    },
    // même raison que ci-dessus
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setParams],
  );

  return [value, setValue];
}

/** Valeur optionnelle d'un select simple : `null` = « aucun choix ». */
export function useUrlNullable(key: string): [string | null, (v: string | null) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key);

  const setValue = useCallback(
    (v: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!v) next.delete(key);
          else next.set(key, v);
          return next;
        },
        { replace: true },
      );
    },
    [key, setParams],
  );

  return [value ?? null, setValue];
}
