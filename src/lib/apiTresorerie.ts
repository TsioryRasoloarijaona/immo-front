// Endpoints de FEATURE-n3-recettes-depenses.md : trésorerie Projet / Achat, en lecture.
import { request } from './api';
import type { UUID } from '../types';
import type {
  AffectationLigneDto,
  CodeFeuilleDto,
  DecaissementFicheDto,
  DecaissementLigneDto,
  FiltresTresorerie,
  ListeTresorerieDto,
  ModuleTresorerie,
  PieceAAffecterDto,
  RecettesDto,
  ReferentielsDecaissementDto,
  SaisieDecaissementDto,
  SensTresorerie,
  TotauxAffectationsDto,
  TotauxDecaissementsDto,
  VueRecette,
} from '../types/tresorerie';

const RACINE = '/api/tresorerie';

export function getDecaissements(
  filtres: FiltresTresorerie,
): Promise<ListeTresorerieDto<DecaissementLigneDto, TotauxDecaissementsDto>> {
  return request('GET', `${RACINE}/decaissements`, { query: { ...filtres } });
}

/** 404 si le décaissement est inconnu ou invisible. */
export function getDecaissement(id: UUID): Promise<DecaissementFicheDto> {
  return request('GET', `${RACINE}/decaissements/${id}`);
}

export function getAffectations(
  sens: SensTresorerie,
  filtres: FiltresTresorerie,
): Promise<ListeTresorerieDto<AffectationLigneDto, TotauxAffectationsDto>> {
  return request('GET', `${RACINE}/affectations`, { query: { ...filtres, sens } });
}

// Saisie (FEATURE-n3bis-saisie-reglements.md) : 400 / 409 portent le message OMRAN dans ApiError.
export function creerDecaissement(saisie: SaisieDecaissementDto): Promise<DecaissementFicheDto> {
  return request('POST', `${RACINE}/decaissements`, { body: saisie });
}

export function modifierDecaissement(id: UUID, saisie: SaisieDecaissementDto): Promise<DecaissementFicheDto> {
  return request('PUT', `${RACINE}/decaissements/${id}`, { body: saisie });
}

export function supprimerDecaissement(id: UUID): Promise<void> {
  return request('DELETE', `${RACINE}/decaissements/${id}`);
}

export function lireReferentielsDecaissement(module: ModuleTresorerie): Promise<ReferentielsDecaissementDto> {
  return request('GET', `${RACINE}/decaissements/referentiels`, { query: { module } });
}

/** `reglementId` : en modification, ses propres lignes ne comptent pas dans le réglé. */
export function listerPiecesAAffecter(
  module: ModuleTresorerie,
  fournisseurId: UUID,
  societeId: UUID,
  reglementId?: UUID,
): Promise<PieceAAffecterDto[]> {
  return request('GET', `${RACINE}/decaissements/pieces-a-affecter`, {
    query: { module, fournisseurId, societeId, reglementId },
  });
}

// FEATURE-n3bis-b1-reglements.md : saisies préremplies, non enregistrées (le POST existant enregistre).
/** 400 : pièce non validée pour paiement ; 404 : pièce inconnue ou invisible. */
export function proposerDecaissement(pieceId: UUID): Promise<SaisieDecaissementDto> {
  return request('GET', `${RACINE}/decaissements/proposition`, { query: { pieceId } });
}

/** Copie sans référence, codes ni lignes ; 404 si le règlement est invisible. */
export function copierDecaissement(id: UUID): Promise<SaisieDecaissementDto> {
  return request('GET', `${RACINE}/decaissements/${id}/copie`);
}

// FEATURE-n3bis-b2a-retenue.md : n'enregistrent pas la fiche ; 409 si la séquence manque.
export function genererCodeFeuillePaiement(id: UUID): Promise<CodeFeuilleDto> {
  return request('POST', `${RACINE}/decaissements/${id}/code-feuille-paiement`);
}

export function genererCodeFeuilleRs(id: UUID): Promise<CodeFeuilleDto> {
  return request('POST', `${RACINE}/decaissements/${id}/code-feuille-rs`);
}

export function getRecettes(vue: VueRecette, filtres: FiltresTresorerie): Promise<RecettesDto> {
  return request('GET', `${RACINE}/recettes/${vue}`, { query: { ...filtres } });
}
