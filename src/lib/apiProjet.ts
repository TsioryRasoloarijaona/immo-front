// Endpoints de FEATURE-projet-lots-decomptes.md §2.1 : lots et décomptes (lecture). Hors périmètre = 404 comme un id inconnu.
import { request, withPageable } from './api';
import type { PageDto, Pageable, UUID } from '../types';
import type {
  BordereauDto,
  DecompteDetailDto,
  DecompteListItemDto,
  FiltresDecomptes,
  FiltresLots,
  LotDetailDto,
  LotListItemDto,
  ReferentielsProjetDto,
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
