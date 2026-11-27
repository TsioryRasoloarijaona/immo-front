// Miroir des DTO des demandes de remise d'agence (FEATURE-agences-vente.md A3), noms du fil exacts.
import type { UUID } from '../types';

export type StatutDemandeRemise = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE' | 'ANNULEE';

/** Taux en pourcentage 0-100. */
export interface DemanderRemiseRequest {
  taux: number;
  motif: string;
}

/** `taux` absent = taux demandé accordé. */
export interface AccepterRemiseRequest {
  taux?: number | null;
}

export interface RefuserRemiseRequest {
  motif: string;
}

export interface DemandeRemiseDto {
  id: UUID;
  dossierId: UUID;
  statut: StatutDemandeRemise;
  tauxDemande: number;
  tauxAccorde: number | null;
  motif: string;
  motifRefus: string | null;
  demandeLe: string;
  traiteLe: string | null;
  dossierCode: string;
  agence: string | null;
  vendeur: string | null;
  lot: string | null;
  prix: number | null;
  tauxActuel: number | null;
}
