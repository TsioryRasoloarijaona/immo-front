// FEATURE-n7-etats-achat.md N7a : 401 sans session, 403 sans le droit OMRAN de l'écran, 400 sans période ou du > au.
import { request } from './api';
import type { EtatTvaDeductible, FiltresEtatsAchat, SuiviAvances, SuiviRetenues } from '../types/etatsAchat';

const ETATS = '/api/achat/etats';

export type EtatAchat = 'tva-deductible' | 'avances' | 'retenues-garantie';

export function getTvaDeductible(filtres: FiltresEtatsAchat): Promise<EtatTvaDeductible> {
  return request('GET', `${ETATS}/tva-deductible`, { query: { ...filtres } });
}

export function getSuiviAvances(filtres: FiltresEtatsAchat): Promise<SuiviAvances> {
  return request('GET', `${ETATS}/avances`, { query: { ...filtres } });
}

export function getSuiviRetenues(filtres: FiltresEtatsAchat): Promise<SuiviRetenues> {
  return request('GET', `${ETATS}/retenues-garantie`, { query: { ...filtres } });
}

/** Chemin de l'export `.xlsx` (mêmes filtres) ; avances / retenues exigent aussi le droit `.toolExport`. */
export function cheminExportEtatAchat(etat: EtatAchat): string {
  return `${ETATS}/${etat}/export`;
}
