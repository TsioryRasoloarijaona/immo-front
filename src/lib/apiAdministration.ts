// Endpoints de FEATURE-admin-email-historique.md : Administrateur seulement, lecture seule.
import { request } from './api';
import type { PageDto, UUID } from '../types';
import type { EmailDetailDto, FiltresEmail, LigneEmailDto } from '../types/administration';

const RACINE = '/api/administration/emails';

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
