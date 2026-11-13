// Endpoints de FEATURE-projet-lots-decomptes.md §2.1 : lots et décomptes (lecture). Hors périmètre = 404 comme un id inconnu.
import { request, withPageable } from './api';
import type { PageDto, Pageable, UUID } from '../types';
import type {
  AvancesLotDto,
  AvenantLotDto,
  AvoirLotDto,
  BordereauDto,
  BordereauEstimatifDto,
  BordereauSaisieDto,
  PrevisionsLotDto,
  RemboursementsLotDto,
  CreerLotRequest,
  DecompteDetailDto,
  DemandeAchatLotDto,
  ExecutionTransitionLotDto,
  DecompteListItemDto,
  EnregistrerDecompteRequest,
  FiltresDecomptes,
  FiltresLots,
  LigneDecompteRechargee,
  LotDetailDto,
  LotListItemDto,
  ModifierLotRequest,
  ReferentielsProjetDto,
  SuiviLotDto,
  TotauxDecomptesDto,
  TotauxLotsDto,
  TransitionLotDto,
} from '../types/projet';

const RACINE = '/api/projet';
const LOTS = `${RACINE}/lots`;
const DECOMPTES = `${RACINE}/decomptes`;

export function getReferentielsProjet(): Promise<ReferentielsProjetDto> {
  return request('GET', `${RACINE}/referentiels`);
}

export function listLots(filtres: FiltresLots = {}, pageable?: Pageable): Promise<PageDto<LotListItemDto>> {
  return request('GET', LOTS, { query: withPageable({ ...filtres }, pageable) });
}

// FEATURE-lots-liste-parite.md : totaux, export, création, suppression, transitions (403 droit OMRAN, 409 lot cité).
export function getTotauxLots(filtres: FiltresLots = {}): Promise<TotauxLotsDto> {
  return request('GET', `${LOTS}/totaux`, { query: { ...filtres } });
}

/** Chemin de l'export xlsx, pour `useExportListe` (mêmes filtres + `sort`). */
export const EXPORT_LOTS = `${LOTS}/export`;

export function creerLot(corps: CreerLotRequest): Promise<LotDetailDto> {
  return request('POST', LOTS, { body: corps });
}

export function supprimerLot(id: UUID): Promise<void> {
  return request('DELETE', `${LOTS}/${id}`);
}

export function getTransitionsLot(id: UUID): Promise<TransitionLotDto[]> {
  return request('GET', `${LOTS}/${id}/transitions`);
}

export function executerTransitionLot(id: UUID, corps: ExecutionTransitionLotDto): Promise<LotListItemDto> {
  return request('POST', `${LOTS}/${id}/transition`, { body: corps });
}

export function getLot(id: UUID): Promise<LotDetailDto> {
  return request('GET', `${LOTS}/${id}`);
}

// FEATURE-lot-fiche-parite.md : enregistrer la fiche (404 → 403 → 409 → 400), copier, demandes d'achat.
export function modifierLot(id: UUID, corps: Partial<ModifierLotRequest>): Promise<LotDetailDto> {
  return request('PATCH', `${LOTS}/${id}`, { body: corps });
}

export function copierLot(id: UUID): Promise<LotDetailDto> {
  return request('POST', `${LOTS}/${id}/copie`);
}

export function getDemandesAchatLot(id: UUID): Promise<DemandeAchatLotDto[]> {
  return request('GET', `${LOTS}/${id}/demandes-achat`);
}

/** Onglets Suivi et Retenues de la fiche lot (FEATURE-lot-fiche-suivi.md E3-E4) ; 404 si le lot est invisible. */
export function getSuiviLot(id: UUID): Promise<SuiviLotDto> {
  return request('GET', `${LOTS}/${id}/suivi`);
}

export function getBordereauLot(id: UUID): Promise<BordereauDto> {
  return request('GET', `${LOTS}/${id}/bordereau`);
}

// FEATURE-lot-sous-fenetres.md §4 : sous-fenêtres en lecture ; 404 si le lot est invisible.
export function getBordereauEstimatifLot(id: UUID): Promise<BordereauEstimatifDto> {
  return request('GET', `${LOTS}/${id}/bordereau-estimatif`);
}

