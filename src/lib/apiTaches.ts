// Endpoints de FEATURE-admin-taches.md, Administrateur seul (403 sinon).
// Projets : /api/referentiels-patrimoine/projets-facturation ; tiers : /api/referentiels-patrimoine/personnels.
import { request } from './api';
import type { PageDto, ReferentielItemDto, UUID } from '../types';
import type {
  ChangerStatutTacheRequest,
  FiltresTaches,
  StatutTacheDto,
  TacheDto,
  TacheEcritureDto,
} from '../types/taches';

const RACINE = '/api/administration/taches';

export function listTaches(filtres: FiltresTaches & { page?: number; size?: number }): Promise<PageDto<TacheDto>> {
  return request('GET', RACINE, { query: { ...filtres } });
}

export function listStatutsTaches(): Promise<StatutTacheDto[]> {
  return request('GET', `${RACINE}/statuts`);
}

export function listModulesTaches(): Promise<ReferentielItemDto[]> {
  return request('GET', `${RACINE}/modules`);
}

/** 404 si la tâche est inconnue ou si c'est un rendez-vous. */
export function getTache(id: UUID): Promise<TacheDto> {
  return request('GET', `${RACINE}/${id}`);
}

/** 400 description manquante ou référence inconnue. */
export function creerTache(body: TacheEcritureDto): Promise<TacheDto> {
  return request('POST', RACINE, { body });
}

/** Champ absent ou null = inchangé ; 400 référence inconnue, 404 tâche inconnue. */
export function modifierTache(id: UUID, body: TacheEcritureDto): Promise<TacheDto> {
  return request('PATCH', `${RACINE}/${id}`, { body });
}

export function supprimerTache(id: UUID): Promise<void> {
  return request('DELETE', `${RACINE}/${id}`);
}

/** 400 commentaire exigé manquant ; 409 transition non permise, `transitionsAutorisees` = codes des statuts permis. */
export function changerStatutTache(id: UUID, body: ChangerStatutTacheRequest): Promise<TacheDto> {
  return request('POST', `${RACINE}/${id}/statut`, { body });
}
