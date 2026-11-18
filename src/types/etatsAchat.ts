// FEATURE-n7-etats-achat.md N7a : états Achat (TVA déductible, suivi des avances, suivi des retenues de garantie).
import type { UUID } from '../types';

export interface FiltresEtatsAchat {
  /** `YYYY-MM-DD` inclus, obligatoire (400 sinon) ; « Tous » = 1900-01-01. */
  du: string;
  /** `YYYY-MM-DD` inclus jusqu'à minuit, obligatoire ; « Tous » = 2099-12-31. */
  au: string;
  /** Société non habilitée : rien. */
  societeId?: UUID;
  /** Hors périmètre ignoré ; exclut les pièces sans projet. */
  projetIds?: UUID[];
  /** Texte contenu dans le nom du fournisseur. */
  tiers?: string;
  /** Texte contenu dans le code ou la description du projet. */
  projet?: string;
  /** Texte contenu dans le code ou la description du lot. */
  lot?: string;
}

/** Ligne de facture ; `sansLignes` : facture sans ligne lue sur l'en-tête (quantité, PU, remise à null). */
export interface LigneTvaDeductible {
  factureId: UUID;
  factureCode: string | null;
  dateFacture: string | null;
  statut: string | null;
  /** Listée, exclue des totaux. */
  annulee: boolean;
  fournisseur: string | null;
  projet: string | null;
  societe: string | null;
  description: string | null;
  quantite: number | null;
  prixUnitaireHT: number | null;
  remisePct: number | null;
  montantHT: number;
  tauxTvaPct: number;
  montantTva: number;
  sansLignes: boolean;
}

export interface MoisTvaDeductible {
  /** Premier jour du mois, `YYYY-MM-01` ; un mois sans facture est absent. */
  mois: string;
  factures: number;
  montantHT: number;
  montantTva: number;
}

/** Hors factures annulées. */
export interface TotauxTvaDeductible {
  factures: number;
  montantHT: number;
  montantTva: number;
  montantTvaValidee: number;
  montantTvaEnAttente: number;
}

export interface EtatTvaDeductible {
  lignes: LigneTvaDeductible[];
  parMois: MoisTvaDeductible[];
  totaux: TotauxTvaDeductible;
}

/** Colonnes de pièce communes aux deux suivis. */
interface PieceSuiviAchat {
  pieceId: UUID;
  date: string | null;
  code: string | null;
  description: string | null;
  /** Entité fonctionnelle (StrEntity). */
  nature: string | null;
  statut: string | null;
  /** Listée, exclue des totaux. */
  annulee: boolean;
  fournisseur: string | null;
  projet: string | null;
  societe: string | null;
  lot: string | null;
  lotId: UUID | null;
}

export interface LigneSuiviAvance extends PieceSuiviAchat {
  avance: number;
  ajustement: number;
  amortissement: number;
}

export interface TotauxSuiviAvances {
  avance: number;
  ajustement: number;
  amortissement: number;
}

export interface SuiviAvances {
  lignes: LigneSuiviAvance[];
  totaux: TotauxSuiviAvances;
}

export interface LigneSuiviRetenue extends PieceSuiviAchat {
  retenue: number;
  penalite: number;
  rembourse: number;
}

export interface TotauxSuiviRetenues {
  retenue: number;
  penalite: number;
  rembourse: number;
}

export interface SuiviRetenues {
  lignes: LigneSuiviRetenue[];
  totaux: TotauxSuiviRetenues;
}
