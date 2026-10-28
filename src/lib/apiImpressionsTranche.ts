// Relance 2 par statut d'une tranche (Administrateur, Direction Générale) : 400 statut hors liste, 404 tranche invisible.
import { API_BASE_URL, fetchByteEndpointBlob, request } from './api';
import type { UUID } from '../types';
import type { ApercuRelance2Dto } from '../types/impressionsTranche';

/** Les 5 codes de la Relance 2 (modèle OMRAN), seuls admis dans `statut`. */
export const STATUTS_RELANCE_2 = [
  'CONCRETISATION',
  'MEILLEURTAUX',
  'ENVOI AU NOTAIRE',
  'CREDIT EN COURS',
  'CREDIT ACCORDE',
] as const;

function chemin(trancheId: UUID, suffixe: string, statuts?: readonly string[]): string {
  const params = new URLSearchParams();
  statuts?.forEach((s) => { params.append('statut', s); });
  const query = params.size > 0 ? '?' + params.toString() : '';
  return `/api/tranches/${encodeURIComponent(trancheId)}/relances-2${suffixe}${query}`;
}

/** Statuts absents = les 5. */
export function getApercuRelance2(trancheId: UUID, statuts?: readonly string[]): Promise<ApercuRelance2Dto> {
  return request<ApercuRelance2Dto>('GET', chemin(trancheId, '/apercu', statuts));
}

/** Une page par lettre ; 409 si aucune lettre (aucun dossier à relancer, ou tous au reste ≤ 0). */
export function lettresRelance2(trancheId: UUID, statuts?: readonly string[]): Promise<Blob> {
  return fetchByteEndpointBlob(`${API_BASE_URL}${chemin(trancheId, '.pdf', statuts)}`, 'application/pdf');
}
