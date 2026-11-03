// Endpoints de FEATURE-admin-email-historique.md : Administrateur seulement, lecture seule.
import { request } from './api';
import type { PageDto, ReferentielItemDto, UUID } from '../types';
import type {
  EcritureTiersRequest,
  EmailDetailDto,
  FamilleTiers,
  FicheTiersDto,
  FiltresActions,
  FiltresEmail,
  FiltresFichesVerrouillees,
  FiltresSessions,
  FiltresTiers,
  LienTiersDto,
  LienTiersRequest,
  LigneActionDto,
  LigneEmailDto,
  LigneFicheVerrouilleeDto,
  LigneSessionDto,
  LigneTiersDto,
  ListeReferentielTiers,
  NatureTiersDto,
  ResultatDeverrouillageDto,
} from '../types/administration';

const RACINE = '/api/administration/emails';
const RACINE_SESSIONS = '/api/administration/sessions';
const RACINE_FICHES = '/api/administration/fiches-verrouillees';
const RACINE_TIERS = '/api/administration/tiers';

/** 400 : date illisible, dateDebut après dateFin, page ou size hors bornes. */
export function listEmails(filtres: FiltresEmail = {}): Promise<PageDto<LigneEmailDto>> {
  return request('GET', RACINE, { query: { ...filtres } });
}

/** Valeurs de `AdmUserDescription`, pour le filtre `utilisateur`. */
export function listUtilisateursEmails(): Promise<string[]> {
  return request('GET', `${RACINE}/utilisateurs`);
}

/** 404 si l'id est inconnu. `corps` s'affiche en texte, jamais comme du HTML. */
export function getEmail(id: UUID): Promise<EmailDetailDto> {
  return request('GET', `${RACINE}/${id}`);
}

/** FEATURE-admin-sessions.md. 400 : date illisible, dateDebut après dateFin, page ou size hors bornes. */
export function listSessions(filtres: FiltresSessions = {}): Promise<PageDto<LigneSessionDto>> {
  return request('GET', RACINE_SESSIONS, { query: { ...filtres } });
}

/** Valeurs de `UserDesc`, pour le filtre `utilisateur`. */
export function listUtilisateursSessions(): Promise<string[]> {
  return request('GET', `${RACINE_SESSIONS}/utilisateurs`);
}

/** 404 si l'id est inconnu, 409 si la session est déjà fermée. */
export function fermerSession(id: UUID): Promise<LigneSessionDto> {
  return request('POST', `${RACINE_SESSIONS}/${id}/fermer`);
}

/** FEATURE-admin-fiches-verrouillees.md. 400 : état ou date illisible, dateDebut après dateFin, page ou size hors bornes. */
export function listFichesVerrouillees(
  filtres: FiltresFichesVerrouillees = {},
): Promise<PageDto<LigneFicheVerrouilleeDto>> {
  return request('GET', RACINE_FICHES, { query: { ...filtres } });
}

/** 404 si l'id est inconnu, 409 si la fiche est déjà déverrouillée. */
export function deverrouillerFiche(id: UUID): Promise<LigneFicheVerrouilleeDto> {
  return request('POST', `${RACINE_FICHES}/${id}/deverrouiller`);
}

/** Ignore les filtres, comme OMRAN. `nombre` vaut 0 si aucun verrou n'était actif. */
export function deverrouillerToutesFiches(): Promise<ResultatDeverrouillageDto> {
  return request('POST', `${RACINE_FICHES}/deverrouiller-tout`);
}

/** FEATURE-admin-actions.md. 400 : date illisible, début de période après sa fin, page ou size hors bornes. */
export function listActions(filtres: FiltresActions = {}): Promise<PageDto<LigneActionDto>> {
  return request('GET', '/api/administration/actions', { query: { ...filtres } });
}

/** FEATURE-admin-tiers.md. 400 : natureId illisible, page ou size hors bornes. */
export function listTiers(famille: FamilleTiers, filtres: FiltresTiers = {}): Promise<PageDto<LigneTiersDto>> {
  return request('GET', `${RACINE_TIERS}/${famille}`, { query: { ...filtres } });
}

/** 404 si le tiers est inconnu ou d'une autre famille. */
export function getTiers(famille: FamilleTiers, id: UUID): Promise<FicheTiersDto> {
  return request('GET', `${RACINE_TIERS}/${famille}/${id}`);
}

/** 400 : `detail` nomme le champ fautif. */
export function creerTiers(famille: FamilleTiers, corps: EcritureTiersRequest): Promise<FicheTiersDto> {
  return request('POST', `${RACINE_TIERS}/${famille}`, { body: corps });
}

/** Remplace la fiche : un champ omis est vidé. 400 : `detail` nomme le champ. */
export function modifierTiers(famille: FamilleTiers, id: UUID, corps: EcritureTiersRequest): Promise<FicheTiersDto> {
  return request('PUT', `${RACINE_TIERS}/${famille}/${id}`, { body: corps });
}

/** 409 : tiers référencé ailleurs, rien n'est modifié. */
export function supprimerTiers(famille: FamilleTiers, id: UUID): Promise<void> {
  return request('DELETE', `${RACINE_TIERS}/${famille}/${id}`);
}

export function listNaturesTiers(famille: FamilleTiers): Promise<NatureTiersDto[]> {
  return request('GET', `${RACINE_TIERS}/${famille}/natures`);
}

/** Pour `notes`, `description` vaut le code. */
export function listReferentielTiers(liste: ListeReferentielTiers): Promise<ReferentielItemDto[]> {
  return request('GET', `${RACINE_TIERS}/referentiels/${liste}`);
}

export function listLiensTiers(tiersId: UUID): Promise<LienTiersDto[]> {
  return request('GET', `${RACINE_TIERS}/${tiersId}/liens`);
}

/** 400 : contact ou relation inconnu. 409 : contact déjà lié. */
export function ajouterLienTiers(tiersId: UUID, corps: LienTiersRequest): Promise<LienTiersDto> {
  return request('POST', `${RACINE_TIERS}/${tiersId}/liens`, { body: corps });
}

export function supprimerLienTiers(tiersId: UUID, lienId: UUID): Promise<void> {
  return request('DELETE', `${RACINE_TIERS}/${tiersId}/liens/${lienId}`);
}
