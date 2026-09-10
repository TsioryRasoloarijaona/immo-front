import { useCallback, useState } from 'react';

/** Brouillon d'édition d'une fiche : ce que le serveur a servi d'un côté, ce
 * que l'utilisateur a tapé de l'autre, et la différence entre les deux.
 *
 * C'est la différence qui compte. Les champs d'une fiche prospection se
 * répartissent sur **quatre endpoints** — `PATCH /{id}` pour la qualification,
 * `/tranche-principale`, `/etape`, `/archiver` — et l'écran n'expose qu'un seul
 * bouton Enregistrer. Sans savoir précisément ce qui a bougé, il faudrait
 * appeler les quatre à chaque fois : trois écritures inutiles, trois occasions
 * d'échouer, et un journal d'audit qui enregistre des changements d'étape qui
 * n'ont pas eu lieu.
 *
 * Le brouillon se **resynchronise** quand le serveur renvoie une version
 * différente, sauf si l'utilisateur a des modifications en cours — un
 * rafraîchissement de liste ne doit pas effacer ce qu'il est en train de
 * taper. Écriture d'état pendant le rendu et non dans un effet : c'est la forme
 * sanctionnée pour un état dérivé, et elle évite un rendu intermédiaire où le
 * formulaire afficherait l'ancienne valeur. */
export function useFormulaireFiche<T extends Record<string, unknown>>(source: T) {
  const [etat, setEtat] = useState<{ base: T; brouillon: T }>(() => ({ base: source, brouillon: source }));

  const champsModifies = (Object.keys(etat.brouillon) as (keyof T)[]).filter(
    (k) => !memeValeur(etat.brouillon[k], etat.base[k]),
  );
  const estModifie = champsModifies.length > 0;

  // Resynchronisation. Le garde sur `estModifie` est le point délicat : sans
  // lui, n'importe quel refetch balaie la saisie en cours.
  if (source !== etat.base && !estModifie) {
    setEtat({ base: source, brouillon: source });
  }

  const set = useCallback(<K extends keyof T>(champ: K, valeur: T[K]) => {
    setEtat((e) => ({ ...e, brouillon: { ...e.brouillon, [champ]: valeur } }));
  }, []);

  const annuler = useCallback(() => {
    setEtat((e) => ({ ...e, brouillon: e.base }));
  }, []);

  /** À appeler avec la réponse du serveur après un enregistrement réussi : la
   * fiche renvoyée devient la nouvelle base, et le formulaire redevient
   * propre sans attendre un refetch. */
  const confirmer = useCallback((nouvelle: T) => {
    setEtat({ base: nouvelle, brouillon: nouvelle });
  }, []);

  const aChange = useCallback(
    (...champs: (keyof T)[]) => champs.some((c) => !memeValeur(etat.brouillon[c], etat.base[c])),
    [etat],
  );

  return { valeurs: etat.brouillon, base: etat.base, set, aChange, champsModifies, estModifie, annuler, confirmer };
}

/** `null`, `undefined` et `''` sont trois façons de dire « pas renseigné » et
 * arrivent indifféremment du serveur ; les confondre ici évite qu'un champ
 * jamais touché se déclare modifié au seul motif que l'API a renvoyé `null`
 * là où le formulaire tient `''`. */
function memeValeur(a: unknown, b: unknown): boolean {
  const vide = (v: unknown) => v === null || v === undefined || v === '';
  if (vide(a) && vide(b)) return true;
  return a === b;
}
