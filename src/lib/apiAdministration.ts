// Endpoints de FEATURE-admin-email-historique.md : Administrateur seulement, lecture seule.
import { request } from './api';
import type { PageDto, UUID } from '../types';
import type {
  EmailDetailDto,
  FiltresActions,
  FiltresEmail,
  FiltresFichesVerrouillees,
  FiltresSessions,
  LigneActionDto,
  LigneEmailDto,
  LigneFicheVerrouilleeDto,
  LigneSessionDto,
  ResultatDeverrouillageDto,
} from '../types/administration';

const RACINE = '/api/administration/emails';
const RACINE_SESSIONS = '/api/administration/sessions';
const RACINE_FICHES = '/api/administration/fiches-verrouillees';

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
