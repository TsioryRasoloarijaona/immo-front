// DTO de FEATURE-achat-regle-commune.md §4.1 : statuts et transitions des pièces d'achat, en lecture seule.
import type { UUID } from '../types';

export interface StatutAchatConfigDto {
  id: UUID;
  code: string | null;
  description: string | null;
  ordre: number | null;
  /** Type d'état (AdmWorkFlowStateType.Description). */
  categorie: string | null;
  /** Nom de couleur .NET tel quel. */
  couleur: string | null;
  okPourPaiement: boolean;
  valideComptabilite: boolean;
  lectureSeule: boolean;
  dureeVieJours: number | null;
  nombrePieces: number;
  /** AdmWorkFlowStateType.PKey. */
  typeId: UUID | null;
  /** CfgImage.PKey ; octets via urlImageStatut. */
  imageId: UUID | null;
  notes: string | null;
  /** Noms du catalogue `piece`. */
  champsObligatoires: string[];
  /** Noms du catalogue `fournisseur`. */
  champsObligatoiresFournisseur: string[];
  documentsAJoindre: DocumentAJoindreAchatDto[];
  /** Transitions citant ce statut en départ ou en arrivée. */
  nombreTransitions: number;
  nombreHistoriques: number;
}

// FEATURE-statuts-achat-parite.md : écriture des statuts et transitions, droit Yes.Buy.Front.Config.BuyDocumentStatus.
export interface DocumentAJoindreAchatDto {
  typeDocumentId: UUID;
  /** Lecture seule, ignoré en écriture. */
  typeDocumentLibelle?: string | null;
  obligatoire: boolean;
  avecTitre: boolean;
}

/** PUT = fiche entière : un champ absent prend sa valeur par défaut. */
export interface StatutAchatEcritureDto {
  ordre: number;
  code: string;
  description: string;
  typeId: UUID;
  dureeVieJours?: number;
  /** Nom de couleur .NET ou vide. */
  couleur?: string;
  okPourPaiement?: boolean;
  valideComptabilite?: boolean;
  lectureSeule?: boolean;
  imageId?: UUID | null;
  notes?: string;
  champsObligatoires?: string[];
  champsObligatoiresFournisseur?: string[];
  documentsAJoindre?: DocumentAJoindreAchatDto[];
}

export interface TransitionAchatEcritureDto {
  ordre?: number;
  description?: string;
  statutDepartId: UUID;
  statutArriveeId: UUID;
  /** Absent = « Sans gestion ». */
  gestionId?: UUID | null;
  noteObligatoire?: boolean;
  valideeParDeclencheur?: boolean;
  /** Remplacés en bloc ; vide = aucun rôle. */
  roleIds?: UUID[];
}

/** Type d'état (/statuts/types) ou type de document (/statuts/types-documents). */
export interface TypeAchatDto {
  id: UUID;
  code: string | null;
  description: string | null;
}

export interface ChampStatutAchatDto {
  nom: string;
  libelle: string;
}

export interface CatalogueChampsStatutDto {
  piece: ChampStatutAchatDto[];
  fournisseur: ChampStatutAchatDto[];
}

export interface ImageStatutDto {
  id: UUID;
  code: string | null;
  taille: number;
}

export interface RoleTransitionDto {
  id: UUID;
  code: string | null;
}

export interface TransitionAchatDto {
  id: UUID;
  ordre: number | null;
  description: string | null;
  /** null = sans gestion. */
  gestionCode: string | null;
  /** « Sans gestion » si aucune. */
  gestionLibelle: string;
  statutDepartId: UUID | null;
  statutDepartCode: string | null;
  statutArriveeId: UUID | null;
  statutArriveeCode: string | null;
  noteObligatoire: boolean;
  valideeParDeclencheur: boolean;
  /** Triés par code ; vide si aucun rôle. */
  roles: RoleTransitionDto[];
  nombrePassages: number;
  /** ISO yyyy-MM-dd, null si jamais empruntée. */
  dernierPassage: string | null;
}
