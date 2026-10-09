import { ApiError } from './api';
import { encaissementEtatLabel } from './domain';

/* Hors de `ReglementPreuves.tsx` exprès : un module qui exporte des composants ne
 * peut rien exporter d'autre (`react-refresh/only-export-components`). */

/** Miroir de l'unique refus serveur (409) ; partagé par les deux écrans de preuves. */
export function raisonPreuveVerrouillee(statut: string | undefined, nbPieces: number | undefined): string | undefined {
  return statut === 'POINTED' && nbPieces === 1
    ? 'Un règlement pointé ne peut pas perdre sa dernière preuve de paiement. Déposez la nouvelle avant de supprimer celle-ci.'
    : undefined;
}

export function messageErreurStatut(err: unknown): string {
  const base = err instanceof Error ? err.message : "Échec de l'opération.";
  if (!(err instanceof ApiError) || err.status !== 409) return base;
  const permises = err.problem?.transitionsAutorisees;
  if (!Array.isArray(permises) || permises.length === 0) return base;
  const libelles = permises.map((t) => encaissementEtatLabel(String(t))).join(', ');
  return `${base} Transitions possibles : ${libelles}.`;
}
