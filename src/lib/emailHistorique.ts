import type { FiltresEmail } from '../types/administration';

export const TAILLE_PAGE_EMAILS = 50;

export function libelleOuiNon(v: boolean | null): string {
  if (v === null) return '—';
  return v ? 'Oui' : 'Non';
}

export type EtatEnvoi = 'tous' | 'oui' | 'non';

export interface EtatFiltresEmail {
  debut: string;
  fin: string;
  texte: string;
  utilisateur: string;
  envoye: EtatEnvoi;
}

export const FILTRES_EMAIL_VIDES: EtatFiltresEmail = { debut: '', fin: '', texte: '', utilisateur: 'tous', envoye: 'tous' };

/** Rien de coché = tout : un filtre au repos n'est pas envoyé. */
export function versFiltresEmail(f: EtatFiltresEmail, page: number): FiltresEmail {
  return {
    dateDebut: f.debut || undefined,
    dateFin: f.fin || undefined,
    texte: f.texte.trim() || undefined,
    utilisateur: f.utilisateur === 'tous' ? undefined : f.utilisateur,
    envoye: f.envoye === 'tous' ? undefined : f.envoye === 'oui',
    page,
    size: TAILLE_PAGE_EMAILS,
  };
}
