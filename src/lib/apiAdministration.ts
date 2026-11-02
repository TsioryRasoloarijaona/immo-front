// Endpoints de FEATURE-admin-email-historique.md : Administrateur seulement, lecture seule.
import { request } from './api';
import type { PageDto, UUID } from '../types';
import type {
  EmailDetailDto,
  FiltresEmail,
  FiltresSessions,
  LigneEmailDto,
  LigneSessionDto,
} from '../types/administration';

const RACINE = '/api/administration/emails';
const RACINE_SESSIONS = '/api/administration/sessions';

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
