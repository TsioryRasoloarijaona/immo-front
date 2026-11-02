import type { FiltresActions } from '../types/administration';

export const TAILLE_PAGE_ACTIONS = 50;

export interface EtatFiltresActions {
  creationDebut: string;
  creationFin: string;
  modificationDebut: string;
  modificationFin: string;
  recherche: string;
}

export const FILTRES_ACTIONS_VIDES: EtatFiltresActions = {
  creationDebut: '',
  creationFin: '',
  modificationDebut: '',
  modificationFin: '',
  recherche: '',
};

/** Rien de choisi = tout : un filtre au repos n'est pas envoyé. */
export function versFiltresActions(f: EtatFiltresActions, page: number): FiltresActions {
  return {
    creationDebut: f.creationDebut || undefined,
    creationFin: f.creationFin || undefined,
    modificationDebut: f.modificationDebut || undefined,
    modificationFin: f.modificationFin || undefined,
    recherche: f.recherche.trim() || undefined,
    page,
    size: TAILLE_PAGE_ACTIONS,
  };
}
