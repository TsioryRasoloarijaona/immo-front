import { API_BASE_URL, fetchByteEndpointBlob, ouvrirBlobDansOnglet, request, triggerBlobDownload } from './api';
import type { UUID } from '../types';
import type {
  ApercuModeleRequest,
  CatalogueChampsDto,
  CategorieModeleDto,
  CreerModeleDocumentRequest,
  ModeleDocumentAdminDto,
  ModeleDocumentDetailDto,
  ModeleDocumentResumeDto,
  ModifierModeleDocumentRequest,
  VersionModeleDto,
} from '../types/modeles';

const BASE = '/api/modeles-documents';
const MIME_PDF = 'application/pdf';
const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export type FormatModele = 'pdf' | 'docx';

export function listCategoriesModeles(): Promise<CategorieModeleDto[]> {
  return request('GET', `${BASE}/categories`);
}

export function getCatalogueChamps(categorie: string): Promise<CatalogueChampsDto> {
  return request('GET', `${BASE}/categories/${encodeURIComponent(categorie)}/champs`);
}

/** Modèles actifs d'une catégorie, triés par `ordre` : ce que propose « Imprimer ». */
export function listModelesActifs(categorie: string): Promise<ModeleDocumentResumeDto[]> {
  return request('GET', BASE, { query: { categorie } });
}

export function listModelesAdmin(categorie?: string): Promise<ModeleDocumentAdminDto[]> {
  return request('GET', `${BASE}/admin`, { query: { categorie } });
}

export function getModele(id: UUID): Promise<ModeleDocumentDetailDto> {
  return request('GET', `${BASE}/${id}`);
}

export function creerModele(corps: CreerModeleDocumentRequest): Promise<ModeleDocumentDetailDto> {
  return request('POST', BASE, { body: corps });
}

export function modifierModele(id: UUID, corps: ModifierModeleDocumentRequest): Promise<ModeleDocumentDetailDto> {
  return request('PUT', `${BASE}/${id}`, { body: corps });
}

export function listVersionsModele(id: UUID): Promise<VersionModeleDto[]> {
  return request('GET', `${BASE}/${id}/versions`);
}

export function restaurerVersionModele(id: UUID, numero: number): Promise<ModeleDocumentDetailDto> {
  return request('POST', `${BASE}/${id}/versions/${numero}/restaurer`);
}

/** Aperçu d'un contenu non enregistré, ouvert dans un nouvel onglet. */
export function ouvrirApercuModele(id: UUID, corps: ApercuModeleRequest): Promise<void> {
  return ouvrirBlobDansOnglet(() =>
    fetchByteEndpointBlob(`${API_BASE_URL}${BASE}/${id}/apercu`, MIME_PDF, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corps),
    }),
  );
}

function genererBlob(id: UUID, ficheId: UUID, format: FormatModele): Promise<Blob> {
  const url = `${API_BASE_URL}${BASE}/${id}/generer?ficheId=${encodeURIComponent(ficheId)}&format=${format}`;
  return fetchByteEndpointBlob(url, format === 'pdf' ? MIME_PDF : MIME_DOCX);
}

export function voirDocumentModele(id: UUID, ficheId: UUID): Promise<void> {
  return ouvrirBlobDansOnglet(() => genererBlob(id, ficheId, 'pdf'));
}

export async function telechargerDocumentModele(id: UUID, ficheId: UUID, format: FormatModele, nomFichier: string): Promise<void> {
  triggerBlobDownload(await genererBlob(id, ficheId, format), nomFichier);
}
