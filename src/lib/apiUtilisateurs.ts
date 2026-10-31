// Endpoints de FEATURE-admin-utilisateurs.md, Administrateur seul (403 sinon).
import { request } from './api';
import type { UUID } from '../types';
import type {
  CibleHabilitationDto,
  NoeudHabilitationDto,
  UtilisateurEcritureDto,
  UtilisateurFicheDto,
  UtilisateurReferencesDto,
} from '../types/utilisateurs';

const RACINE = '/api/utilisateurs';
/** Pour `useExportListe`. */
export const EXPORT_UTILISATEURS = `${RACINE}/export`;

export function getUtilisateursReferences(): Promise<UtilisateurReferencesDto> {
  return request('GET', `${RACINE}/references`);
}

export function getUtilisateur(id: UUID): Promise<UtilisateurFicheDto> {
  return request('GET', `${RACINE}/${id}`);
}

/** 400 champ ou référence invalide, 409 code déjà pris. */
export function creerUtilisateur(body: UtilisateurEcritureDto): Promise<UtilisateurFicheDto> {
  return request('POST', RACINE, { body });
}

/** 409 soi-même ou dernier Administrateur actif : message à afficher tel quel. */
export function modifierUtilisateur(id: UUID, body: UtilisateurEcritureDto): Promise<UtilisateurFicheDto> {
  return request('PATCH', `${RACINE}/${id}`, { body });
}

/** État final. 409 soi-même ou dernier Administrateur actif. */
export function remplacerRolesUtilisateur(id: UUID, body: { roleIds: UUID[] }): Promise<UtilisateurFicheDto> {
  return request('PUT', `${RACINE}/${id}/roles`, { body });
}

export function remplacerComptesDepot(id: UUID, body: { compteIds: UUID[] }): Promise<UtilisateurFicheDto> {
  return request('PUT', `${RACINE}/${id}/comptes-depot`, { body });
}

export function getHabilitations(id: UUID): Promise<NoeudHabilitationDto[]> {
  return request('GET', `${RACINE}/${id}/habilitations`);
}

/** Nœuds cochés ; un nœud figé est ignoré, envoyé ou non. */
export function remplacerHabilitations(
  id: UUID,
  body: { noeuds: CibleHabilitationDto[] },
): Promise<NoeudHabilitationDto[]> {
  return request('PUT', `${RACINE}/${id}/habilitations`, { body });
}
