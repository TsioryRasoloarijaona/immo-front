// Endpoints de FEATURE-achat-lecture-factures.md §3 : pièces d'achat en lecture, visibles par habilitation projet.
import { request, withPageable } from './api';
import type { PageDto, Pageable, UUID } from '../types';
import type {
  DocumentAchatDetailDto,
  DocumentAchatListItemDto,
  FiltresDocumentsAchat,
  ReferentielsAchatDto,
} from '../types/achat';

const RACINE = '/api/achat';
const DOCUMENTS = `${RACINE}/documents`;

export function getReferentielsAchat(): Promise<ReferentielsAchatDto> {
  return request('GET', `${RACINE}/referentiels`);
}

/** 400 sur un filtre mal formé ; page vide si l'appelant n'a aucun projet habilité. */
export function getDocumentsAchat(filtres: FiltresDocumentsAchat = {}, pageable?: Pageable): Promise<PageDto<DocumentAchatListItemDto>> {
  return request('GET', DOCUMENTS, { query: withPageable({ ...filtres }, pageable) });
}

/** 404 « Pièce introuvable » : id inconnu, pièce sans projet ou hors périmètre. */
export function getDocumentAchat(id: UUID): Promise<DocumentAchatDetailDto> {
  return request('GET', `${DOCUMENTS}/${id}`);
}

/** Chemin de l'export `.xlsx` (mêmes filtres que la liste). */
export function cheminExportDocumentsAchat(): string {
  return `${DOCUMENTS}/export`;
}
