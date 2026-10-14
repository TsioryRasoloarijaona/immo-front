// Endpoints de FEATURE-vente-echeancier.md : échéancier complet et sous-listes de la fiche dossier.
import { request } from './api';
import type { EcheanceDto, UUID } from '../types';
import type {
  AcquereursDto,
  ArchiverProspectionsRequest,
  CadeauCatalogueDto,
  CadeauDto,
  CadeauRequest,
  CreerModalitePaiementRequest,
  EtatSchemaDto,
  GenererPeriodiqueRequest,
  ModalitePaiementDto,
  ModificationRequest,
  ModificationsDto,
  RepartitionAcquereursRequest,
  SousArticleDisponibleDto,
  SousArticlesDto,
} from '../types/dossierSousListes';

const base = (dossierId: UUID) => `/api/dossiers/${dossierId}`;

/* ---- Échéancier ---- */

export function getEtatSchema(dossierId: UUID): Promise<EtatSchemaDto> {
  return request('GET', `${base(dossierId)}/echeancier/schema`);
}

/** Administrateur seulement (403 sinon) ; 409 si la ligne est réglée, autorisée ou en recouvrement.
 * Renvoie l'état du schéma après suppression, écart compris. */
export function supprimerEcheance(dossierId: UUID, echeanceId: UUID): Promise<EtatSchemaDto> {
  return request('DELETE', `${base(dossierId)}/echeancier/${echeanceId}`);
}

export function genererEcheancesPeriodiques(dossierId: UUID, body: GenererPeriodiqueRequest): Promise<EcheanceDto[]> {
  return request('POST', `${base(dossierId)}/echeancier/periodique`, { body });
}

/* ---- Sous-articles ---- */

export function listSousArticles(dossierId: UUID): Promise<SousArticlesDto> {
  return request('GET', `${base(dossierId)}/sous-articles`);
}

export function listSousArticlesDisponibles(dossierId: UUID): Promise<SousArticleDisponibleDto[]> {
  return request('GET', `${base(dossierId)}/sous-articles/disponibles`);
}

/** Administrateur seulement (403 sinon). */
export function ajouterSousArticle(dossierId: UUID, articleId: UUID): Promise<SousArticlesDto> {
  return request('POST', `${base(dossierId)}/sous-articles`, { body: { articleId } });
}

/** Administrateur seulement ; 409 si le sous-article est affecté par défaut. */
export function retirerSousArticle(dossierId: UUID, ligneId: UUID): Promise<SousArticlesDto> {
  return request('DELETE', `${base(dossierId)}/sous-articles/${ligneId}`);
}

/* ---- Acquéreurs ---- */

export function getAcquereurs(dossierId: UUID): Promise<AcquereursDto> {
  return request('GET', `${base(dossierId)}/acquereurs`);
}

/** Remplace la répartition ; 400 si la part du principal est nulle ou si Σ ≠ 100 %. */
export function enregistrerAcquereurs(dossierId: UUID, body: RepartitionAcquereursRequest): Promise<AcquereursDto> {
  return request('PUT', `${base(dossierId)}/acquereurs`, { body });
}

export function archiverProspectionsAcquereurs(dossierId: UUID, prospectionIds: UUID[]): Promise<void> {
  const body: ArchiverProspectionsRequest = { prospectionIds };
  return request('POST', `${base(dossierId)}/acquereurs/archiver-prospections`, { body });
}

/* ---- Modifications ---- */

export function getModifications(dossierId: UUID): Promise<ModificationsDto> {
  return request('GET', `${base(dossierId)}/modifications`);
}

export function ajouterModification(dossierId: UUID, body: ModificationRequest): Promise<ModificationsDto> {
  return request('POST', `${base(dossierId)}/modifications`, { body });
}

export function modifierModification(dossierId: UUID, modificationId: UUID, body: ModificationRequest): Promise<ModificationsDto> {
  return request('PUT', `${base(dossierId)}/modifications/${modificationId}`, { body });
}

export function supprimerModification(dossierId: UUID, modificationId: UUID): Promise<ModificationsDto> {
  return request('DELETE', `${base(dossierId)}/modifications/${modificationId}`);
}

/* ---- Cadeaux ---- */

export function listCadeaux(dossierId: UUID): Promise<CadeauDto[]> {
  return request('GET', `${base(dossierId)}/cadeaux`);
}

export function getCatalogueCadeaux(dossierId: UUID): Promise<CadeauCatalogueDto[]> {
  return request('GET', `${base(dossierId)}/cadeaux/catalogue`);
}

export function getRaisonsCadeaux(dossierId: UUID): Promise<CadeauCatalogueDto[]> {
  return request('GET', `${base(dossierId)}/cadeaux/raisons`);
}

/** Administrateur ou Commercial Chef (403 sinon) ; 400 si livré sans date de livraison. */
export function ajouterCadeau(dossierId: UUID, body: CadeauRequest): Promise<CadeauDto[]> {
  return request('POST', `${base(dossierId)}/cadeaux`, { body });
}

/** Changer la raison exige Administrateur ou Commercial Chef (403 sinon). */
export function modifierCadeau(dossierId: UUID, cadeauId: UUID, body: CadeauRequest): Promise<CadeauDto[]> {
  return request('PUT', `${base(dossierId)}/cadeaux/${cadeauId}`, { body });
}

/** Administrateur ou Commercial Chef (403 sinon). */
export function supprimerCadeau(dossierId: UUID, cadeauId: UUID): Promise<CadeauDto[]> {
  return request('DELETE', `${base(dossierId)}/cadeaux/${cadeauId}`);
}

/* ---- Modalité de paiement ---- */

export function listModalitePaiement(dossierId: UUID): Promise<ModalitePaiementDto[]> {
  return request('GET', `${base(dossierId)}/modalite-paiement`);
}

export function ajouterModalitePaiement(dossierId: UUID, body: CreerModalitePaiementRequest): Promise<ModalitePaiementDto[]> {
  return request('POST', `${base(dossierId)}/modalite-paiement`, { body });
}

export function supprimerModalitePaiement(dossierId: UUID, ligneId: UUID): Promise<ModalitePaiementDto[]> {
  return request('DELETE', `${base(dossierId)}/modalite-paiement/${ligneId}`);
}

export function copierSchemaEnModalite(dossierId: UUID): Promise<ModalitePaiementDto[]> {
  return request('POST', `${base(dossierId)}/modalite-paiement/copier-schema`);
}
