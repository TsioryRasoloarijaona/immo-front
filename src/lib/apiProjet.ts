// Endpoints de FEATURE-projet-lots-decomptes.md §2.1 : lots et décomptes (lecture). Hors périmètre = 404 comme un id inconnu.
import { request, withPageable } from './api';
import type { PageDto, Pageable, UUID } from '../types';
import type {
  BordereauDto,
  DecompteDetailDto,
  DecompteListItemDto,
  EnregistrerDecompteRequest,
  FiltresDecomptes,
  FiltresLots,
  LigneDecompteRechargee,
  LotDetailDto,
  LotListItemDto,
  ReferentielsProjetDto,
  TotauxDecomptesDto,
} from '../types/projet';

const RACINE = '/api/projet';
const LOTS = `${RACINE}/lots`;
const DECOMPTES = `${RACINE}/decomptes`;

export function getReferentielsProjet(): Promise<ReferentielsProjetDto> {
  return request('GET', `${RACINE}/referentiels`);
}

export function listLots(filtres: FiltresLots = {}, pageable?: Pageable): Promise<PageDto<LotListItemDto>> {
  return request('GET', LOTS, { query: withPageable({ ...filtres }, pageable) });
}

export function getLot(id: UUID): Promise<LotDetailDto> {
  return request('GET', `${LOTS}/${id}`);
}

export function getBordereauLot(id: UUID): Promise<BordereauDto> {
  return request('GET', `${LOTS}/${id}/bordereau`);
}

export function getDecomptesLot(id: UUID): Promise<DecompteListItemDto[]> {
  return request('GET', `${LOTS}/${id}/decomptes`);
}

export function listDecomptes(filtres: FiltresDecomptes = {}, pageable?: Pageable): Promise<PageDto<DecompteListItemDto>> {
  return request('GET', DECOMPTES, { query: withPageable({ ...filtres }, pageable) });
}

export function getDecompte(id: UUID): Promise<DecompteDetailDto> {
  return request('GET', `${DECOMPTES}/${id}`);
}

// FEATURE-decomptes-parite.md : totaux, export, écritures (403 droit OMRAN manquant, 409 verrouillé).
export function getTotauxDecomptes(filtres: FiltresDecomptes = {}): Promise<TotauxDecomptesDto> {
  return request('GET', `${DECOMPTES}/totaux`, { query: { ...filtres } });
}

/** Chemin de l'export xlsx, pour `useExportListe` (mêmes filtres + `sort`). */
export const EXPORT_DECOMPTES = `${DECOMPTES}/export`;

export function creerDecompte(lotId: UUID, dateDocument: string): Promise<DecompteDetailDto> {
  return request('POST', `${LOTS}/${lotId}/decomptes`, { body: { dateDocument } });
}

export function enregistrerDecompte(id: UUID, demande: EnregistrerDecompteRequest): Promise<DecompteDetailDto> {
  return request('PUT', `${DECOMPTES}/${id}`, { body: demande });
}

export function definirDernierDecompte(id: UUID): Promise<DecompteDetailDto> {
  return request('POST', `${DECOMPTES}/${id}/dernier`);
}

export function recalculerDecompte(id: UUID): Promise<DecompteDetailDto> {
  return request('POST', `${DECOMPTES}/${id}/recalcul`);
}

export function supprimerDecompte(id: UUID): Promise<void> {
  return request('DELETE', `${DECOMPTES}/${id}`);
}

/** Aperçu sans écriture : à renvoyer tel quel dans `lignes` du PUT pour l'appliquer. */
export function getLignesRechargeesDecompte(id: UUID, date?: string): Promise<LigneDecompteRechargee[]> {
  return request('GET', `${DECOMPTES}/${id}/lignes-rechargees`, { query: { date } });
}
