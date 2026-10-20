// Endpoints de FEATURE-patrimoine-terrains.md : terrains, frais, validation pour règlement, lotissements.
import { request, withPageable } from './api';
import type { LignesTrancheDto, PageDto, Pageable, UUID } from '../types';
import type {
  FactureFraisTerrainDto,
  FiltresTerrains,
  LigneFraisTerrainDto,
  TerrainDetailDto,
  TerrainEcritureDto,
  TerrainListeDto,
} from '../types/terrains';

/** `terrains` : tous les terrains (lotissements compris) ; `lotissements` : terrains de tranche, vocation ≠ PROJET. */
export function listTerrains(
  liste: 'terrains' | 'lotissements',
  filtres?: FiltresTerrains,
  pageable?: Pageable,
): Promise<PageDto<TerrainListeDto>> {
  return request('GET', `/api/${liste}`, { query: withPageable(filtres, pageable) });
}

export function getTerrain(id: UUID): Promise<TerrainDetailDto> {
  return request('GET', `/api/terrains/${id}`);
}

/** Administrateur. 409 code déjà pris dans la société ; 500 sans statut LandProject. */
export function createTerrain(saisie: TerrainEcritureDto): Promise<TerrainDetailDto> {
  return request('POST', '/api/terrains', { body: saisie });
}

/** Administrateur. 409 champ protégé d'un terrain occupé. */
export function updateTerrain(id: UUID, saisie: TerrainEcritureDto): Promise<TerrainDetailDto> {
  return request('PATCH', `/api/terrains/${id}`, { body: saisie });
}

/** Administrateur. 409 frais validé ou facturé, terrain occupé ou référencé. */
export function deleteTerrain(id: UUID): Promise<void> {
  return request('DELETE', `/api/terrains/${id}`);
}

/** Administrateur. 409 si le statut du parent n'autorise pas les sous-terrains. */
export function createSousTerrain(parentId: UUID, saisie: TerrainEcritureDto): Promise<TerrainDetailDto> {
  return request('POST', `/api/terrains/${parentId}/sous-terrains`, { body: saisie });
}

export function getFraisTerrain(id: UUID): Promise<LignesTrancheDto<LigneFraisTerrainDto>> {
  return request('GET', `/api/terrains/${id}/frais`);
}

/** Administrateur. Liste complète ; un frais validé modifié ou retiré → 409. */
export function saveFraisTerrain(
  id: UUID,
  corps: LignesTrancheDto<LigneFraisTerrainDto>,
): Promise<LignesTrancheDto<LigneFraisTerrainDto>> {
  return request('PUT', `/api/terrains/${id}/frais`, { body: corps });
}

/** Administrateur. « Valider pour règlement » : 409 déjà validé ou facturé, 400 fournisseur / type incomplet. */
export function validerFraisTerrain(id: UUID, fraisId: UUID): Promise<FactureFraisTerrainDto> {
  return request('POST', `/api/terrains/${id}/frais/${fraisId}/valider`);
}
