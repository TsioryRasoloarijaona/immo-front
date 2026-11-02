import type { BadgeTone } from '../types';
import type { EtatSession, FiltresSessions } from '../types/administration';

export const TAILLE_PAGE_SESSIONS = 50;

export const LIBELLE_ETAT_SESSION: Record<EtatSession, string> = {
  OUVERTE: 'Ouverte',
  FERMEE: 'Fermée',
  VERROUILLEE: 'Verrouillée',
};

export const TON_ETAT_SESSION: Record<EtatSession, BadgeTone> = {
  OUVERTE: 'success',
  FERMEE: 'neutral',
  VERROUILLEE: 'warning',
};

export type EtatOuverte = 'tous' | 'oui' | 'non';

export interface EtatFiltresSessions {
  debut: string;
  fin: string;
  utilisateur: string;
  ouverte: EtatOuverte;
  ip: string;
}

export const FILTRES_SESSIONS_VIDES: EtatFiltresSessions = { debut: '', fin: '', utilisateur: 'tous', ouverte: 'tous', ip: '' };

/** Rien de choisi = tout : un filtre au repos n'est pas envoyé. */
export function versFiltresSessions(f: EtatFiltresSessions, page: number): FiltresSessions {
  return {
    dateDebut: f.debut || undefined,
    dateFin: f.fin || undefined,
    utilisateur: f.utilisateur === 'tous' ? undefined : f.utilisateur,
    ip: f.ip.trim() || undefined,
    ouverte: f.ouverte === 'tous' ? undefined : f.ouverte === 'oui',
    page,
    size: TAILLE_PAGE_SESSIONS,
  };
}