// FEATURE-lot-ecritures.md §4 : bordereau entier, relu après écriture (404 → 403 → 409 cadenas → 400 → 409 décompté).
// Les deux @public tant que les écrans du lot front ne les appellent pas (knip) : à retirer avec eux.
/** @public */
export function putBordereauLot(id: UUID, corps: BordereauSaisieDto): Promise<BordereauDto> {
  return request('PUT', `${LOTS}/${id}/bordereau`, { body: corps });
}

/** @public */
export function putBordereauEstimatifLot(id: UUID, corps: BordereauSaisieDto): Promise<BordereauEstimatifDto> {
  return request('PUT', `${LOTS}/${id}/bordereau-estimatif`, { body: corps });
}

export function getAvancesLot(id: UUID): Promise<AvancesLotDto> {
  return request('GET', `${LOTS}/${id}/avances`);
}

export function getAvoirsLot(id: UUID): Promise<AvoirLotDto[]> {
  return request('GET', `${LOTS}/${id}/avoirs`);
}

export function getAvenantsLot(id: UUID): Promise<AvenantLotDto[]> {
  return request('GET', `${LOTS}/${id}/avenants`);
}

export function getRemboursementsLot(id: UUID): Promise<RemboursementsLotDto> {
  return request('GET', `${LOTS}/${id}/remboursements`);
}

export function getPrevisionsLot(id: UUID): Promise<PrevisionsLotDto> {
  return request('GET', `${LOTS}/${id}/previsions`);
}

export function getDecomptesLot(id: UUID): Promise<DecompteListItemDto[]> {
  return request('GET', `${LOTS}/${id}/decomptes`);
}

export function listDecomptes(filtres: FiltresDecomptes = {}, pageable?: Pageable): Promise<PageDto<DecompteListItemDto>> {
  return request('GET', DECOMPTES, { query: withPageable({ ...filtres }, pageable) });
}

export function getDecompte(id: UUID): Promise<DecompteDetailDto> {
  return request('GET', `${DECOMPTES}/${id}`);
}

// FEATURE-decomptes-parite.md : totaux, export, écritures (403 droit OMRAN manquant, 409 verrouillé).
export function getTotauxDecomptes(filtres: FiltresDecomptes = {}): Promise<TotauxDecomptesDto> {
  return request('GET', `${DECOMPTES}/totaux`, { query: { ...filtres } });
}

/** Chemin de l'export xlsx, pour `useExportListe` (mêmes filtres + `sort`). */
export const EXPORT_DECOMPTES = `${DECOMPTES}/export`;

export function creerDecompte(lotId: UUID, dateDocument: string): Promise<DecompteDetailDto> {
  return request('POST', `${LOTS}/${lotId}/decomptes`, { body: { dateDocument } });
}

export function enregistrerDecompte(id: UUID, demande: EnregistrerDecompteRequest): Promise<DecompteDetailDto> {
  return request('PUT', `${DECOMPTES}/${id}`, { body: demande });
}

export function definirDernierDecompte(id: UUID): Promise<DecompteDetailDto> {
  return request('POST', `${DECOMPTES}/${id}/dernier`);
}

/** « Recharger les cumuls » : relit la quantité antérieure de chaque ligne, écrit, renvoie la fiche. */
export function rechargerCumulsDecompte(id: UUID): Promise<DecompteDetailDto> {
  return request('POST', `${DECOMPTES}/${id}/cumuls`);
}

export function recalculerDecompte(id: UUID): Promise<DecompteDetailDto> {
  return request('POST', `${DECOMPTES}/${id}/recalcul`);
}

export function supprimerDecompte(id: UUID): Promise<void> {
  return request('DELETE', `${DECOMPTES}/${id}`);
}

/** Aperçu sans écriture : à renvoyer tel quel dans `lignes` du PUT pour l'appliquer. */
export function getLignesRechargeesDecompte(id: UUID, date?: string): Promise<LigneDecompteRechargee[]> {
  return request('GET', `${DECOMPTES}/${id}/lignes-rechargees`, { query: { date } });
}
