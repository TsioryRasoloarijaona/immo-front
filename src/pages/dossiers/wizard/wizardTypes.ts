import type { ArticleRef, EcheancierLine, Person } from '../../../types';

// Assistant multi-étapes de création de dossier :
// Acheteur(s) → Lot(s) → Prix/remise → Échéancier → Récapitulatif
// "Plan de financement" and "Échéancier" were originally spec'd as two
// separate steps (instructions/FEATURE-plan-financement.md) but the real
// screen showed they're one and the same — merged per
// instructions/FIX-dossier-vente-corrections.md §3.

export const WIZARD_STEPS = [
  { key: 'acheteur', label: 'Acheteur(s)' },
  { key: 'lots', label: 'Lot(s)' },
  { key: 'prix', label: 'Prix/remise' },
  { key: 'echeancier', label: 'Échéancier' },
  { key: 'recap', label: 'Récapitulatif' },
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number]['key'];

export interface WizardState {
  client: Person;
  lots: ArticleRef[];
  priceBeforeDiscount: number;
  /** Ratio 0–1 (e.g. 0.05 = 5%), not a percentage integer. */
  discount: number;
  /** True once the user edited the price directly — stops it from being
   * re-synced to the sum of selected lots' sale prices. */
  priceTouched: boolean;
  echeancier: EcheancierLine[];
  /** True once the user has manually added/edited/removed a line — blocks
   * the automatic default-generation from overwriting their work. */
  echeancierTouched: boolean;
  /** True once the default échéancier has been generated at least once —
   * gates the "generate on step entry" behaviour to a single run. */
  echeancierInitialized: boolean;
}

export function priceAfterDiscount(state: Pick<WizardState, 'priceBeforeDiscount' | 'discount'>): number {
  const amount = state.priceBeforeDiscount * state.discount;
  return Math.round((state.priceBeforeDiscount - amount + Number.EPSILON) * 100) / 100;
}

export function discountAmount(state: Pick<WizardState, 'priceBeforeDiscount' | 'discount'>): number {
  return Math.round((state.priceBeforeDiscount * state.discount + Number.EPSILON) * 100) / 100;
}
