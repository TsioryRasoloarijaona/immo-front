import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '../../../lib/auth';
import { ErreurVirement, lireMeta, lireMoi, surAccesRefuse } from '../../../lib/virements';
import type { Meta, Moi } from './types';

/** État partagé par les écrans du module : qui je suis pour le service
 * (`GET /moi`), le référentiel (`GET /meta`, chargé une fois — §2) et une
 * révision qui avance après chaque écriture.
 *
 * La révision est la règle de fraîcheur (R5) : chaque liste la met dans les
 * dépendances de son `useApi`, donc une génération, une pièce déposée ou un
 * bénéficiaire supprimé fait relire l'historique, les bénéficiaires et les
 * sociétés montés — sans que l'écran qui agit ait à savoir qui en dépend.
 *
 * L'état vit au niveau module mais **appartient à un utilisateur CRM** :
 * `proprietaire` est son id, et un autre utilisateur dans le même onglet
 * (déconnexion puis reconnexion, sans rechargement) repart de zéro au lieu
 * d'hériter du `admin` du précédent. */
export interface EtatContexte {
  moi: Moi | null;
  meta: Meta | null;
  erreur: string | null;
  /** `/moi` a répondu 403 : l'utilisateur n'a aucun rôle d'accès au service.
   * Le message du service, affiché pour tout le module. */
  accesRefuse: string | null;
  revision: number;
}

const VIDE: EtatContexte = { moi: null, meta: null, erreur: null, accesRefuse: null, revision: 0 };

let etat: EtatContexte = VIDE;
let proprietaire: string | null = null;
/** Avance à chaque changement d'utilisateur : une réponse arrivée après le
 * changement est ignorée. */
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
      // Échec : le prochain écran monté retentera — une fois par montage,
      // jamais en boucle.
      chargement = null;
      publier(estAccesRefuse(e) ? { accesRefuse: e.erreur } : { erreur: message(e) });
    });
  return chargement;
}

/** Relit `/moi` : après un 403 « réservé aux administrateurs », les droits
 * ont pu changer pendant la session (§12) et l'affichage se réaligne. */
export function relireMoi(): void {
  const g = generation;
  lireMoi()
    .then((moi) => {
      if (g === generation) publier({ moi, accesRefuse: null });
    })
    .catch((e: unknown) => {
      // Plus aucun accès : tout le module passe en « Accès réservé ». Les
      // autres erreurs sont déjà signalées par l'écran qui a appelé.
      if (g === generation && estAccesRefuse(e)) publier({ accesRefuse: e.erreur });
    });
}

// Un 403 de `/moi` n'appelle jamais `/moi` (c'était une boucle) ; seul un
// refus qui parle d'administrateur justifie de relire le niveau (§12).
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

/** Retente après un échec de chargement (bouton de l'écran d'erreur). */
export function rechargerContexte(): void {
  publier({ erreur: null });
  void charger();
}
