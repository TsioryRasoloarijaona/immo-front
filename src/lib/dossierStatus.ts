import type { BadgeTone } from '../types';

// The Dossier's statut is now computed server-side (DossierDetailDto.statut)
// and valid next statuses come straight from the API
// (GET /statut/etapes-suivantes) — nothing here derives status from dates
// anymore. This file only keeps the display order (for the stepper) and the
// tone-per-status mapping, both purely presentational.
//
// The backend's `statut` string doesn't reliably match this pipeline's
// casing/accents (seen in the wild: "CONCRETISATION" vs "Concrétisation") —
// every lookup below goes through `normalizeStatus` first so the stepper
// still recognizes the current step and reachable targets regardless of how
// the API happens to format the string.
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

/** Sorti du parcours — annulation ou désistement.
 *
 * Distinct de `DOSSIER_EXIT_STATUSES`, qui porte les **libellés** affichés, là
 * où les agrégats serveur (`DashboardDto.dossiersParEtape`) et le filtre
 * `?statut=` portent le **code brut** de `StrStatus.Code`. Les deux formes ne
 * se rejoignent pas par normalisation : « Annulé » se code `ANNULATION`, et
 * `normalizeStatus` rend `ANNULE` d'un côté, `ANNULATION` de l'autre. D'où les
 * trois formes admises ici.
 *
 * Pourquoi c'est nécessaire : le tableau de bord sommait **tout**
 * `dossiersParEtape` et annonçait 116 « dossiers actifs », dont 15 annulés et
 * 5 désistés. Le serveur, lui, les exclut — son `panierMoyen` divise par 96,
 * pas par 116 (vérifié : 96 289 349,997 / 96 = 1 003 014,06, la valeur
 * servie). L'écran contredisait donc l'agrégat qu'il affichait juste à
 * côté. */
export function estStatutSortie(raw: string | undefined | null): boolean {
  const n = normalizeStatus(raw);
  return n === 'ANNULATION' || n === 'ANNULE' || n === 'DESISTEMENT';
}

const ALL_STATUSES = [...DOSSIER_STATUS_PIPELINE, ...DOSSIER_EXIT_STATUSES];

export function normalizeStatus(label: string | undefined | null): string {
  return (label ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip combining accents left by NFD
    .replace(/[^a-zA-Z0-9]/g, '') // strip spaces/punctuation
    .toUpperCase();
}

const CANONICAL_BY_NORMALIZED: Record<string, string> = Object.fromEntries(
  ALL_STATUSES.map((label) => [normalizeStatus(label), label]),
);

/** Maps a raw API statut string onto this pipeline's canonical display
 * label (accents, casing) when recognized; otherwise returns it unchanged. */
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
