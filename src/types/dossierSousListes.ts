// Miroir des DTO de FEATURE-vente-echeancier.md (échéancier complet et sous-listes de la fiche dossier).
import type { UUID } from '../types';

/* ---- Échéancier ---- */

export interface EtatSchemaDto {
  prixApresRemise?: number | null;
  avance?: number | null;
  credit?: number | null;
  autofinancement?: number | null;
  /** Prix après remise − (avance + crédit + autofinancement) ; 0 = schéma équilibré. */
  ecart?: number | null;
  autofinancementReste?: number | null;
  /** Montant proposé et plafond de la périodicité. */
  montantInitialPeriodicite?: number | null;
}

export type Periodicite = 'MENSUELLE' | 'BIMENSUELLE' | 'TRIMESTRIELLE' | 'SEMESTRIELLE' | 'ANNUELLE';

export interface GenererPeriodiqueRequest {
  categorieId: UUID;
  montantTotal: number;
  nombre: number;
  periodicite: Periodicite;
  premiereDate: string;
  notes?: string;
}

/* ---- Sous-articles ---- */

export interface SousArticleDto {
  id: UUID;
  articleId?: UUID | null;
  code?: string | null;
  description?: string | null;
  categorie?: string | null;
  type?: string | null;
  superficie?: number | null;
  /** Ratio (0.2 = 20 %). */
  tauxTVA?: number | null;
  prixAvantRemiseHT?: number | null;
  prixAvantRemiseTTC?: number | null;
  /** Pourcentage 0–100. */
  remisePercent?: number | null;
  prixHT?: number | null;
  prixTTC?: number | null;
  affecteParDefaut: boolean;
  sousArticleDOrigine: boolean;
}

export interface SousArticlesDto {
  lignes: SousArticleDto[];
  /** Pourcentage 0–100, recalculé à chaque ajout ou retrait. */
  remisePercent?: number | null;
  /** Inchangé par un ajout ou un retrait. */
  remiseMontantHT?: number | null;
  prixAvantRemiseHT?: number | null;
  prixAvantRemiseTTC?: number | null;
  prixApresRemiseHT?: number | null;
  prixApresRemiseTTC?: number | null;
}

export interface SousArticleDisponibleDto {
  id: UUID;
  code?: string | null;
  description?: string | null;
  categorie?: string | null;
  type?: string | null;
  superficie?: number | null;
  prixHT?: number | null;
  tauxTVA?: number | null;
}

/* ---- Acquéreurs ---- */

export interface AcquereurDto {
  /** Null pour le client principal. */
  id?: UUID | null;
  tiersId?: UUID | null;
  nom?: string | null;
  pieceIdentite?: string | null;
  /** Pourcentage 0–100. */
  quotePart?: number | null;
  principal: boolean;
}

export interface ProspectionAArchiverDto {
  id: UUID;
  code?: string | null;
  libelle?: string | null;
}

export interface AcquereursDto {
  acquereurs: AcquereurDto[];
  total?: number | null;
  /** Vide en lecture ; rempli après un enregistrement qui ajoute des acquéreurs. */
  prospectionsAArchiver: ProspectionAArchiverDto[];
}

export interface RepartitionAcquereursRequest {
  quotePartPrincipal: number;
  coAcquereurs: { tiersId: UUID; quotePart: number }[];
}

export interface ArchiverProspectionsRequest {
  prospectionIds: UUID[];
}

/* ---- Modifications ---- */

export type EtatModification =
  | 'ENCOURS'
  | 'REFUSE_PAR_LE_SERVICE_TECHNIQUE'
  | 'REFUSE_PAR_LE_CLIENT'
  | 'ACCEPTEE'
  | 'REALISED';

export interface ModificationDto {
  id: UUID;
  description?: string | null;
  dateDemande?: string | null;
  dateValidationTechnique?: string | null;
  dateValidationClient?: string | null;
  cout?: number | null;
  prixHT?: number | null;
  prixTTC?: number | null;
  etat?: EtatModification | null;
  etatLibelle?: string | null;
  notes?: string | null;
}

export interface ModificationsDto {
  modifications: ModificationDto[];
  montantTTC?: number | null;
  montantHT?: number | null;
  integreAuPrix: boolean;
  /** Null si intégré au prix. */
  ecartSchema?: number | null;
}

export interface ModificationRequest {
  description?: string;
  dateDemande?: string;
  dateValidationTechnique?: string;
  dateValidationClient?: string;
  cout?: number;
  prixHT?: number;
  prixTTC?: number;
  etat?: EtatModification;
  notes?: string;
}

/* ---- Cadeaux ---- */

export interface CadeauDto {
  id: UUID;
  cadeauId?: UUID | null;
  cadeau?: string | null;
  prix?: number | null;
  livre: boolean;
  disponible: boolean;
  raisonId?: UUID | null;
  raison?: string | null;
  dateBon?: string | null;
  dateLivraison?: string | null;
  notes?: string | null;
}

export interface CadeauCatalogueDto {
  id: UUID;
  code?: string | null;
  libelle?: string | null;
  prix?: number | null;
  /** Null pour une raison. */
  enStock?: number | null;
}

export interface CadeauRequest {
  cadeauId?: UUID;
  prix?: number;
  livre?: boolean;
  raisonId?: UUID;
  dateBon?: string;
  /** Obligatoire si `livre` (400 sinon). */
  dateLivraison?: string;
  notes?: string;
}

/* ---- Modalité de paiement ---- */

export interface ModalitePaiementDto {
  id: UUID;
  date?: string | null;
  categorieId?: UUID | null;
  categorie?: string | null;
  montant?: number | null;
  montantHT?: number | null;
  tauxTVA?: number | null;
  remise?: number | null;
  notes?: string | null;
}

export interface CreerModalitePaiementRequest {
  date: string;
  categorieId: UUID;
  montant: number;
  notes?: string;
}
