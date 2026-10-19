// Endpoints de FEATURE-patrimoine-audit-actions.md : journal d'audit, notes, actions d'un article.
import { request } from './api';
import type { ActionDossierDto, CreerActionDossierRequest, PageDto, UUID } from '../types';
import type { CreerNoteRequest, LigneAuditDto, NoteDto, Porteur } from '../types/audit';

/** 404 si l'objet n'est ni un programme, ni une tranche, ni un article visible. */
export function getJournalAudit(objetId: UUID, page = 0, size = 50): Promise<PageDto<LigneAuditDto>> {
  return request('GET', '/api/audit', { query: { objetId, page, size } });
}

export function listNotes(porteur: Porteur, id: UUID): Promise<NoteDto[]> {
  return request('GET', '/api/notes', { query: { porteur, id } });
}

/** Administrateur seulement ; 400 « Veuillez saisir une note ! » si le texte est vide. */
export function creerNote(body: CreerNoteRequest): Promise<NoteDto> {
  return request('POST', '/api/notes', { body });
}

/** Administrateur seulement. */
export function supprimerNote(noteId: UUID): Promise<void> {
  return request('DELETE', `/api/notes/${noteId}`);
}

export function listActionsArticle(articleId: UUID): Promise<ActionDossierDto[]> {
  return request('GET', `/api/articles/${articleId}/actions`);
}

/** Administrateur seulement ; « Instruction » refusé (400). */
export function creerActionArticle(articleId: UUID, body: CreerActionDossierRequest): Promise<ActionDossierDto> {
  return request('POST', `/api/articles/${articleId}/actions`, { body });
}
