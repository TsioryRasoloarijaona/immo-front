// Contrat de FEATURE-projet-config.md (/api/projet/config) ; noms du fil exacts.
import type { ReferentielItemDto, UUID } from '../types';

export interface ProjetConfigDto {
  id: UUID;
  code?: string;
  description?: string;
  descriptionLongue?: string | null;
  adresse?: string | null;
  notes?: string | null;
  societeId?: UUID | null;
  societeCode?: string | null;
  /** StrEntity « PrjProject », posé par le serveur. */
  entiteId?: UUID | null;
  entiteCode?: string | null;
  /** Posé par le serveur (« Nouveau » à la création). */
  statutId?: UUID | null;
  statutCode?: string | null;
  gestionnaireId?: UUID | null;
  gestionnaireNom?: string | null;
  ventile: boolean;
  tauxVentilationDefaut?: number | null;
  partiesCommunes: boolean;
  /** Code « AAAA-… » : projet comptable d'exercice (badge « Exercice »). */
  anneeSociete: boolean;
  nbLots: number;
  nbPiecesAchat: number;
  dateCreation?: string | null;
  creePar?: string | null;
  dateModification?: string | null;
  modifiePar?: string | null;
  dateLancementPrevisionnelle?: string | null;
  dateAchevementPrevisionnelle?: string | null;
  dateLancementReelle?: string | null;
  dateAchevementReelle?: string | null;
  /** StkLeveling.PKey. */
  nivellementId?: UUID | null;
  /** Projet référence (autre PrjProject). */
  projetReferenceId?: UUID | null;
  /** Lot gestionnaire du compte prorata (PrjMarket de ce projet). */
  lotGestionnaireProrataId?: UUID | null;
}

/** Champs que `champsAVider` peut remettre à null. */
export type ChampVidableProjet =
  | 'dateLancementPrevisionnelle'
  | 'dateAchevementPrevisionnelle'
  | 'dateLancementReelle'
  | 'dateAchevementReelle'
  | 'nivellementId'
  | 'projetReferenceId'
  | 'lotGestionnaireProrataId';

/** Création ou remplacement complet ; 400 sans code, libellé ou société, 409 code déjà utilisé. */
export interface ProjetConfigRequest {
  code: string;
  description: string;
  descriptionLongue?: string | null;
  adresse?: string | null;
  notes?: string | null;
  societeId: UUID;
  gestionnaireId?: UUID | null;
  ventile?: boolean | null;
  tauxVentilationDefaut?: number | null;
  partiesCommunes?: boolean | null;
  /** Absent = inchangé (comme les 6 suivants) ; pour vider, nommer le champ dans `champsAVider`. */
  dateLancementPrevisionnelle?: string | null;
  dateAchevementPrevisionnelle?: string | null;
  dateLancementReelle?: string | null;
  dateAchevementReelle?: string | null;
  nivellementId?: UUID | null;
  projetReferenceId?: UUID | null;
  lotGestionnaireProrataId?: UUID | null;
  champsAVider?: ChampVidableProjet[] | null;
}

export interface VentilationTrancheDto {
  id: UUID;
  trancheId: UUID;
  trancheCode?: string | null;
  trancheDescription?: string | null;
  /** Fraction 0–1 (VentilationRate). */
  taux?: number | null;
}

/** 400 : tranche hors société ou déjà ventilée, Σ arrondie à 2 décimales > 1. */
export interface VentilationTrancheEcritureDto {
  trancheId: UUID;
  taux: number;
}

export interface CritereAvancementDto {
  id: UUID;
  /** O.D.T. */
  ordre?: number | null;
  description?: string | null;
  categorieId?: UUID | null;
  categorieCode?: string | null;
  categorieDescription?: string | null;
}

/** `ordre` absent = nombre de critères + 1 ; catégorie de dépense obligatoire. */
export interface CritereAvancementEcritureDto {
  ordre?: number | null;
  description: string;
  categorieId: UUID;
}

export interface ImportCriteresDto {
  projetSourceId: UUID;
}

export interface TransitionProjetDto {
  id: UUID;
  code?: string | null;
  description?: string | null;
  statutCible?: ReferentielItemDto | null;
  commentaireObligatoire: boolean;
  avecDateUtilisateur: boolean;
  /** Non pris en charge : 409 à l'exécution. */
  secondUtilisateur: boolean;
}

export interface ExecutionTransitionProjetDto {
  transitionId: UUID;
  commentaire?: string | null;
  dateUtilisateur?: string | null;
}

export interface HistoriqueProjetDto {
  id: UUID;
  date?: string | null;
  description?: string | null;
  utilisateur?: string | null;
  transition?: string | null;
  statut?: string | null;
  commentaire?: string | null;
  dateUtilisateur?: string | null;
}

export interface ChoixProjetDto {
  tranches: ReferentielItemDto[];
  lots: ReferentielItemDto[];
}

export interface TypeLotParDefautDto {
  typeLotId?: UUID | null;
}

export interface StatutLotDto {
  id: UUID;
  code?: string;
  description?: string;
  ordre?: number | null;
  /** Nom de couleur .NET (`LimeGreen`…), tel quel. */
  couleur?: string | null;
  groupeId: UUID;
  groupeCode?: string;
  /** Libellé du genre de lot (Entrepreneurs, Fournisseurs, Maîtres d'ouvrage). */
  genre?: string;
  categorie?: string | null;
}

export interface ReferentielsProjetConfigDto {
  societes: ReferentielItemDto[];
  statutsProjet: ReferentielItemDto[];
  /** `description` = nom du membre du personnel. */
  gestionnaires: ReferentielItemDto[];
  /** StkLeveling, `description` = code. */
  nivellements: ReferentielItemDto[];
  /** StlCategory de dépense (critères d'avancement). */
  categoriesDepense: ReferentielItemDto[];
}
