import { ApiError } from './api';
import { reglementStatutLabel } from './domain';

/* Les règles de statut d'un règlement, côté front — deux fonctions pures,
 * volontairement hors de `ReglementPreuves.tsx`.
 *
 * La raison est mécanique : un module qui exporte des composants React ne peut
 * rien exporter d'autre sans casser le rechargement à chaud de Vite
 * (`react-refresh/only-export-components`). Elle est aussi juste — ce ne sont
 * pas des composants, ce sont les deux endroits où l'application anticipe un
 * refus du serveur plutôt que de le subir. */

/** Le seul cas où le serveur refuse une suppression de preuve : la dernière
 * d'un règlement `POINTED` (409). Plutôt que d'envoyer la requête pour en
 * récolter l'erreur, on désactive le bouton en amont — et on dit pourquoi.
 *
 * **Deux** rendus l'appliquent : le panneau replié de l'échéancier et l'onglet
 * « Documents joints » de la fiche encaissement. Une règle serveur, une
 * expression. */
export function raisonPreuveVerrouillee(statut: string | undefined, nbPieces: number | undefined): string | undefined {
  return statut === 'POINTED' && nbPieces === 1
    ? 'Un règlement pointé ne peut pas perdre sa dernière preuve de paiement. Déposez la nouvelle avant de supprimer celle-ci.'
    : undefined;
}

/** Un 409 sur un changement de statut porte `transitionsAutorisees` à côté du
 * `detail` — les afficher évite le classique « ça a échoué » sans issue.
 * `ApiError.problem` est le corps ProblemDetail parsé (voir lib/api.ts). */
export function messageErreurStatut(err: unknown): string {
  const base = err instanceof Error ? err.message : "Échec de l'opération.";
  if (!(err instanceof ApiError) || err.status !== 409) return base;
  const permises = err.problem?.transitionsAutorisees;
  if (!Array.isArray(permises) || permises.length === 0) return base;
  const libelles = permises.map((t) => reglementStatutLabel(String(t))).join(', ');
  return `${base} Transitions possibles : ${libelles}.`;
}
