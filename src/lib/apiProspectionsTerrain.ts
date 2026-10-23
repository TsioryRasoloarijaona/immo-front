// Endpoints de FEATURE-patrimoine-prospections-terrain.md : prospections terrain, zones, aperçu, transitions, transformation.
import { request, withPageable } from './api';
import type { PageDto, Pageable, UUID } from '../types';
import type {
  SurfacesTerrain,
  ApercuCalculDto,
  ExecutionTransitionDto,
  FiltresProspectionsTerrain,
  HistoriqueStatutProspectionDto,
  ProspectionTerrainDetailDto,
  ProspectionTerrainEcritureDto,
  ProspectionTerrainListeDto,
  TerrainCreeDto,
  TransformationTerrainDto,
  TransitionProspectionTerrainDto,
  ZoneTerrainDto,
  ZoneTerrainEcritureDto,
} from '../types/prospectionsTerrain';

const RACINE = '/api/prospections-terrain';

export function listProspectionsTerrain(
  filtres?: FiltresProspectionsTerrain,
  pageable?: Pageable,
): Promise<PageDto<ProspectionTerrainListeDto>> {
  return request('GET', RACINE, { query: withPageable(filtres, pageable) });
}

export function getProspectionTerrain(id: UUID): Promise<ProspectionTerrainDetailDto> {
  return request('GET', `${RACINE}/${id}`);
}

/** Administrateur. 409 code déjà pris ; 500 configuration LndLand absente. */
export function createProspectionTerrain(saisie: ProspectionTerrainEcritureDto): Promise<ProspectionTerrainDetailDto> {
  return request('POST', RACINE, { body: saisie });
}

/** Administrateur. 409 code pris ou statut en lecture seule. */
export function updateProspectionTerrain(
  id: UUID,
  saisie: ProspectionTerrainEcritureDto,
): Promise<ProspectionTerrainDetailDto> {
  return request('PATCH', `${RACINE}/${id}`, { body: saisie });
}

/** Administrateur. 409 statut sans suppression, terrain ou étude liés. */
export function deleteProspectionTerrain(id: UUID): Promise<void> {
  return request('DELETE', `${RACINE}/${id}`);
}

/** Administrateur. Grille complète ; total > superficie nette → 400. */
export function saveZonesProspectionTerrain(id: UUID, lignes: ZoneTerrainEcritureDto[]): Promise<ZoneTerrainDto[]> {
  return request('PUT', `${RACINE}/${id}/zones`, { body: { lignes } });
}

/** Recalcul sans écriture (à appeler avec debounce). */
export function apercuCalculProspectionTerrain(saisie: ApercuCalculDto): Promise<SurfacesTerrain> {
  return request('POST', `${RACINE}/apercu-calcul`, { body: saisie });
}

export function getTransitionsProspectionTerrain(id: UUID): Promise<TransitionProspectionTerrainDto[]> {
  return request('GET', `${RACINE}/${id}/transitions`);
}

/** Administrateur. 409 (`transitionsAutorisees`) hors graphe ; 400 commentaire obligatoire. */
export function executerTransitionProspectionTerrain(
  id: UUID,
  saisie: ExecutionTransitionDto,
): Promise<ProspectionTerrainDetailDto> {
  return request('POST', `${RACINE}/${id}/transition`, { body: saisie });
}

export function getHistoriqueProspectionTerrain(id: UUID): Promise<HistoriqueStatutProspectionDto[]> {
  return request('GET', `${RACINE}/${id}/historique`);
}

/** Administrateur. 409 déjà transformée (`terrainId` dans le ProblemDetail) ou statut non transformable. */
export function transformerProspectionEnTerrain(id: UUID, saisie: TransformationTerrainDto): Promise<TerrainCreeDto> {
  return request('POST', `${RACINE}/${id}/transformer-en-terrain`, { body: saisie });
}
