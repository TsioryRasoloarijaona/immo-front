// Endpoints de FEATURE-achat-lecture-factures.md §3 : pièces d'achat en lecture, visibles par habilitation projet.
import { request, withPageable } from './api';
import type { PageDto, Pageable, UUID } from '../types';
import type {
  AffecterBonCommandeRequest,
  DocumentAchatDetailDto,
  DocumentAchatListItemDto,
  FiltresDocumentsAchat,
  FiltresSoldesFournisseurs,
  ReferentielsAchatDto,
  SoldesFournisseursDto,
  TotauxDocumentsAchatDto,
  TransitionPieceAchatRequest,
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

// FEATURE-achat-fiche-ecritures.md E-B2 à E-B4 : 404 pièce, 403 droit, 409 règle (detail), 400 champ.
/** 409 : corps avec `transitionsPermises` ; renvoie la fiche relue. */
export function transitionnerPieceAchat(id: UUID, body: TransitionPieceAchatRequest): Promise<DocumentAchatDetailDto> {
  return request('PATCH', `${DOCUMENTS}/${id}/statut`, { body });
}

export function supprimerPieceAchat(id: UUID): Promise<void> {
  return request('DELETE', `${DOCUMENTS}/${id}`);
}

/** Facture seulement ; 404 « Bon de commande introuvable » si le BC n'est pas visible. */
export function affecterBonCommandeAchat(id: UUID, body: AffecterBonCommandeRequest): Promise<DocumentAchatDetailDto> {
  return request('PUT', `${DOCUMENTS}/${id}/bon-commande`, { body });
}

/** Chemin de l'export `.xlsx` (mêmes filtres que la liste). */
export function cheminExportDocumentsAchat(): string {
  return `${DOCUMENTS}/export`;
}

// FEATURE-achat-impayes.md §4 : totaux de la liste, solde par fournisseur et société.
const SOLDES = `${RACINE}/fournisseurs/soldes`;

/** Mêmes filtres que la liste, toutes pages ; tout à zéro sans projet habilité. */
export function getTotauxDocumentsAchat(filtres: FiltresDocumentsAchat = {}): Promise<TotauxDocumentsAchatDto> {
  return request('GET', `${DOCUMENTS}/totaux`, { query: { ...filtres } });
}

/** Non paginé ; lignes vides sans projet habilité. */
export function getSoldesFournisseurs(filtres: FiltresSoldesFournisseurs = {}): Promise<SoldesFournisseursDto> {
  return request('GET', SOLDES, { query: { ...filtres } });
}

/** Chemin de l'export `.xlsx` du solde fournisseurs (mêmes filtres). */
export function cheminExportSoldesFournisseurs(): string {
  return `${SOLDES}/export`;
}
