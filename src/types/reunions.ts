// Réunions de chantier (FEATURE-n1-reunions-chantier.md), noms du fil de /api/projet/reunions.
import type { ReferentielItemDto, UUID } from '../types';

export interface FiltresReunions {
  societeId?: UUID;
  projetIds?: UUID[];
  du?: string;
  au?: string;
  typeId?: UUID;
  recherche?: string;
}

export interface ReunionLigneDto {
  id: UUID;
  projet: string | null;
  type: string | null;
  reference: string | null;
  date: string | null;
  prochaineDate: string | null;
  surveillant: string | null;
  note: string | null;
  ordre: number | null;
}

export interface ContactReunionDto {
  id: UUID;
  ordre: number | null;
  contactId: UUID | null;
  contact: string | null;
  present: boolean;
  aNotifier: boolean;
}

export interface IntervenantDto {
  id: UUID;
  ordre: number | null;
  effectif: number | null;
  lotId: UUID | null;
  lot: string | null;
  fournisseurId: UUID | null;
  fournisseur: string | null;
  note: string | null;
  contacts: ContactReunionDto[];
}

export interface ObservationDto {
  id: UUID;
  libelle: string | null;
  couleur: string | null;
  ferme: boolean;
}

export interface DecisionDto {
  id: UUID;
  ordre: number | null;
  lotId: UUID | null;
  lot: string | null;
  fournisseurId: UUID | null;
  fournisseur: string | null;
  description: string | null;
  observation: ObservationDto | null;
  objectif: string | null;
  note: string | null;
  nousMemes: boolean;
  /** Calculé : statut de réserve fermé, lecture seule. */
  fermee: boolean;
}

export interface ValeurAvancementReunion {
  critereId: UUID;
  niveauId: UUID;
  /** 0 à 100. */
  pourcentage: number;
}

export interface AvancementsDto {
  criteres: ReferentielItemDto[];
  niveaux: ReferentielItemDto[];
  valeurs: ValeurAvancementReunion[];
}

export interface ReunionFicheDto {
  id: UUID;
  ordre: number | null;
  reference: string | null;
  projetId: UUID;
  projet: string | null;
  typeId: UUID;
  type: string | null;
  date: string | null;
  prochaineDate: string | null;
  surveillantId: UUID | null;
  surveillant: string | null;
  note: string | null;
  maitresOuvrage: ContactReunionDto[];
  intervenants: IntervenantDto[];
  decisions: DecisionDto[];
  avancements: AvancementsDto;
}

export interface ChoixReunionsDto {
  types: ReferentielItemDto[];
  statuts: ObservationDto[];
  lots: ReferentielItemDto[];
}

export interface ReunionModificationDto {
  /** Vide = générée « yy/nnnnn ». */
  reference?: string | null;
  date: string;
  prochaineDate?: string | null;
  surveillantId?: UUID | null;
  note?: string | null;
}

export interface ReunionCreationDto extends ReunionModificationDto {
  projetId: UUID;
  typeId: UUID;
}

export interface ContactSaisieDto {
  contactId?: UUID | null;
  present?: boolean;
  aNotifier?: boolean;
}

export interface IntervenantSaisieDto {
  ordre?: number | null;
  lotId?: UUID | null;
  fournisseurId?: UUID | null;
  effectif?: number | null;
  note?: string | null;
}

export interface DecisionSaisieDto {
  ordre?: number | null;
  lotId?: UUID | null;
  fournisseurId?: UUID | null;
  description: string;
  observationId: UUID;
  objectif?: string | null;
  note?: string | null;
  nousMemes?: boolean;
}

export interface AvancementSaisieDto {
  critereId: UUID;
  niveauId: UUID;
  pourcentage: number | null;
}
