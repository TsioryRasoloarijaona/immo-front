// Planification Gantt (FEATURE-n9-planification.md N9b). Lectures : périmètre projet seul ; écritures : droit
// `Yes.Cfg.Front.Gantt.GanttProject` (version : `Yes.Prj.Front.Tdb.ProjectPrevision.toolSaveVersion`) ; une version → 409.
import { request } from './api';
import type { UUID } from '../types';
import type {
  IntervenantPlanificationDto,
  PlanificationDetailDto,
  PlanificationEcritureDto,
  PlanificationListItemDto,
  TacheEcritureDto,
  TachePlanificationDto,
  VersionSauvegardeeDto,
} from '../types/planification';

const BASE = '/api/projet/planification';
const MODELES = `${BASE}/modeles`;

export function listModelesPlanification(): Promise<PlanificationListItemDto[]> {
  return request('GET', MODELES);
}

export function creerModelePlanification(corps: PlanificationEcritureDto): Promise<PlanificationDetailDto> {
  return request('POST', MODELES, { body: corps });
}

export function modifierModelePlanification(id: UUID, corps: PlanificationEcritureDto): Promise<PlanificationDetailDto> {
  return request('PATCH', `${MODELES}/${id}`, { body: corps });
}

/** Supprime aussi ses tâches et intervenants. */
export function supprimerModelePlanification(id: UUID): Promise<void> {
  return request('DELETE', `${MODELES}/${id}`);
}

export function getPlanification(id: UUID): Promise<PlanificationDetailDto> {
  return request('GET', `${BASE}/${id}`);
}

export function listVersionsPlanification(id: UUID): Promise<PlanificationListItemDto[]> {
  return request('GET', `${BASE}/${id}/versions`);
}

/** Planification d'un projet seulement (409 sur un modèle ou une version). */
export function sauvegarderVersionPlanification(id: UUID): Promise<VersionSauvegardeeDto> {
  return request('POST', `${BASE}/${id}/versions`);
}

export function modifierDateDebutPlanification(id: UUID, dateDebut: string): Promise<PlanificationDetailDto> {
  return request('PATCH', `${BASE}/${id}/date-debut`, { body: { dateDebut } });
}

export function creerTachePlanification(id: UUID, corps: TacheEcritureDto): Promise<PlanificationDetailDto> {
  return request('POST', `${BASE}/${id}/taches`, { body: corps });
}

export function modifierTachePlanification(id: UUID, tacheId: UUID, corps: TacheEcritureDto): Promise<PlanificationDetailDto> {
  return request('PATCH', `${BASE}/${id}/taches/${tacheId}`, { body: corps });
}

/** Supprime aussi les descendants. */
export function supprimerTachePlanification(id: UUID, tacheId: UUID): Promise<PlanificationDetailDto> {
  return request('DELETE', `${BASE}/${id}/taches/${tacheId}`);
}

/** Toutes les sœurs d'un même parent, dans le nouvel ordre. */
export function ordonnerTachesPlanification(id: UUID, tacheIds: UUID[]): Promise<PlanificationDetailDto> {
  return request('PUT', `${BASE}/${id}/taches/ordre`, { body: { tacheIds } });
}

export function creerIntervenantPlanification(id: UUID, corps: IntervenantPlanificationDto): Promise<PlanificationDetailDto> {
  return request('POST', `${BASE}/${id}/intervenants`, { body: corps });
}

export function modifierIntervenantPlanification(
  id: UUID,
  intervenantId: UUID,
  corps: IntervenantPlanificationDto,
): Promise<PlanificationDetailDto> {
  return request('PATCH', `${BASE}/${id}/intervenants/${intervenantId}`, { body: corps });
}

export function supprimerIntervenantPlanification(id: UUID, intervenantId: UUID): Promise<PlanificationDetailDto> {
  return request('DELETE', `${BASE}/${id}/intervenants/${intervenantId}`);
}

/** 404 `code: PLANIFICATION_ABSENTE` si le projet n'en a pas encore. */
export function getPlanificationProjet(projetId: UUID): Promise<PlanificationDetailDto> {
  return request('GET', `/api/projet/projets/${projetId}/planification`);
}

/** Copie d'un modèle ; 409 si le projet a déjà une planification. */
export function clonerPlanificationProjet(projetId: UUID, modeleId: UUID): Promise<PlanificationDetailDto> {
  return request('POST', `/api/projet/projets/${projetId}/planification`, { body: { modeleId } });
}

export function listTachesLot(lotId: UUID): Promise<TachePlanificationDto[]> {
  return request('GET', `/api/projet/lots/${lotId}/taches`);
}
