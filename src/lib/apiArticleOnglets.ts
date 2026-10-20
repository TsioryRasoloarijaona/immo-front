// Endpoints de FEATURE-patrimoine-article-onglets.md : onglets de l'article, pièces jointes du patrimoine.
import { API_BASE_URL, openStoredFileInTab, postMultipart, postMultipartFichiers, request } from './api';
import type { PieceJointeDto, ProspectionListItemDto, UUID } from '../types';
import type {
  ArticleDossierDto,
  ArticleHistoriqueDto,
  BilanAttachementDto,
  PorteurPieces,
  SaisiePieceJointe,
} from '../types/articleOnglets';

/** Pré-prospections exclues ; 404 si l'article est inconnu ou de l'entité inactive. */
export function listProspectionsArticle(articleId: UUID): Promise<ProspectionListItemDto[]> {
  return request('GET', `/api/articles/${articleId}/prospections`);
}

/** Ventes (tous statuts), puis locations, puis syndics. */
export function listDossiersArticle(articleId: UUID): Promise<ArticleDossierDto[]> {
  return request('GET', `/api/articles/${articleId}/dossiers`);
}

/** La plus récente d'abord. */
export function listHistoriqueArticle(articleId: UUID): Promise<ArticleHistoriqueDto[]> {
  return request('GET', `/api/articles/${articleId}/historique`);
}

export function listPiecesPatrimoine(porteur: PorteurPieces, id: UUID): Promise<PieceJointeDto[]> {
  return request('GET', `/api/${porteur}/${id}/pieces-jointes`);
}

/** Redirection 302 vers le stockage : ouvert dans un onglet. */
export function ouvrirPiecePatrimoine(porteur: PorteurPieces, id: UUID, pieceId: UUID): void {
  openStoredFileInTab(`${API_BASE_URL}/api/${porteur}/${id}/pieces-jointes/${pieceId}/fichier`);
}

/** Administrateur seulement ; 400 extension non admise (liste dans `detail`), 413 au-delà de 50 Mo. */
export function deposerPiecePatrimoine(porteur: PorteurPieces, id: UUID, fichier: File,
                                       saisie: SaisiePieceJointe): Promise<PieceJointeDto> {
  return postMultipart<PieceJointeDto>(`/api/${porteur}/${id}/pieces-jointes`, fichier, { ...saisie });
}

/** Administrateur seulement ; suppression logique, sans restauration. */
export function supprimerPiecePatrimoine(porteur: PorteurPieces, id: UUID, pieceId: UUID): Promise<void> {
  return request('DELETE', `/api/${porteur}/${id}/pieces-jointes/${pieceId}`);
}

/** Administrateur seulement ; `typeId` obligatoire. Envoyer des lots < 50 Mo et ≤ 100 fichiers. */
export function attacherEnMasse(trancheId: UUID, fichiers: readonly File[],
                                saisie: SaisiePieceJointe): Promise<BilanAttachementDto[]> {
  return postMultipartFichiers<BilanAttachementDto[]>(`/api/tranches/${trancheId}/pieces-jointes/masse`, fichiers,
    { ...saisie });
}

/** Administrateur seulement : suggestions pour le champ libre « groupe ». */
export function listGroupesPieceJointe(): Promise<string[]> {
  return request('GET', '/api/articles/groupes-piece-jointe');
}
