import type { BadgeTone } from '../types';

// Le `statut` serveur ne suit pas la casse/les accents de ces libellés
// (« CONCRETISATION ») : toute comparaison passe par `normalizeStatus`.
export const DOSSIER_STATUS_PIPELINE = [
  'Réservation',
  'Concrétisation',
  'Meilleurtaux',
  'Compromis',
  'Envoi au notaire',
  'Crédit en cours',
  'Crédit débloqué',
  'Minute',
  'Remise des clés',
  'Formalisé',
  'Livraison provisoire',
] as const;

export const DOSSIER_EXIT_STATUSES = ['Annulé', 'Désistement'] as const;

/** Code API (`StrStatus.Code`) de chaque sortie : « Annulé » ne se normalise pas en `ANNULATION`. */
export const CODE_SORTIE: Record<(typeof DOSSIER_EXIT_STATUSES)[number], string> = {
  'Annulé': 'ANNULATION',
  'Désistement': 'DESISTEMENT',
};

/** Accepte libellé et code brut `StrStatus.Code` : « Annulé » se code `ANNULATION`,
 * la normalisation ne les rejoint pas. Le serveur exclut ces statuts de ses
 * agrégats ; le tableau de bord doit faire de même. */
export function estStatutSortie(raw: string | undefined | null): boolean {
  const n = normalizeStatus(raw);
  return n === 'ANNULATION' || n === 'ANNULE' || n === 'DESISTEMENT';
}

const ALL_STATUSES = [...DOSSIER_STATUS_PIPELINE, ...DOSSIER_EXIT_STATUSES];

export function normalizeStatus(label: string | undefined | null): string {
  return (label ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
}

const CANONICAL_BY_NORMALIZED: Record<string, string> = Object.fromEntries(
  ALL_STATUSES.map((label) => [normalizeStatus(label), label]),
);

export function canonicalStatusLabel(raw: string | undefined | null): string {
  if (!raw) return '';
  return CANONICAL_BY_NORMALIZED[normalizeStatus(raw)] ?? raw;
}

const TONE_BY_STATUS: Record<string, BadgeTone> = {
  'Réservation': 'neutral',
  'Concrétisation': 'info',
  'Meilleurtaux': 'info',
  'Compromis': 'progress',
  'Envoi au notaire': 'progress',
  'Crédit en cours': 'progress',
  'Crédit débloqué': 'progress',
  'Minute': 'progress',
  'Remise des clés': 'success',
  'Formalisé': 'success',
  'Livraison provisoire': 'success',
  'Annulé': 'warning',
  'Désistement': 'warning',
};

export function toneForStatus(label: string | undefined): BadgeTone {
  return TONE_BY_STATUS[canonicalStatusLabel(label)] ?? 'neutral';
}
