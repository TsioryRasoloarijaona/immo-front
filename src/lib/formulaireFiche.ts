import { useCallback, useState } from 'react';

/** La différence compte : une fiche prospection s'enregistre sur quatre endpoints derrière un seul bouton, et
 * appeler les quatre à chaque fois écrirait des changements d'étape fictifs au journal d'audit.
 * Resynchronisation pendant le rendu (pas dans un effet) pour éviter une frame avec l'ancienne valeur. */
export function useFormulaireFiche<T extends Record<string, unknown>>(source: T) {
  const [etat, setEtat] = useState<{ base: T; brouillon: T }>(() => ({ base: source, brouillon: source }));

  const champsModifies = (Object.keys(etat.brouillon) as (keyof T)[]).filter(
    (k) => !memeValeur(etat.brouillon[k], etat.base[k]),
  );
  const estModifie = champsModifies.length > 0;

  // Sans le garde sur `estModifie`, n'importe quel refetch balaie la saisie en cours.
  if (source !== etat.base && !estModifie) {
    setEtat({ base: source, brouillon: source });
  }

  const set = useCallback(<K extends keyof T>(champ: K, valeur: T[K]) => {
    setEtat((e) => ({ ...e, brouillon: { ...e.brouillon, [champ]: valeur } }));
  }, []);

  const annuler = useCallback(() => {
    setEtat((e) => ({ ...e, brouillon: e.base }));
  }, []);

  /** À appeler avec la réponse serveur après un enregistrement réussi, pour ne pas attendre un refetch. */
  const confirmer = useCallback((nouvelle: T) => {
    setEtat({ base: nouvelle, brouillon: nouvelle });
  }, []);

  const aChange = useCallback(
    (...champs: (keyof T)[]) => champs.some((c) => !memeValeur(etat.brouillon[c], etat.base[c])),
    [etat],
  );

  return { valeurs: etat.brouillon, base: etat.base, set, aChange, champsModifies, estModifie, annuler, confirmer };
}

/** `null`, `undefined` et `''` confondus : sinon un champ jamais touché se dirait modifié parce que l'API a
 * renvoyé `null` là où le formulaire tient `''`. */
function memeValeur(a: unknown, b: unknown): boolean {
  const vide = (v: unknown) => v === null || v === undefined || v === '';
  if (vide(a) && vide(b)) return true;
  return a === b;
}
