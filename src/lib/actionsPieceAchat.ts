import { ApiError, oublierLecturesRecentes } from './api';
import { getDocumentAchat } from './apiAchat';
import { errorMessage } from './useApi';
import type { UUID } from '../types';
import type { DocumentAchatDetailDto } from '../types/achat';

/** 404 : « Pièce introuvable » ; sinon le `detail` du serveur tel quel (403, 409, 400). */
export function messageActionPieceAchat(err: unknown): string {
  if (err instanceof ApiError && err.status === 404) return 'Pièce introuvable';
  return errorMessage(err);
}

export function estIntrouvable(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

/** Après un refus du serveur (409) : relit la pièce pour que statut et actions soient à jour ; null si la relecture échoue. */
export async function relirePieceAchat(id: UUID): Promise<DocumentAchatDetailDto | null> {
  oublierLecturesRecentes();
  try {
    return await getDocumentAchat(id);
  } catch {
    return null;
  }
}
