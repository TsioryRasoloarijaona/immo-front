// Endpoints de FEATURE-n5-tableaux-de-bord-projet.md : Trésorerie et Bilans projet, en lecture.
// Aucun projet habilité demandé = 400 « Veuillez sélectionner au moins un projet ! » : ne pas appeler sans projet.
import { request } from './api';
import { exporterListe } from './export';
import type {
  BilanProjetDto, FiltresBilansProjet, FiltresTresorerieProjet, LigneCelluleTresorerieDto, TresorerieProjetDto,
} from '../types/projetTdb';

const TRESORERIE = '/api/projet/tresorerie';
const BILANS = '/api/projet/bilans';

export function getTresorerieProjet(filtres: FiltresTresorerieProjet): Promise<TresorerieProjetDto> {
  return request('GET', TRESORERIE, { query: { ...filtres } });
}

/** Lignes sources d'une cellule ; `mois` de 1 à 12, `noeud` = `cle` du nœud. */
export function getCelluleTresorerieProjet(filtres: FiltresTresorerieProjet, mois: number,
  noeud: string): Promise<LigneCelluleTresorerieDto[]> {
  return request('GET', `${TRESORERIE}/cellule`, { query: { ...filtres, mois, noeud } });
}

export function exporterTresorerieProjet(filtres: FiltresTresorerieProjet): Promise<void> {
  return exporterListe(`${TRESORERIE}/export`, { ...filtres }, 'tresorerie-projet');
}

export function getBilansProjet(filtres: FiltresBilansProjet): Promise<BilanProjetDto> {
  return request('GET', BILANS, { query: { ...filtres } });
}

export function exporterBilansProjet(filtres: FiltresBilansProjet): Promise<void> {
  return exporterListe(`${BILANS}/export`, { ...filtres }, 'bilans-projet');
}
