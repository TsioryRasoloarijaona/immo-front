// Endpoints de FEATURE-patrimoine-plans.md : plans d'étage des tranches. 404 = hors périmètre ou entité inactive.
import { API_BASE_URL, fetchByteEndpointBlob, postMultipart, request } from './api';
import type { UUID } from '../types';
import type { BilanImportPlanDto, PlanArticleDto, PlanDto, TraceDto, TrancheAvecPlansDto } from '../types/plans';

export function listTranchesAvecPlans(): Promise<TrancheAvecPlansDto[]> {
  return request('GET', '/api/plans/tranches');
}

export function listPlansTranche(trancheId: UUID): Promise<PlanDto[]> {
  return request('GET', `/api/tranches/${trancheId}/plans`);
}

/** `fetch` + cookie : le cache HTTP du navigateur revalide par ETag (304). Libérer l'URL par `URL.revokeObjectURL`. */
export async function getImagePlan(planId: UUID): Promise<string> {
  const blob = await fetchByteEndpointBlob(`${API_BASE_URL}/api/plans/${planId}/image`, 'image/png');
  return URL.createObjectURL(blob);
}

export function listTracesPlan(planId: UUID): Promise<TraceDto[]> {
  return request('GET', `/api/plans/${planId}/traces`);
}

export function listPlansArticle(articleId: UUID): Promise<PlanArticleDto[]> {
  return request('GET', `/api/articles/${articleId}/plans`);
}

/** Administrateur ; `apercu` = bilan sans écriture. 400 : message OMRAN dans `ApiError.message` ; 413 > 50 Mo. */
export function importerPlanSvg(trancheId: UUID, etageId: UUID, fichier: File, apercu: boolean): Promise<BilanImportPlanDto> {
  return postMultipart<BilanImportPlanDto>(`/api/tranches/${trancheId}/plans/import`, fichier, { etageId, apercu });
}

/** Administrateur ; supprime tracés puis plans de la tranche. */
export function purgerPlansTranche(trancheId: UUID): Promise<void> {
  return request('DELETE', `/api/tranches/${trancheId}/plans`);
}
