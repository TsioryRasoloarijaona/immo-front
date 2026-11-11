// Endpoints de FEATURE-achat-regle-commune.md §4.1 : configuration Achat en lecture seule, tout compte connecté.
import { request } from './api';
import type { StatutAchatConfigDto, TransitionAchatDto } from '../types/achatConfig';

const RACINE = '/api/achat/config';

export function listStatutsAchat(): Promise<StatutAchatConfigDto[]> {
  return request('GET', `${RACINE}/statuts`);
}

/** `utilisees` = seulement les transitions déjà empruntées (nombrePassages > 0). */
export function listTransitionsAchat(utilisees = false): Promise<TransitionAchatDto[]> {
  return request('GET', `${RACINE}/transitions`, { query: { utilisees } });
}
