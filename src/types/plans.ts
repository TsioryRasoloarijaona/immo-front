// DTO de FEATURE-patrimoine-plans.md (PlansController), noms du fil.
import type { UUID } from '../types';

export interface TrancheAvecPlansDto {
  trancheId: UUID;
  code: string | null;
  description: string | null;
  projetCode: string | null;
  nombrePlans: number;
}

/** Méta d'un plan, sans l'image (lue par `getImagePlan`). */
export interface PlanDto {
  id: UUID;
  etageId: UUID | null;
  etageCode: string | null;
  code: string | null;
  largeur: number | null;
  hauteur: number | null;
  x: number | null;
  y: number | null;
  nombreTraces: number;
}

export interface PlanArticleDto {
  planId: UUID;
  trancheId: UUID;
  etageId: UUID | null;
  etageCode: string | null;
  largeur: number | null;
  hauteur: number | null;
  x: number | null;
  y: number | null;
}

/** `couleur` = nom de couleur CSS brut (StrStatus.ColorName) ; null → couleur neutre du front. */
export interface TraceDto {
  articleId: UUID;
  code: string | null;
  d: string | null;
  statutCode: string | null;
  statutLibelle: string | null;
  couleur: string | null;
  dossierId: UUID | null;
  client: string | null;
  estSousArticle: boolean;
  libre: boolean;
}

export type ResultatTrace = 'AJOUTE' | 'MODIFIE' | 'INCHANGE' | 'INTROUVABLE';

export interface LigneBilanTraceDto {
  code: string | null;
  articleId: UUID | null;
  resultat: ResultatTrace;
  message: string;
}

export interface BilanImportPlanDto {
  apercu: boolean;
  planId: UUID | null;
  planCree: boolean;
  lignes: LigneBilanTraceDto[];
}
