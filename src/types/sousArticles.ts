// Miroir des DTO de FEATURE-patrimoine-sous-articles.md (catalogue Article, listes Articles et Sous-articles).
import type { ArticleStatut, UUID } from '../types';

/** Dossier de la ligne elle-même, comme OMRAN (le parent vendu ne compte pas : voir `parentOccupe`). */
export type EtatArticle = 'LIBRE' | 'VENDU' | 'LOUE';

/** Filtres communs de `GET /api/articles` et `GET /api/sous-articles` ; absent = pas de filtre. */
export type FiltresListeArticles = {
  /** Sans casse ni espaces : code, description, code parent, tranche, titre foncier, adresse, libellés. */
  search?: string;
  trancheId?: UUID[];
  statut?: ArticleStatut;
  categorieId?: UUID[];
  typeId?: UUID[];
  entiteId?: UUID;
  natureId?: UUID;
  vocationId?: UUID;
  etageId?: UUID;
  prixDe?: number;
  prixA?: number;
  surfaceDe?: number;
  surfaceA?: number;
  /** Sous-chaîne du code parent, espaces ignorés des deux côtés. */
  codeParent?: string;
  etat?: EtatArticle;
};

/**
 * Ligne de `GET /api/articles` / `GET /api/sous-articles` : seules les colonnes de `?colonnes=` sont présentes
 * (catalogue `GET /api/referentiels/colonnes/articles` ; absent = champs d'`ArticleListItemDto`). Taux en fraction.
 */
export interface LigneArticleDto {
  id: UUID;
  code?: string;
  description?: string;
  trancheCode?: string | null;
  trancheDescription?: string | null;
  programmeCode?: string | null;
  programmeLibelle?: string | null;
  entiteCode?: string | null;
  entiteLibelle?: string | null;
  lotParentId?: UUID | null;
  parentCode?: string | null;
  parentDescription?: string | null;
  /** A un article parent (pas `estSousArticle`). */
  sousArticle?: boolean;
  /** IsUnderItem : lot annexe, rattaché ou libre. */
  estSousArticle?: boolean | null;
  toujoursAffecte?: boolean | null;
  /** Codes des sous-articles rattachés, séparés par « , ». */
  sousArticlesCodes?: string | null;
  immeubleId?: UUID | null;
  immeubleCode?: string | null;
  immeubleLibelle?: string | null;
  etageId?: UUID | null;
  etageCode?: string | null;
  etageLibelle?: string | null;
  vocationCode?: string | null;
  vocationLibelle?: string | null;
  natureId?: UUID | null;
  natureCode?: string | null;
  natureLibelle?: string | null;
  categorieId?: UUID | null;
  categorieCode?: string | null;
  categorieLibelle?: string | null;
  typeId?: UUID | null;
  typeCode?: string | null;
  typeLibelle?: string | null;
  presentationTypeId?: UUID | null;
  presentationTypeCode?: string | null;
  presentationTypeLibelle?: string | null;
  orientationCode?: string | null;
  orientationLibelle?: string | null;
  facade?: string | null;
  /** Libellés des vues, séparés par « , ». */
  vues?: string | null;
  categorieChargeCode?: string | null;
  categorieChargeLibelle?: string | null;
  adresse?: string | null;
  notes?: string | null;
  anomalies?: string | null;
  contenanceLibre?: string | null;
  statut?: ArticleStatut;
  /** Libellé du statut du dossier de vente, « Loué », ou « Libre ». */
  etat?: string;
  /** Parent occupé : la ligne ne se modifie plus. */
  parentOccupe?: boolean | null;
  dossierId?: UUID | null;
  dossierCode?: string | null;
  dossierStatut?: string | null;
  clientId?: UUID | null;
  clientNom?: string | null;
  /** prixReste du dossier dossierCode ; null sans dossier ou dossier annulé / désisté. */
  resteARegler?: number | null;
  /** Codes des parkings du dossier et des sous-articles PAR, séparés par « , ». */
  parkingChoisi?: string | null;
  area?: number | null;
  surfaceProvisoire?: number | null;
  superficieNette?: number | null;
  superficieSousArticles?: number | null;
  superficieTitree?: number | null;
  superficieTerrasse?: number | null;
  tauxTVA?: number | null;
  remiseMax1?: number | null;
  remiseMax2?: number | null;
  /** ComSaleMinAdvance (« Avance »). */
  avanceMinimum?: number | null;
  loyerMensuelHT?: number | null;
  loyerMensuelTTC?: number | null;
  nombreCautions?: number | null;
  prixM2DefinitifHT?: number | null;
  prixM2DefinitifTTC?: number | null;
  prixM2ProvisoireHT?: number | null;
  prixM2ProvisoireTTC?: number | null;
  prixArticleDefinitifHT?: number | null;
  salePrice?: number | null;
  prixArticleProvisoireHT?: number | null;
  salePriceFloor?: number | null;
  prixSousArticlesHT?: number | null;
  prixSousArticlesTTC?: number | null;
  prixSousArticlesProvisoireHT?: number | null;
  prixSousArticlesProvisoireTTC?: number | null;
  prixVenteDefinitifHT?: number | null;
  comSalePrice?: number | null;
  prixVenteProvisoireHT?: number | null;
  comSalePriceFloor?: number | null;
  prixSuggere?: number | null;
  prixSuggereEstPlancher?: boolean;
  titreFoncier?: string | null;
  dateEnregistrement?: string | null;
  numeroEnregistrement?: string | null;
  lieuEnregistrement?: string | null;
  cpfImmatriculation?: string | null;
  dateImmatriculation?: string | null;
  titreFoncierMere?: string | null;
  intituleTitreFoncier?: string | null;
  dateTitreFoncier?: string | null;
  notesTitreFoncier?: string | null;
  proprieteDite?: string | null;
  fractionDivise?: string | null;
  fractionDiviseTerrain?: string | null;
  partiesDivises?: number | null;
  partiesIndivises?: number | null;
  quotaTerrain?: string | null;
  referenceElectricite?: string | null;
  policeElectricite?: string | null;
  compteurElectricite?: string | null;
  releveElectricite?: string | null;
  referenceEau?: string | null;
  policeEau?: string | null;
  compteurEau?: string | null;
  releveEau?: string | null;
  referenceGaz?: string | null;
  policeGaz?: string | null;
  compteurGaz?: string | null;
  releveGaz?: string | null;
  creePar?: string | null;
  creeLe?: string | null;
  modifiePar?: string | null;
  modifieLe?: string | null;
}
