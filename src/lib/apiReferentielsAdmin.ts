// Endpoints de FEATURE-patrimoine-referentiels.md : un jeu de routes pour les 19 référentiels, piloté par le slug.
import { request } from './api';
import type { ReferentielItemDto, UUID } from '../types';
import type { DescripteurReferentielDto, FiltresReferentiel, LigneReferentiel } from '../types/referentielsAdmin';

const RACINE = '/api/referentiels-admin';

export function listDescripteursReferentiels(): Promise<DescripteurReferentielDto[]> {
  return request('GET', RACINE);
}

/** Route `choix` d'un champ REFERENCE (route existante ou `/api/referentiels-admin/choix/{liste}`). */
export function listChoixReferentiel(route: string): Promise<ReferentielItemDto[]> {
  return request('GET', route);
}

/** 404 si le slug est inconnu ou si `trancheId` n'est pas une tranche visible. */
export function listLignesReferentiel(slug: string, filtres: FiltresReferentiel = {}): Promise<LigneReferentiel[]> {
  return request('GET', `${RACINE}/${slug}`, { query: { ...filtres } });
}

export function getLigneReferentiel(slug: string, id: UUID): Promise<LigneReferentiel> {
  return request('GET', `${RACINE}/${slug}/${id}`);
}

/** Administrateur ; 400 champ invalide, 404 tranche non visible, 409 doublon. */
export function creerLigneReferentiel(slug: string, body: LigneReferentiel): Promise<LigneReferentiel> {
  return request('POST', `${RACINE}/${slug}`, { body });
}

/** Administrateur ; champs absents inchangés, `null` vide un facultatif ; 409 doublon ou recodage protégé. */
export function modifierLigneReferentiel(slug: string, id: UUID, body: LigneReferentiel): Promise<LigneReferentiel> {
  return request('PATCH', `${RACINE}/${slug}/${id}`, { body });
}

/** Administrateur ; 409 si la ligne est protégée, référencée ou porteuse de lignes en cascade. */
export function supprimerLigneReferentiel(slug: string, id: UUID): Promise<void> {
  return request('DELETE', `${RACINE}/${slug}/${id}`);
}
