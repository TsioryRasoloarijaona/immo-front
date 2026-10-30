// Endpoints de FEATURE-admin-historique.md : journal des actions, réservé à l'Administrateur (403 sinon).
import { request } from './api';
import type { PageDto } from '../types';
import type { FiltresHistorique, LigneHistoriqueDto } from '../types/historique';

const RACINE = '/api/administration/historique';

/** 400 si `dateDebut` suit `dateFin`, ou `size` hors de 1..200. */
export function listHistorique(
  filtres: FiltresHistorique & { page?: number; size?: number } = {},
): Promise<PageDto<LigneHistoriqueDto>> {
  return request('GET', RACINE, { query: { ...filtres } });
}

export function listUtilisateursHistorique(dateDebut?: string, dateFin?: string): Promise<string[]> {
  return request('GET', `${RACINE}/utilisateurs`, { query: { dateDebut, dateFin } });
}
