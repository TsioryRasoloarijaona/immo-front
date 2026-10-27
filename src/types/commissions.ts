// Miroir des DTO de FEATURE-vente-commissions.md §4 (écran Commissions), noms du fil exacts.
import type { UUID } from '../types';

/** Paramètre `type` des filtres et de la génération (une ligne porte, elle, le libellé stocké). */
export type TypeCommission = 'CONCRETISATION' | 'FINALISATION_1' | 'FINALISATION_2' | 'DESISTEMENT';

export type RaisonIgnoree =
  | 'SANS_PERSONNE'
  | 'SANS_DATE'
  | 'SANS_REGLE'
  | 'MONTANT_NUL'
  | 'DEJA_GENERE'
  | 'DOSSIER_DESISTE'
  | 'SANS_COMMISSION_A_REPRENDRE'
  | 'NON_DESISTE';

export interface CommissionTrancheDto {
  trancheId: UUID;
  code: string | null;
  description: string | null;
  vendus: number;
  restants: number;
  montantGenere: number;
  montantRegle: number;
  montantReste: number;
  caStock: number;
  caRealise: number;
  caReste: number;
}

export interface DossierCommissionDto {
  dossierId: UUID;
  code: string | null;
  statut: string | null;
  articleCode: string | null;
  article: string | null;
  categorie: string | null;
  client: string | null;
  commercialId: UUID | null;
  commercial: string | null;
  commercialExterne: boolean;
  gestionnaireId: UUID | null;
  gestionnaire: string | null;
  gestionnaireExterne: boolean;
  gestionnaire2Id: UUID | null;
  gestionnaire2: string | null;
  gestionnaire2Externe: boolean;
  prospection: string | null;
  /** yyyy-MM-dd, comme toutes les dates de ce fichier. */
  dateConcretisation: string | null;
  dateEnregistrementContrat: string | null;
  dateEnvoiNotaire: string | null;
  dateAnnulation: string | null;
  dateFinalisation1: string | null;
  dateFinalisation2: string | null;
  prixVenteTtc: number | null;
  commissionConcretisation: number;
  commissionFinalisation1: number;
  commissionFinalisation2: number;
  commissionDesistement: number;
  montantRegle: number;
  montantAPayer: number;
  montantReste: number;
}

export interface LigneCommissionCalculeeDto {
  id: UUID;
  date: string | null;
  /** Libellé stocké : « Concrétisation », « Finalisation 1 », « Désistement (support) »… */
  type: string | null;
  montant: number;
  modeCalcul: string | null;
  dossierId: UUID | null;
  dossierCode: string | null;
  client: string | null;
  articleCode: string | null;
  article: string | null;
  categorie: string | null;
  tranche: string | null;
  statut: string | null;
  commercialId: UUID | null;
  commercial: string | null;
  regle: number;
  reste: number;
  documentId: UUID | null;
  documentCode: string | null;
  modifiable: boolean;
}

export interface DossierIgnoreDto {
  dossierId: UUID;
  dossierCode: string | null;
  raison: RaisonIgnoree;
  libelle: string;
}

export interface ResultatGenerationDto {
  creees: LigneCommissionCalculeeDto[];
  ignores: DossierIgnoreDto[];
}

export interface LigneDocumentCommissionDto {
  ligneId: UUID;
  libelle: string | null;
  montant: number;
}

export interface DocumentCommissionDto {
  id: UUID;
  code: string | null;
  date: string | null;
  commercialId: UUID | null;
  commercial: string | null;
  montant: number;
  regle: number;
  reste: number;
  statut: string | null;
  lignes: LigneDocumentCommissionDto[];
}

export interface DroitsCommissionDto {
  ecriture: boolean;
  suppression: boolean;
  impression: boolean;
}

/** Filtres des onglets Dossiers et Commissions ; absent = pas de filtre. */
export interface FiltresCommission {
  type?: TypeCommission;
  du?: string;
  au?: string;
  commercialId?: UUID;
  dossier?: string;
}
