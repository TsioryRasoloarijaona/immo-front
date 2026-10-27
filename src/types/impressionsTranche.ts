// Miroir des DTO de FEATURE-patrimoine-impressions-tranche.md (Relance 2 par statut), noms du fil exacts.
import type { UUID } from '../types';

/** Une lettre : un acquéreur d'un dossier retenu, dans l'ordre des pages du PDF. */
export interface LigneRelance2Dto {
  dossierId: UUID;
  codeDossier: string | null;
  article: string | null;
  statut: string | null;
  acquereur: string | null;
  estCoAcquereur: boolean;
  prixVente: number;
  prixRegle: number;
  /** Reste du prix (prixVente.reste), toujours > 0. */
  reste: number;
  /** yyyy-MM-dd, null si absente. */
  dateRelance2: string | null;
}

/** Dossier retenu sans lettre : reste du prix ≤ 0. */
export interface EcarteRelance2Dto {
  dossierId: UUID;
  codeDossier: string | null;
  article: string | null;
  statut: string | null;
  client: string | null;
  prixVente: number;
  prixRegle: number;
  reste: number;
}

export interface StatutRelance2Dto {
  id: UUID;
  code: string;
  description: string | null;
}

export interface GroupeStatutRelance2Dto {
  statut: StatutRelance2Dto;
  /** Dossiers retenus, écartés compris. */
  dossiers: number;
  lettres: number;
}

export interface ApercuRelance2Dto {
  trancheId: UUID;
  trancheCode: string | null;
  /** yyyy-MM-dd. */
  dateImpression: string;
  statutsRetenus: string[];
  dossiers: number;
  lettres: number;
  ecartes: EcarteRelance2Dto[];
  modeleActif: boolean;
  parStatut: GroupeStatutRelance2Dto[];
  lignes: LigneRelance2Dto[];
}
