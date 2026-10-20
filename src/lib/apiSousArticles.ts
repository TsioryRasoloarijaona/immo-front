// Endpoints de FEATURE-patrimoine-sous-articles.md : catalogue de colonnes Article, listes Articles / Sous-articles,
// écriture des sous-articles.
import { request, withPageable } from './api';
import type { ArticleDetailDto, ArticleEcritureDto, ColonneDto, PageDto, Pageable, UUID } from '../types';
import type { FiltresListeArticles, LigneArticleDto } from '../types/sousArticles';

export function getColonnesArticles(): Promise<ColonneDto[]> {
  return request('GET', '/api/referentiels/colonnes/articles');
}

/**
 * `articles` : tous les articles ; `sous-articles` : sous-articles d'origine (libres et rattachés). Mêmes filtres et
 * même catalogue ; `colonnes` absent = champs d'`ArticleListItemDto`, nom inconnu → 400.
 */
export function listLignesArticles(
  liste: 'articles' | 'sous-articles',
  filtres?: FiltresListeArticles & { colonnes?: string[] },
  pageable?: Pageable,
): Promise<PageDto<LigneArticleDto>> {
  return request('GET', `/api/${liste}`, { query: withPageable(filtres, pageable) });
}

/** Administrateur. Création libre ; `parentId` facultatif (même tranche et vocation, 400 ; parent occupé, 409). */
export function createSousArticle(saisie: ArticleEcritureDto): Promise<ArticleDetailDto> {
  return request('POST', '/api/sous-articles', { body: saisie });
}

/** Administrateur. Sous-article libre seulement : un rattaché → 409 (le modifier par `PATCH /api/articles/{id}`). */
export function updateSousArticle(id: UUID, saisie: ArticleEcritureDto): Promise<ArticleDetailDto> {
  return request('PATCH', `/api/sous-articles/${id}`, { body: saisie });
}

/** Administrateur. 409 si affecté par défaut, porteur d'un dossier ou encore référencé. */
export function deleteSousArticle(id: UUID): Promise<void> {
  return request('DELETE', `/api/sous-articles/${id}`);
}
