import { request } from './api';
import type {
  ArticleDetailDto,
  ArticleEcritureDto,
  ContenanceDto,
  LigneContenanceDto,
  LignesTrancheDto,
  ProjetDetailDto,
  ProjetEcritureDto,
  ReferentielItemDto,
  TrancheDetailDto,
  TrancheEcritureDto,
  UUID,
  ZoneProjetDto,
  ZoneProjetEcritureDto,
} from '../types';

// Écritures du patrimoine : 403 hors Administrateur, 400/409 ProblemDetail (`ApiError.message` = `detail`).

export function createProjet(body: ProjetEcritureDto): Promise<ProjetDetailDto> {
  return request('POST', '/api/projets', { body });
}

export function updateProjet(id: UUID, body: ProjetEcritureDto): Promise<ProjetDetailDto> {
  return request('PATCH', `/api/projets/${id}`, { body });
}

/** 409 si une tranche, un article ou une autre table le référence (le message dit quoi). */
export function deleteProjet(id: UUID): Promise<void> {
  return request('DELETE', `/api/projets/${id}`);
}

/** OMRAN `GetDefaultValuesFromCompany`, code et description compris ; 404 entité inactive. */
export function getDefautsEntite(entiteId: UUID): Promise<ProjetEcritureDto> {
  return request('GET', `/api/projets/defauts-entite/${entiteId}`);
}

export function listZones(projetId: UUID): Promise<ZoneProjetDto[]> {
  return request('GET', `/api/projets/${projetId}/zones`);
}

/** 409 : code déjà pris sous le même parent. */
export function createZone(projetId: UUID, body: ZoneProjetEcritureDto): Promise<ZoneProjetDto> {
  return request('POST', `/api/projets/${projetId}/zones`, { body });
}

export function updateZone(projetId: UUID, zoneId: UUID, body: ZoneProjetEcritureDto): Promise<ZoneProjetDto> {
  return request('PATCH', `/api/projets/${projetId}/zones/${zoneId}`, { body });
}

/** 409 : sous-zones ou zone référencée (SAV, GRH). */
export function deleteZone(projetId: UUID, zoneId: UUID): Promise<void> {
  return request('DELETE', `/api/projets/${projetId}/zones/${zoneId}`);
}

export type ReferentielPatrimoine =
  | 'standings' | 'niveaux-terrain' | 'rubriques-tranche' | 'personnels' | 'plans-comptables' | 'tiers-autrui'
  | 'projets-facturation' | 'orientations' | 'categories-charge' | 'facades' | 'vues';

/** Contenances et leurs options (option null = case grisée de l'onglet Contenances). */
export function getReferentielContenances(): Promise<ContenanceDto[]> {
  return request('GET', '/api/referentiels-patrimoine/contenances');
}

/** `projets-facturation` : Administrateur seul (403 sinon), `entiteId` absent = entités actives. */
export function getReferentielPatrimoine(nom: ReferentielPatrimoine, entiteId?: UUID): Promise<ReferentielItemDto[]> {
  return request('GET', `/api/referentiels-patrimoine/${nom}`, { query: { entiteId } });
}

export function createTranche(body: TrancheEcritureDto): Promise<TrancheDetailDto> {
  return request('POST', '/api/tranches', { body });
}

/** `projetId` différent de l'actuel : 400. */
export function updateTranche(id: UUID, body: TrancheEcritureDto): Promise<TrancheDetailDto> {
  return request('PATCH', `/api/tranches/${id}`, { body });
}

/** 409 : article, prospection, offre… référencent la tranche (le message les compte). */
export function deleteTranche(id: UUID): Promise<void> {
  return request('DELETE', `/api/tranches/${id}`);
}

export type OngletTranche = 'terrains' | 'etages' | 'plancher-couvert' | 'frais';

export function getOngletTranche<T>(id: UUID, onglet: OngletTranche): Promise<LignesTrancheDto<T>> {
  return request('GET', `/api/tranches/${id}/${onglet}`);
}

/** Liste complète, une transaction ; 400 `lignes[i].<champ>`, rien n'est écrit. Renvoie la liste relue. */
export function putOngletTranche<T>(id: UUID, onglet: OngletTranche, lignes: T[]): Promise<LignesTrancheDto<T>> {
  return request('PUT', `/api/tranches/${id}/${onglet}`, { body: { lignes } });
}

export function getChoixOngletTranche(nom: 'terrains-disponibles' | 'categories-frais'): Promise<ReferentielItemDto[]> {
  return request('GET', `/api/tranches/${nom}`);
}

export function createArticle(body: ArticleEcritureDto): Promise<ArticleDetailDto> {
  return request('POST', '/api/articles', { body });
}

/** Types de présentation de la tranche (choix de `presentationId`) ; 404 entité inactive. */
export function getPresentationsTranche(trancheId: UUID): Promise<ReferentielItemDto[]> {
  return request('GET', `/api/tranches/${trancheId}/presentations`);
}

/** Article occupé : 409 sur tout champ protégé (prix, surfaces, classification, remises, titre foncier).
 * Terrain (nature TER) : 400, il se modifie depuis la fiche terrain. */
export function updateArticle(id: UUID, body: ArticleEcritureDto): Promise<ArticleDetailDto> {
  return request('PATCH', `/api/articles/${id}`, { body });
}

/** 409 : article ou sous-article rattaché occupé (vente, location, syndic) ou encore référencé (le message dit quoi). */
export function deleteArticle(id: UUID): Promise<void> {
  return request('DELETE', `/api/articles/${id}`);
}

export function getContenancesArticle(id: UUID): Promise<LignesTrancheDto<LigneContenanceDto>> {
  return request('GET', `/api/articles/${id}/contenances`);
}

/** Liste complète, une transaction ; 400 `lignes[i].<champ>` (option grisée, quantité interdite), rien n'est écrit. */
export function putContenancesArticle(id: UUID, lignes: LigneContenanceDto[]): Promise<LignesTrancheDto<LigneContenanceDto>> {
  return request('PUT', `/api/articles/${id}/contenances`, { body: { lignes } });
}

/** `trancheId` ou `vocationId` interdits dans le corps (400) : ce sont ceux de l'article. */
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
