import type { BadgeTone, Dossier, DerivedDossierStatus } from '../types';

// Omran's real Dossier statut is an 11-value fixed-order enum — not free text,
// not derivable from a single field in this export.
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

// 'Annulé'/'Désistement' are exits, not pipeline positions — see
// instructions/FEATURE-changement-statut.md. Kept as a separate union rather
// than appended to DOSSIER_STATUS_PIPELINE so the stepper can render them
// with distinct (non-linear) treatment.
export const DOSSIER_EXIT_STATUSES = ['Annulé', 'Désistement'] as const;

export type DossierStatus = (typeof DOSSIER_STATUS_PIPELINE)[number] | (typeof DOSSIER_EXIT_STATUSES)[number];

export function isExitStatus(label: string): label is (typeof DOSSIER_EXIT_STATUSES)[number] {
  return (DOSSIER_EXIT_STATUSES as readonly string[]).includes(label);
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

export function toneForStatus(label: string): BadgeTone {
  return TONE_BY_STATUS[label] ?? 'neutral';
}

// Which Dossier date field to auto-fill when a status is newly reached. Same
// mapping used both by the seed derivation below and by the interactive
// stepper (src/components/DossierStatusStepper.tsx) when confirming a
// transition. Meilleurtaux / Minute / Livraison provisoire have no
// corresponding date field in this data model — tracked by status alone.
export const MILESTONE_FIELD_BY_STATUS: Partial<Record<string, keyof Dossier>> = {
  'Réservation': 'reservationDate',
  'Concrétisation': 'agreementDate',
  'Compromis': 'agreementSavingDate',
  'Envoi au notaire': 'precisionActDate',
  'Crédit en cours': 'creditApprovalDate',
  'Crédit débloqué': 'creditPossessionDate',
  'Remise des clés': 'deliveryDateReal',
  'Formalisé': 'finalTitleDate',
};

// Valid next statuses per current status — see
// instructions/FEATURE-changement-statut.md. Only the transition out of
// 'Envoi au notaire' is confirmed by a real Omran screenshot (dossier APF
// 2023/00255): CONCRETISATION, COMPROMIS, MINUTE, ANNULATION, DESISTEMENT —
// notably *not* strictly forward-only. Every other status has no confirmed
// screenshot yet, so per the spec its fallback is "every other status" —
// deliberately permissive rather than guessing a business rule that hasn't
// been observed. Replace each entry with the real rule as screenshots
// confirm it; do not tighten this without a source.
function allOtherStatuses(current: DossierStatus): DossierStatus[] {
  const all: DossierStatus[] = [...DOSSIER_STATUS_PIPELINE, ...DOSSIER_EXIT_STATUSES];
  return all.filter((s) => s !== current);
}

const CONFIRMED_TRANSITIONS: Partial<Record<DossierStatus, DossierStatus[]>> = {
  'Envoi au notaire': ['Concrétisation', 'Compromis', 'Minute', 'Annulé', 'Désistement'],
};

export function validTransitionsFrom(current: string): DossierStatus[] {
  const known = CONFIRMED_TRANSITIONS[current as DossierStatus];
  if (known) return known;
  // Unconfirmed — temporary permissive fallback (see comment above).
  return allOtherStatuses(current as DossierStatus);
}

// One-time seed: derive a dossier's starting pipeline position from whichever
// milestone date fields are already populated in the source data (latest
// reached wins). Used only when the mock store initializes — after that,
// status lives in explicit mutable state (StoreProvider's statusLabel map),
// advanced solely via the status stepper, not re-derived from dates.
export function deriveInitialDossierStatus(dossier: Dossier): DerivedDossierStatus {
  if (dossier.cancelDate) return { label: 'Annulé', tone: 'warning' };
  if (dossier.finalTitleDate) return { label: 'Formalisé', tone: toneForStatus('Formalisé') };
  if (dossier.deliveryDateReal) return { label: 'Remise des clés', tone: toneForStatus('Remise des clés') };
  if (dossier.creditPossessionDate || dossier.bankRecordDate)
    return { label: 'Crédit débloqué', tone: toneForStatus('Crédit débloqué') };
  if (dossier.creditApprovalDate) return { label: 'Crédit en cours', tone: toneForStatus('Crédit en cours') };
  if (dossier.precisionActDate) return { label: 'Envoi au notaire', tone: toneForStatus('Envoi au notaire') };
  if (dossier.agreementSavingDate) return { label: 'Compromis', tone: toneForStatus('Compromis') };
  if (dossier.agreementDate) return { label: 'Concrétisation', tone: toneForStatus('Concrétisation') };
  return { label: 'Réservation', tone: toneForStatus('Réservation') };
}
