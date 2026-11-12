// Configuration Achat (FEATURE-achat-regle-commune.md §4.1, FEATURE-statuts-achat-parite.md) : lecture pour tout compte
// connecté, écriture sous le droit Yes.Buy.Front.Config.BuyDocumentStatus.
import { API_BASE_URL, request } from './api';
import type { UUID } from '../types';
import type {
  CatalogueChampsStatutDto,
  ImageStatutDto,
  StatutAchatConfigDto,
  StatutAchatEcritureDto,
  TransitionAchatDto,
  TransitionAchatEcritureDto,
  TypeAchatDto,
} from '../types/achatConfig';

const RACINE = '/api/achat/config';

export function listStatutsAchat(): Promise<StatutAchatConfigDto[]> {
  return request('GET', `${RACINE}/statuts`);
}

/** `utilisees` = seulement les transitions déjà empruntées (nombrePassages > 0). */
export function listTransitionsAchat(utilisees = false): Promise<TransitionAchatDto[]> {
  return request('GET', `${RACINE}/transitions`, { query: { utilisees } });
}

export function getTypesStatutAchat(): Promise<TypeAchatDto[]> {
  return request('GET', `${RACINE}/statuts/types`);
}

export function getTypesDocumentsStatutAchat(): Promise<TypeAchatDto[]> {
  return request('GET', `${RACINE}/statuts/types-documents`);
}

export function getChampsObligatoiresStatutAchat(): Promise<CatalogueChampsStatutDto> {
  return request('GET', `${RACINE}/statuts/champs-obligatoires`);
}

export function getImagesStatutAchat(): Promise<ImageStatutDto[]> {
  return request('GET', `${RACINE}/images`);
}

/** Pour un `<img src>` : octets de l'image de la bibliothèque. */
export function urlImageStatut(id: UUID): string {
  return `${API_BASE_URL}${RACINE}/images/${id}/contenu`;
}

export function creerStatutAchat(corps: StatutAchatEcritureDto): Promise<StatutAchatConfigDto> {
  return request('POST', `${RACINE}/statuts`, { body: corps });
}

export function modifierStatutAchat(id: UUID, corps: StatutAchatEcritureDto): Promise<StatutAchatConfigDto> {
  return request('PUT', `${RACINE}/statuts/${id}`, { body: corps });
}

/** 409 si le statut est cité par des pièces, transitions ou historiques. */
export function supprimerStatutAchat(id: UUID): Promise<void> {
  return request('DELETE', `${RACINE}/statuts/${id}`);
}

export function creerTransitionAchat(corps: TransitionAchatEcritureDto): Promise<TransitionAchatDto> {
  return request('POST', `${RACINE}/transitions`, { body: corps });
}

export function modifierTransitionAchat(id: UUID, corps: TransitionAchatEcritureDto): Promise<TransitionAchatDto> {
  return request('PUT', `${RACINE}/transitions/${id}`, { body: corps });
}

export function supprimerTransitionAchat(id: UUID): Promise<void> {
  return request('DELETE', `${RACINE}/transitions/${id}`);
}
