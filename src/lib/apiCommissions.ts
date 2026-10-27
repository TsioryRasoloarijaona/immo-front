// Endpoints de FEATURE-vente-commissions.md §4 : écran « Commissions » (Vente), par tranche.
import { request } from './api';
import type { UUID } from '../types';
import type {
  CommissionTrancheDto,
  DocumentCommissionDto,
  DossierCommissionDto,
  DroitsCommissionDto,
  FiltresCommission,
  LigneCommissionCalculeeDto,
  ResultatGenerationDto,
  TypeCommission,
} from '../types/commissions';

const RACINE = '/api/commissions';
const TRANCHES = `${RACINE}/tranches`;

/** Droits lus à l'appel ; 403 si le rôle n'a pas l'écran. */
export function getDroitsCommission(): Promise<DroitsCommissionDto> {
  return request('GET', `${RACINE}/droits`);
}

export function getCommissionTranches(recherche?: string): Promise<CommissionTrancheDto[]> {
  return request('GET', TRANCHES, { query: { recherche } });
}

export function getCommissionTranche(trancheId: UUID): Promise<CommissionTrancheDto> {
  return request('GET', `${TRANCHES}/${trancheId}`);
}

export function getDossiersCommission(trancheId: UUID, filtres: FiltresCommission = {}): Promise<DossierCommissionDto[]> {
  return request('GET', `${TRANCHES}/${trancheId}/dossiers`, { query: { ...filtres } });
}

export function getLignesCommission(trancheId: UUID, filtres: FiltresCommission = {}): Promise<LigneCommissionCalculeeDto[]> {
  return request('GET', `${TRANCHES}/${trancheId}/lignes`, { query: { ...filtres } });
}

export function getFacturesCommission(trancheId: UUID): Promise<DocumentCommissionDto[]> {
  return request('GET', `${TRANCHES}/${trancheId}/factures`);
}

/** 400 (message OMRAN dans `detail`) si une finalisation n'est pas configurée dans la tranche : rien n'est écrit. */
export function genererCommissions(trancheId: UUID, body: { type: TypeCommission; dossierIds: UUID[] }): Promise<ResultatGenerationDto> {
  return request('POST', `${TRANCHES}/${trancheId}/generation`, { body });
}

/** 400 si le signe ne suit pas le type ou montant nul ; 409 si la ligne a un document à payer. */
export function modifierMontantCommission(ligneId: UUID, body: { montant: number }): Promise<LigneCommissionCalculeeDto> {
  return request('PUT', `${RACINE}/lignes/${ligneId}/montant`, { body });
}

/** Tout ou rien ; 409 si une ligne a un document à payer. */
export function supprimerCommissions(body: { ligneIds: UUID[] }): Promise<void> {
  return request('POST', `${RACINE}/lignes/suppression`, { body });
}

/** 409 si plusieurs personnes ou ligne déjà documentée ; 400 sans projet de facturation ou somme nulle. */
export function genererDocumentAPayer(body: { ligneIds: UUID[] }): Promise<DocumentCommissionDto> {
  return request('POST', `${RACINE}/documents-a-payer`, { body });
}

/** 404 « Cette ligne n'a pas encore un document à payer! » si la ligne n'en a pas. */
export function getDocumentDeLigne(ligneId: UUID): Promise<DocumentCommissionDto> {
  return request('GET', `${RACINE}/lignes/${ligneId}/document-a-payer`);
}

/** Chemin de l'export `.xlsx` (à passer à `BoutonExporter`) : lignes d'une tranche, ou liste des tranches. */
export function cheminExportCommissions(trancheId?: UUID): string {
  return trancheId ? `${TRANCHES}/${trancheId}/lignes/export` : `${TRANCHES}/export`;
}
