import { request } from './api';
import type {
  ActionnaireDto,
  ActionnaireEcritureDto,
  EntiteJuridiqueDto,
  EntiteJuridiqueEcritureDto,
  GroupeActionnairesDto,
  GroupeActionnairesEcritureDto,
  LigneRepartitionDto,
  ReferentielItemDto,
  UUID,
} from '../types';

// Entités juridiques, actionnaires, groupes (FEATURE-entites-juridiques.md) : lecture tout compte, écriture
// Administrateur (403), 400/409 ProblemDetail (`ApiError.message` = `detail`).

/** `actif` absent = toutes ; `search` ignore espaces et casse (code, libellé, matricule fiscal, RC). */
export function listEntitesJuridiques(actif?: 'true' | 'false' | 'tous', search?: string): Promise<EntiteJuridiqueDto[]> {
  return request('GET', '/api/entites-juridiques', { query: { actif, search } });
}

/** Active ou non : l'écran gère le drapeau. */
export function getEntiteJuridique(id: UUID): Promise<EntiteJuridiqueDto> {
  return request('GET', `/api/entites-juridiques/${id}`);
}

export function listDevises(): Promise<ReferentielItemDto[]> {
  return request('GET', '/api/entites-juridiques/devises');
}

/** `deviseId` absent = MAD. 409 code pris. */
export function createEntiteJuridique(body: EntiteJuridiqueEcritureDto): Promise<EntiteJuridiqueDto> {
  return request('POST', '/api/entites-juridiques', { body });
}

/** Changer `isActive` masque ou rend tout le contenu de l'entité : invalider le cache des sélecteurs d'entité. */
export function updateEntiteJuridique(id: UUID, body: EntiteJuridiqueEcritureDto): Promise<EntiteJuridiqueDto> {
  return request('PATCH', `/api/entites-juridiques/${id}`, { body });
}

/** 409 si un programme ou une autre table la référence (le message dit quoi). */
export function deleteEntiteJuridique(id: UUID): Promise<void> {
  return request('DELETE', `/api/entites-juridiques/${id}`);
}

/** 400 : doublon « L'actionnaire existe déjà dans la liste !!! » ou Verif OMRAN (nombre de lignes / total des parts). */
export function remplacerRepartition(id: UUID, lignes: LigneRepartitionDto[]): Promise<LigneRepartitionDto[]> {
  return request('PUT', `/api/entites-juridiques/${id}/repartition`, { body: lignes });
}

/** Calcul `SetRepartitions` sans écriture ; `nombreParts` = celui saisi sur la fiche (absent = enregistré). */
export function repartitionDepuisGroupe(id: UUID, groupeId: UUID, nombreParts?: number): Promise<LigneRepartitionDto[]> {
  return request('POST', `/api/entites-juridiques/${id}/repartition/depuis-groupe/${groupeId}`,
    { query: { nombreParts }, lecture: true });
}

export function listActionnaires(): Promise<ActionnaireDto[]> {
  return request('GET', '/api/actionnaires');
}

export function getActionnaire(id: UUID): Promise<ActionnaireDto> {
  return request('GET', `/api/actionnaires/${id}`);
}

export function createActionnaire(body: ActionnaireEcritureDto): Promise<ActionnaireDto> {
  return request('POST', '/api/actionnaires', { body });
}

export function updateActionnaire(id: UUID, body: ActionnaireEcritureDto): Promise<ActionnaireDto> {
  return request('PATCH', `/api/actionnaires/${id}`, { body });
}

/** 409 si l'actionnaire figure dans une répartition ou un groupe. */
export function deleteActionnaire(id: UUID): Promise<void> {
  return request('DELETE', `/api/actionnaires/${id}`);
}

export function listGroupesActionnaires(): Promise<GroupeActionnairesDto[]> {
  return request('GET', '/api/groupes-actionnaires');
}

export function getGroupeActionnaires(id: UUID): Promise<GroupeActionnairesDto> {
  return request('GET', `/api/groupes-actionnaires/${id}`);
}

/** 400 « La somme des pourcentages doit être égale à 100 % ! » ou doublon. */
export function createGroupeActionnaires(body: GroupeActionnairesEcritureDto): Promise<GroupeActionnairesDto> {
  return request('POST', '/api/groupes-actionnaires', { body });
}

export function updateGroupeActionnaires(id: UUID, body: GroupeActionnairesEcritureDto): Promise<GroupeActionnairesDto> {
  return request('PATCH', `/api/groupes-actionnaires/${id}`, { body });
}

/** 409 si une entité a choisi ce groupe (la base supprimerait l'entité avec). */
export function deleteGroupeActionnaires(id: UUID): Promise<void> {
  return request('DELETE', `/api/groupes-actionnaires/${id}`);
}
