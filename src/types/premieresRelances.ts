// Miroir des DTO de FEATURE-patrimoine-relances-champs.md (relances), noms du fil exacts.
import type { UUID } from '../types';

export interface LigneApercuRelanceDto {
  dossierId: UUID;
  code: string | null;
  client: string | null;
  article: string | null;
  statut: string | null;
  /** yyyy-MM-dd, null si aucune. */
  echeanceActuelle: string | null;
  alerte: boolean;
}

export interface ApercuPremieresRelancesDto {
  dateRelance: string;
  premierDelai: number | null;
  echeance: string;
  dossiers: number;
  alertes: number;
  avertissement: string | null;
  lignes: LigneApercuRelanceDto[];
}

export interface ResultatPremieresRelancesDto {
  dossiersModifies: number;
  alertesCreees: number;
}
