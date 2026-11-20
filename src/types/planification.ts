// Planification Gantt : modèles, planification d'un projet, versions (FEATURE-n9-planification.md N9b).
import type { UUID } from '../types';

export type NaturePlanification = 'MODELE' | 'PROJET' | 'VERSION';

/** Infragistics TaskDependencyType : FIN_DEBUT 0, DEBUT_DEBUT 1, FIN_FIN 2, DEBUT_FIN 3. */
export type TypeDependance = 'FIN_DEBUT' | 'DEBUT_DEBUT' | 'FIN_FIN' | 'DEBUT_FIN';

/** Infragistics TaskConstraint ; défaut AU_PLUS_TOT. */
export type ContrainteTache =
  | 'AU_PLUS_TARD'
  | 'AU_PLUS_TOT'
  | 'FIN_PAS_AVANT'
  | 'FIN_PAS_APRES'
  | 'DOIT_FINIR_LE'
  | 'DOIT_COMMENCER_LE'
  | 'DEBUT_PAS_AVANT'
  | 'DEBUT_PAS_APRES';

export interface PlanificationListItemDto {
  id: UUID;
  code: string;
  description: string | null;
  notes: string | null;
  dateDebut: string | null;
  dateVersion: string | null;
}

export interface PredecesseurDto {
  tacheId: UUID;
  type?: TypeDependance | null;
}

export interface TachePlanificationDto {
  id: UUID;
  parentId: UUID | null;
  code: string;
  description: string | null;
  notes: string | null;
  rang: number | null;
  profondeur: number | null;
  dateDebut: string | null;
  duree: number | null;
  dateFin: string | null;
  avancement: number | null;
  alerteAvantJours: number | null;
  contrainte: ContrainteTache;
  dateContrainte: string | null;
  echeance: string | null;
  jalon: boolean | null;
  predecesseurs: PredecesseurDto[];
  intervenants: UUID[];
  typeTacheId: UUID | null;
  lotId: UUID | null;
  categorieId: UUID | null;
}

export interface IntervenantPlanificationDto {
  id?: UUID | null;
  code?: string | null;
  description?: string | null;
  notes?: string | null;
  visible?: boolean | null;
  tiersId?: UUID | null;
}

export interface PlanificationDetailDto {
  id: UUID;
  code: string;
  description: string | null;
  notes: string | null;
  dateDebut: string | null;
  dateVersion: string | null;
  nature: NaturePlanification;
  projetId: UUID | null;
  principaleId: UUID | null;
  taches: TachePlanificationDto[];
  intervenants: IntervenantPlanificationDto[];
  versions: PlanificationListItemDto[];
}

/** Champ absent = inchangé (PATCH) ; code et description obligatoires à la création. */
export interface PlanificationEcritureDto {
  code?: string;
  description?: string;
  notes?: string;
  dateDebut?: string;
}

/** Champ absent = inchangé, ou valeur par défaut à la création. */
export interface TacheEcritureDto {
  parentId?: UUID;
  racine?: boolean;
  code?: string;
  description?: string;
  notes?: string;
  dateDebut?: string;
  duree?: number;
  avancement?: number;
  alerteAvantJours?: number;
  contrainte?: ContrainteTache;
  dateContrainte?: string;
  echeance?: string;
  jalon?: boolean;
  predecesseurs?: PredecesseurDto[];
  intervenants?: UUID[];
  typeTacheId?: UUID;
}

export interface VersionSauvegardeeDto {
  version: PlanificationListItemDto;
  message: string;
}
