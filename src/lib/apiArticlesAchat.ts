// Endpoints de FEATURE-n8-nomenclature.md : articles d'achat (droits OMRAN Yes.Buy.Front.Config.BuyItemList[.toolNew|.toolDelete]).
// Familles, sous-familles et natures fournisseur : moteur /api/referentiels-admin (famille ACHAT), voir apiReferentielsAdmin.ts.
import { request } from './api';
import type { UUID } from '../types';
import type {
  ArticleAchatDto,
  ArticleAchatEcritureDto,
  ArticlesAchatDto,
  SousFamilleAchatDto,
} from '../types/articlesAchat';

const ARTICLES = '/api/achat/config/articles';

export function listerArticlesAchat(search?: string): Promise<ArticlesAchatDto> {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  return request('GET', `${ARTICLES}${q}`);
}

export function listerSousFamillesAchat(): Promise<SousFamilleAchatDto[]> {
  return request('GET', `${ARTICLES}/sous-familles`);
}

export function lireArticleAchat(id: UUID): Promise<ArticleAchatDto> {
  return request('GET', `${ARTICLES}/${id}`);
}

/** 400 obligatoire manquant ou sous-famille hors famille, 409 « Ce code existe déjà. ». */
export function creerArticleAchat(body: ArticleAchatEcritureDto): Promise<ArticleAchatDto> {
  return request('POST', ARTICLES, { body });
}

export function modifierArticleAchat(id: UUID, body: ArticleAchatEcritureDto): Promise<ArticleAchatDto> {
  return request('PATCH', `${ARTICLES}/${id}`, { body });
}

/** 409 si l'article est cité (message du serveur à afficher). */
export function supprimerArticleAchat(id: UUID): Promise<void> {
  return request('DELETE', `${ARTICLES}/${id}`);
}
