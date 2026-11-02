import type { BadgeTone } from '../types';
import { formatNumber } from './format';
import type { EtatFicheVerrouillee, FiltresFichesVerrouillees } from '../types/administration';

export const TAILLE_PAGE_FICHES = 50;

export const LIBELLE_ETAT_FICHE: Record<EtatFicheVerrouillee, string> = {
  VERROUILLEE: 'Verrouillée',
  NON_VERROUILLEE: 'Non verrouillée',
};

export const TON_ETAT_FICHE: Record<EtatFicheVerrouillee, BadgeTone> = {
  VERROUILLEE: 'warning',
  NON_VERROUILLEE: 'neutral',
};

export type EtatFiltreFiche = 'tous' | EtatFicheVerrouillee;

export interface EtatFiltresFiches {
  debut: string;
  fin: string;
  etat: EtatFiltreFiche;
  recherche: string;
}

export const FILTRES_FICHES_VIDES: EtatFiltresFiches = { debut: '', fin: '', etat: 'tous', recherche: '' };

/** Rien de choisi = tout : un filtre au repos n'est pas envoyé. */
export function versFiltresFichesVerrouillees(f: EtatFiltresFiches, page: number): FiltresFichesVerrouillees {
  return {
    etat: f.etat === 'tous' ? undefined : f.etat,
    dateDebut: f.debut || undefined,
    dateFin: f.fin || undefined,
    recherche: f.recherche.trim() || undefined,
    page,
    size: TAILLE_PAGE_FICHES,
  };
}

export function messageDeverrouillage(nombre: number): string {
  if (nombre === 0) return 'Aucune fiche à déverrouiller';
  return nombre === 1 ? '1 fiche déverrouillée' : `${formatNumber(nombre)} fiches déverrouillées`;
}
