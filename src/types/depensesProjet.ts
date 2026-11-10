// DTO de FEATURE-achat-depenses-projet.md §4.2 (noms du fil, docs/api-docsV4.json).
import type { UUID } from '../types';

export interface DepensesLotDto {
  /** null = ligne « Hors lot ». */
  lotId: UUID | null;
  lotCode: string | null;
  nbFactures: number;
  montantTTC: number;
  montantAPayer: number;
  /** Règlements annulés exclus. */
  montantRegle: number;
  resteARegler: number;
  nbNonSoldees: number;
  nbTropReglees: number;
  nbFacturesDecompte: number;
}

export interface DepensesProjetDto {
  projetId: UUID;
  projetCode: string | null;
  projetDescription: string | null;
  nbFactures: number;
  montantTTC: number;
  montantAPayer: number;
  montantRegle: number;
  resteARegler: number;
  nbNonSoldees: number;
  /** Σ des restes des seules factures non soldées. */
  resteNonSoldees: number;
  nbTropReglees: number;
  nbFacturesDecompte: number;
  /** Tri par code, « Hors lot » en dernier. */
  lots: DepensesLotDto[];
}

export interface ReglementProjetDto {
  /** Id de la ligne d'affectation. */
  id: UUID;
  reglementId: UUID;
  reglementCode: string | null;
  dateReglement: string | null;
  dateEcheance: string | null;
  typeCode: string | null;
  typeDescription: string | null;
  montant: number;
  annule: boolean;
  factureId: UUID;
  factureCode: string | null;
  fournisseurNom: string | null;
  projetId: UUID;
  projetCode: string | null;
  lotId: UUID | null;
  lotCode: string | null;
  decompteId: UUID | null;
  decompteCode: string | null;
}

/** Filtres de `/api/projet/depenses/reglements` ; liste vide = pas de filtre. */
export interface FiltresReglementsProjet {
  projetIds?: UUID[];
  lotId?: UUID;
  factureId?: UUID;
  du?: string;
  au?: string;
  /** false : lignes des règlements annulés exclues ; absent = true. */
  inclureAnnules?: boolean;
}
