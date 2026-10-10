import type { BadgeTone } from '../../../types';
import type { ModePaiement, Pastille, RaisonAppel } from './types';

/** Libellés repris de syndic-admod (glossaire : « reste à payer », jamais « solde »). */
export const PASTILLE: Record<Pastille, { libelle: string; ton: BadgeTone }> = {
  A_JOUR: { libelle: 'À jour', ton: 'success' },
  AVANCE: { libelle: 'A payé d’avance', ton: 'info' },
  PARTIEL: { libelle: 'A payé une partie', ton: 'amber' },
  EN_RETARD: { libelle: 'En retard', ton: 'warning' },
  PAS_ENCORE_DU: { libelle: 'Pas encore dû', ton: 'neutral' },
};

export const MODE_PAIEMENT: Record<ModePaiement, string> = {
  VIREMENT: 'Virement',
  CHEQUE: 'Chèque',
  ESPECES: 'Espèces',
};

export const MODE_ITEMS = (Object.keys(MODE_PAIEMENT) as ModePaiement[]).map((m) => ({ value: m, label: MODE_PAIEMENT[m] }));

export const RAISON_APPEL: Record<RaisonAppel, { libelle: string; ton: BadgeTone }> = {
  PROMESSE: { libelle: 'Promesse non tenue', ton: 'warning' },
  RETARD: { libelle: 'En retard', ton: 'amber' },
  BIENTOT: { libelle: 'Bientôt dû', ton: 'info' },
};

/** Recherche sans accents ni casse. */
export const sansAccents = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** « 8400 », « 8 400,50 » → nombre de dirhams, ou null. Le service refait le contrôle (deux décimales). */
export function montantSaisi(v: string): number | null {
  const n = Number(v.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}
