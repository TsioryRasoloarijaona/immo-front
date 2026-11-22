// DTO de FEATURE-n3-recettes-depenses.md (noms du fil, docs/api-docsV4.json).
import type { UUID } from '../types';

export type ModuleTresorerie = 'PRJ' | 'BUY';
export type DateTresorerie = 'PIECE' | 'ECHEANCE' | 'POINTAGE' | 'POINTAGE_REPORTE';
export type SensTresorerie = 'DEBIT' | 'CREDIT';
export type VueRecette = 'proforma' | 'factures' | 'avoirs' | 'encaissements';

export interface FiltresTresorerie {
  module: ModuleTresorerie;
  societeId?: UUID;
  projetIds?: UUID[];
  /** Ajoute les pièces / règlements sans projet ; seul = uniquement eux. */
  sansProjet?: boolean;
  /** Date filtrée par du / au ; PIECE par défaut. */
  dateSur?: DateTresorerie;
  du?: string;
  au?: string;
  typeIds?: UUID[];
  statuts?: string[];
  compteId?: UUID;
  tiersId?: UUID;
  montantDe?: number;
  montantA?: number;
  comptabilise?: boolean;
  /** Absent = true : les annulés sont listés, jamais totalisés. */
  inclureAnnules?: boolean;
  recherche?: string;
  page?: number;
  taille?: number;
}

export interface ListeTresorerieDto<L, T> {
  lignes: L[];
  /** Nombre de lignes de toute la liste filtrée. */
  total: number;
  /** Totaux de toute la liste filtrée, hors annulés. */
  totaux: T;
}

export interface TotauxDecaissementsDto {
  montant: number;
  montantAffecte: number;
  resteAAffecter: number;
}

export interface TotauxAffectationsDto {
  montantAffecte: number;
  /** Chaque règlement compté une fois. */
  montantReglement: number;
  debit: number;
  credit: number;
}

export interface TotauxRecettesDto {
  montant: number;
}

export interface DecaissementLigneDto {
  id: UUID;
  code: string | null;
  description: string | null;
  datePiece: string | null;
  echeance: string | null;
  datePointage: string | null;
  dateMouvement: string | null;
  type: string | null;
  tiers: string | null;
  banque: string | null;
  compte: string | null;
  statut: string | null;
  statutLibelle: string | null;
  montant: number | null;
  /** Σ de toutes les lignes du règlement, même invisibles. */
  montantAffecte: number | null;
  resteAAffecter: number | null;
  societe: string | null;
  comptabilise: boolean;
  nonAffecte: boolean;
  enRetard: boolean;
}

export interface PieceTresorerieDto {
  id: UUID;
  type: string | null;
  libelle: string | null;
}

export interface LigneDecaissementDto {
  id: UUID;
  piece: PieceTresorerieDto | null;
  fournisseur: string | null;
  projetId: UUID | null;
  projet: string | null;
  lotId: UUID | null;
  lot: string | null;
  montantAffecte: number | null;
}

export interface DecaissementFicheDto {
  decaissement: DecaissementLigneDto;
  notes: string | null;
  codeRecu: string | null;
  devise: string | null;
  /** Affectations dont la pièce est visible seulement. */
  lignes: LigneDecaissementDto[];
  lignesMasquees: number;
  /** Corps exact d'un PUT (lignes visibles seulement). */
  saisie: SaisieDecaissementDto;
}

export interface AffectationLigneDto {
  id: UUID;
  reglementId: UUID;
  code: string | null;
  description: string | null;
  datePiece: string | null;
  echeance: string | null;
  datePointage: string | null;
  dateMouvement: string | null;
  codeRecu: string | null;
  statut: string | null;
  statutLibelle: string | null;
  montantReglement: number | null;
  tiers: string | null;
  type: string | null;
  banque: string | null;
  compte: string | null;
  module: string | null;
  categorie: string | null;
  societe: string | null;
  projet: string | null;
  /** Toujours null (non porté). */
  tranche: string | null;
  article: string | null;
  lot: string | null;
  pieceLiee: PieceTresorerieDto | null;
  montantPiece: number | null;
  montantAffecte: number | null;
  dossierCode: string | null;
  dossierStatut: string | null;
}

export interface ColonneRecetteDto {
  cle: string;
  libelle: string;
  type: 'TEXTE' | 'NOMBRE' | 'MONTANT' | 'DATE' | 'BOOLEEN';
  /** false : masquée par défaut dans OMRAN. */
  visible: boolean;
}

export interface RecettesDto {
  colonnes: ColonneRecetteDto[];
  /** `id` plus une entrée par clé de colonne. */
  lignes: Record<string, unknown>[];
  total: number;
  totaux: TotauxRecettesDto;
}

// Saisie des décaissements (FEATURE-n3bis-saisie-reglements.md §3-§4).
/** CANCELED se lit mais n'est pas proposé à la saisie (400). */
export type StatutSaisieDecaissement = 'IN_WORK' | 'POINTED' | 'NOTPAYED' | 'CANCELED';

export interface LigneSaisieDecaissementDto {
  pieceId: UUID;
  montant: number;
}

export interface SaisieDecaissementDto {
  /** Requis à la création, ignoré au PUT. */
  module?: ModuleTresorerie | null;
  societeId: UUID | null;
  /** yyyy-MM-dd ; absente = jour. */
  dateDocument?: string | null;
  /** Absente = date pièce. */
  dateEcheance?: string | null;
  typeId: UUID | null;
  reference?: string | null;
  compteId?: UUID | null;
  banqueId?: UUID | null;
  montant: number;
  fournisseurId: UUID | null;
  payeurId?: UUID | null;
  notaireId?: UUID | null;
  tiersAutruiId?: UUID | null;
  notes?: string | null;
  /** Date de pointage (SettlementDate). */
  dateDecaissement?: string | null;
  statut: StatutSaisieDecaissement;
  codeRecu?: string | null;
  codeFeuillePaiement?: string | null;
  codeFeuilleRs?: string | null;
  /** PUT : remplace les lignes visibles ; les masquées sont gardées. */
  lignes: LigneSaisieDecaissementDto[];
}

export interface TypeDecaissementDto {
  id: UUID;
  code: string | null;
  libelle: string | null;
  referenceObligatoire: boolean;
  referenceUnique: boolean;
  banqueObligatoire: boolean;
  notaireObligatoire: boolean;
  tiersUnique: boolean;
  exclu: boolean;
}

export interface SocieteDecaissementDto {
  id: UUID;
  code: string | null;
  libelle: string | null;
}

export interface CompteDecaissementDto {
  id: UUID;
  code: string | null;
  societeId: UUID | null;
  devise: string | null;
}

export interface DroitsDecaissementDto {
  peutCreer: boolean;
  peutSupprimer: boolean;
  peutEnregistrerSansAffectation: boolean;
  peutChangerSociete: boolean;
}

export interface ReferentielsDecaissementDto {
  types: TypeDecaissementDto[];
  societes: SocieteDecaissementDto[];
  comptes: CompteDecaissementDto[];
  devise: string | null;
  statuts: string[];
  droits: DroitsDecaissementDto;
}

export interface PieceAAffecterDto {
  id: UUID;
  code: string | null;
  dateDocument: string | null;
  dateEcheance: string | null;
  description: string | null;
  netAPayer: number;
  regle: number;
  resteAPayer: number;
  deviseCode: string | null;
}
