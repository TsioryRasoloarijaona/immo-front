import { request } from './api';
import type {
  ArticleDetailDto,
  ArticleEcritureDto,
  ProjetDetailDto,
  ProjetEcritureDto,
  TrancheDetailDto,
  TrancheEcritureDto,
  UUID,
} from '../types';

// Écritures du patrimoine : 403 hors Administrateur, 400/409 ProblemDetail (`ApiError.message` = `detail`).

export function createProjet(body: ProjetEcritureDto): Promise<ProjetDetailDto> {
  return request('POST', '/api/projets', { body });
}

export function updateProjet(id: UUID, body: ProjetEcritureDto): Promise<ProjetDetailDto> {
  return request('PATCH', `/api/projets/${id}`, { body });
}

export function createTranche(body: TrancheEcritureDto): Promise<TrancheDetailDto> {
  return request('POST', '/api/tranches', { body });
}

/** `projetId` différent de l'actuel : 400. */
export function updateTranche(id: UUID, body: TrancheEcritureDto): Promise<TrancheDetailDto> {
  return request('PATCH', `/api/tranches/${id}`, { body });
}

export function createArticle(body: ArticleEcritureDto): Promise<ArticleDetailDto> {
  return request('POST', '/api/articles', { body });
}

/** Article occupé : 409 sur tout champ protégé (prix, surfaces, classification, remises). */
export function updateArticle(id: UUID, body: ArticleEcritureDto): Promise<ArticleDetailDto> {
  return request('PATCH', `/api/articles/${id}`, { body });
}

/** `trancheId` interdit dans le corps (400) : la tranche est celle de l'article. */
export function createSousArticle(articleId: UUID, body: ArticleEcritureDto): Promise<ArticleDetailDto> {
  return request('POST', `/api/articles/${articleId}/sous-articles`, { body });
}

/** Renvoie l'article parent, prix de vente recalculé. */
export function affecterSousArticle(articleId: UUID, sousArticleId: UUID, toujoursAffecte: boolean): Promise<ArticleDetailDto> {
  return request('POST', `/api/articles/${articleId}/sous-articles/${sousArticleId}/affecter`, { body: { toujoursAffecte } });
}

export function desaffecterSousArticle(articleId: UUID, sousArticleId: UUID): Promise<ArticleDetailDto> {
  return request('POST', `/api/articles/${articleId}/sous-articles/${sousArticleId}/desaffecter`);
}
