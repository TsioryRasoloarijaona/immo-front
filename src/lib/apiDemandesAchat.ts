// Endpoints de FEATURE-n6-demandes-achat.md : 404 inconnue ou hors périmètre, 403 droit, 400 champ, 409 règle.
import { request } from './api';
import type { UUID } from '../types';
import type {
  DemandeAchatFiche,
  DemandeAchatLigne,
  ExecutionTransitionDemandeAchat,
  FiltresDemandesAchat,
  HistoriqueDemandeAchat,
  SaisieDemandeAchat,
  TransitionDemandeAchat,
} from '../types/demandesAchat';

const DEMANDES = '/api/achat/demandes-achat';

export function getDemandesAchat(filtres: FiltresDemandesAchat = {}): Promise<DemandeAchatLigne[]> {
  return request('GET', DEMANDES, { query: { ...filtres } });
}

/** Chemin de l'export `.xlsx` (mêmes filtres que la liste). */
export function cheminExportDemandesAchat(): string {
  return `${DEMANDES}/export`;
}

export function getDemandeAchat(id: UUID): Promise<DemandeAchatFiche> {
  return request('GET', `${DEMANDES}/${id}`);
}

export function creerDemandeAchat(body: SaisieDemandeAchat): Promise<DemandeAchatFiche> {
  return request('POST', DEMANDES, { body });
}

export function modifierDemandeAchat(id: UUID, body: SaisieDemandeAchat): Promise<DemandeAchatFiche> {
  return request('PUT', `${DEMANDES}/${id}`, { body });
}

export function supprimerDemandeAchat(id: UUID): Promise<void> {
  return request('DELETE', `${DEMANDES}/${id}`);
}

export function getTransitionsDemandeAchat(id: UUID): Promise<TransitionDemandeAchat[]> {
  return request('GET', `${DEMANDES}/${id}/transitions`);
}

/** 409 : corps avec `transitionsAutorisees` ; renvoie la fiche relue. */
export function executerTransitionDemandeAchat(id: UUID, body: ExecutionTransitionDemandeAchat): Promise<DemandeAchatFiche> {
  return request('POST', `${DEMANDES}/${id}/transitions`, { body });
}

export function getHistoriqueDemandeAchat(id: UUID): Promise<HistoriqueDemandeAchat[]> {
  return request('GET', `${DEMANDES}/${id}/historique`);
}
