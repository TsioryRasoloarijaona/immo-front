import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../../../lib/auth';
import { ErreurVirement, lireMeta, lireMoi, surAccesRefuse } from '../../../lib/virements';
import type { Meta, Moi } from './types';

/** `revision` avance après chaque écriture : chaque liste la met dans les dépendances de son `useApi`.
 * L'état appartient à un utilisateur CRM (`proprietaire`) : un autre compte dans le même onglet repart de zéro
 * au lieu d'hériter du `admin` du précédent. */
export interface EtatContexte {
  moi: Moi | null;
  meta: Meta | null;
  erreur: string | null;
  /** `/moi` en 403 : aucun rôle d'accès au service ; ce message vaut pour tout le module. */
  accesRefuse: string | null;
  revision: number;
}

const VIDE: EtatContexte = { moi: null, meta: null, erreur: null, accesRefuse: null, revision: 0 };

let etat: EtatContexte = VIDE;
let proprietaire: string | null = null;
/** Avance à chaque changement d'utilisateur : une réponse arrivée après est ignorée. */
let generation = 0;
let chargement: Promise<void> | null = null;
const abonnes = new Set<() => void>();

function publier(patch: Partial<EtatContexte>) {
  etat = { ...etat, ...patch };
  abonnes.forEach((f) => f());
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue.';
}

function estAccesRefuse(e: unknown): e is ErreurVirement {
  return e instanceof ErreurVirement && e.status === 403;
}

function charger(): Promise<void> {
  const g = generation;
  chargement ??= Promise.all([lireMoi(), lireMeta()])
    .then(([moi, meta]) => {
      if (g === generation) publier({ moi, meta, erreur: null, accesRefuse: null });
    })
    .catch((e: unknown) => {
      if (g !== generation) return;
      // Le prochain écran monté retentera : une fois par montage, jamais en boucle.
      chargement = null;
      publier(estAccesRefuse(e) ? { accesRefuse: e.erreur } : { erreur: message(e) });
    });
  return chargement;
}

export function relireMoi(): void {
  const g = generation;
  lireMoi()
    .then((moi) => {
      if (g === generation) publier({ moi, accesRefuse: null });
    })
    .catch((e: unknown) => {
      // Seul le 403 est traité ici : les autres erreurs sont déjà signalées par l'écran appelant.
      if (g === generation && estAccesRefuse(e)) publier({ accesRefuse: e.erreur });
    });
}

// Un 403 de `/moi` ne relit jamais `/moi` (boucle) ; seul un refus qui parle d'administrateur relit le niveau.
surAccesRefuse((err, chemin) => {
  if (chemin === '/moi') return;
  if (/administrateur/i.test(err.erreur)) relireMoi();
});

/** À appeler après toute écriture réussie. */
export function rafraichir(): void {
  publier({ revision: etat.revision + 1 });
}

function abonner(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

export function useContexteVirement(): EtatContexte {
  const { user } = useAuth();
  const id = user?.id ?? null;
  const valeur = useSyncExternalStore(abonner, () => etat);
  useEffect(() => {
    if (id !== proprietaire) {
      proprietaire = id;
      generation++;
      chargement = null;
      etat = { ...VIDE, revision: etat.revision + 1 };
      abonnes.forEach((f) => f());
    }
    if (id !== null && !etat.meta && !etat.moi && !etat.accesRefuse && !etat.erreur) void charger();
  }, [id]);
  // L'état d'un autre utilisateur ne s'affiche jamais, même le temps d'un rendu.
  return id === proprietaire ? valeur : VIDE;
}

export function rechargerContexte(): void {
  publier({ erreur: null });
  void charger();
}
