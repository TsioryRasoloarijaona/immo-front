import type { EcheancierLine, EcheancierPayment, Prospection } from '../types';
import { todayISO } from './format';

// Échéancier — what was originally spec'd as two separate wizard steps
// ("Plan de financement" for the source of funds, then "Échéancier" for the
// call-up schedule) turned out on the real screen to be one and the same:
// each category line carries its own montant/réglé/reste settlement
// tracking directly. See instructions/FIX-dossier-vente-corrections.md §3
// (supersedes the two-step split in instructions/FEATURE-plan-financement.md).

/** Reference table of financing categories — structured as {code,label} like
 * the app's other lookup lists (prospectionOrigins, prospectionClosingReasons…)
 * rather than hard-coded strings in a <select>, so a real backend can later
 * swap this static array for an editable reference table without touching
 * the components that consume it.
 *
 * Real list observed on the Omran écran Montants — see
 * instructions/FIX-dossier-vente-corrections.md §4. Replaces the earlier
 * guessed AVANCE/AUTO_FINANCEMENT/PRET_BANCAIRE/FRAIS_SYNDIC list;
 * PRET_BANCAIRE becomes CREDIT. */
export const FINANCING_CATEGORIES: { code: string; label: string }[] = [
  { code: 'FRAIS', label: 'Frais' },
  { code: 'MODIFICATIONS', label: 'Modifications' },
  { code: 'PRIX_DE_VENTE', label: 'Prix de vente' },
  { code: 'AVANCE', label: 'Avance' },
  { code: 'CREDIT', label: 'Crédit' },
  { code: 'LOYERS', label: 'Loyers' },
  { code: 'AUTO_FINANCEMENT', label: 'Autofinancement' },
  { code: 'PENALITE', label: 'Pénalité' },
  { code: 'RESILIATION', label: 'Résiliation' },
];

/** Categories treated as a direct share of the sale price — the ones the
 * wizard's "must sum to the target price" gate applies to. Only
 * AVANCE/AUTO_FINANCEMENT/CREDIT were confirmed as summing exactly to the
 * prix TTC on the one real example available (Avance + Autofinancement =
 * prix TTC exact). The rest of the new référentiel (FRAIS, MODIFICATIONS,
 * PRIX_DE_VENTE, LOYERS, PENALITE, RESILIATION) reads as annex/adjustment
 * categories rather than funding sources, but that split is inferred from
 * the category names, not from a screenshot — correct this once a real
 * échéancier screen confirms which categories actually gate the total. */
const CORE_FINANCING_CATEGORY_CODES = new Set(['AVANCE', 'AUTO_FINANCEMENT', 'CREDIT']);

export function financingCategoryLabel(code: string): string {
  return FINANCING_CATEGORIES.find((c) => c.code === code)?.label ?? code;
}

export function isCoreFinancingCategory(code: string): boolean {
  return CORE_FINANCING_CATEGORY_CODES.has(code);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type FinancingSignal = 'fonds_propres' | 'credit';

/** Whether the prospect signalled paying entirely from own funds, or
 * (partially or wholly) via bank credit — captured at the Prospection stage
 * in fundingOwnBase/fundingCredit. Absent/ambiguous signal defaults to
 * "credit" per the observed Omran behaviour. */
export function deriveFinancingSignal(
  p: Pick<Prospection, 'fundingOwnBase' | 'fundingCredit' | 'fundingOther'>,
): FinancingSignal {
  const ownOnly = (p.fundingOwnBase ?? 0) > 0 && (p.fundingCredit ?? 0) <= 0;
  return ownOnly ? 'fonds_propres' : 'credit';
}

export interface SyndicDefault {
  /** Monthly condo-fee amount (Tranche.rules.syndicAmount). */
  monthlyAmount: number;
  /** Number of months it's charged for (Tranche.rules.syndicPeriod). */
  months: number;
}

function newLine(categorie: string, montant: number, date: string, notes: string): EcheancierLine {
  return { id: crypto.randomUUID(), categorie, montant: round2(montant), date, notes, payments: [] };
}

/** Pre-fills a default échéancier the way Omran does on entering the step,
 * rather than leaving an empty table. Never called again once the user has
 * edited a line — see `echeancierTouched` in the wizard state. */
export function generateDefaultEcheancier(
  targetPrice: number,
  signal: FinancingSignal,
  syndic: SyndicDefault | null,
): EcheancierLine[] {
  const today = todayISO();
  const lines: EcheancierLine[] = [];

  if (signal === 'fonds_propres') {
    lines.push(newLine('AUTO_FINANCEMENT', targetPrice, today, ''));
  } else {
    lines.push(newLine('AVANCE', targetPrice * 0.3, today, ''));
    lines.push(newLine('CREDIT', targetPrice * 0.7, today, ''));
  }

  if (syndic && syndic.monthlyAmount > 0) {
    const months = syndic.months > 0 ? syndic.months : 1;
    lines.push(newLine('FRAIS', syndic.monthlyAmount * months, today, months > 1 ? `${months} mois de charges syndic` : 'Charges syndic'));
  }

  return lines;
}

/** Sum of the core financing lines (see isCoreFinancingCategory) — the
 * figure that must match the dossier's target price exactly. */
export function financingLinesTotal(lines: EcheancierLine[]): number {
  return round2(lines.filter((l) => isCoreFinancingCategory(l.categorie)).reduce((sum, l) => sum + (l.montant || 0), 0));
}

export type FinancingValidationState = 'incomplete' | 'ok' | 'over';

// A centime of tolerance absorbs float rounding from the default 30/70 split
// without letting a genuinely incomplete/overshooting plan read as "ok".
const EPSILON = 0.01;

export function financingValidationState(total: number, target: number): FinancingValidationState {
  const diff = round2(total - target);
  if (Math.abs(diff) <= EPSILON) return 'ok';
  return diff < 0 ? 'incomplete' : 'over';
}

export const FINANCING_STATE_LABEL: Record<FinancingValidationState, string> = {
  incomplete: 'Incomplet',
  ok: 'Complet',
  over: 'Dépassement',
};

export const FINANCING_STATE_TONE: Record<FinancingValidationState, 'amber' | 'success' | 'warning'> = {
  incomplete: 'amber',
  ok: 'success',
  over: 'warning',
};

/** "Réglé" — sum of an échéancier line's payment sub-lines. */
export function lineSettled(line: Pick<EcheancierLine, 'payments'>): number {
  return round2(line.payments.reduce((sum, p) => sum + (p.montant || 0), 0));
}

/** "Reste" — what's still owed on a single line. */
export function lineRemaining(line: Pick<EcheancierLine, 'montant' | 'payments'>): number {
  return round2(line.montant - lineSettled(line));
}

export interface CategoryTotals {
  code: string;
  label: string;
  montant: number;
  regle: number;
  reste: number;
}

/** Drives the "Montants" recap panel (see
 * instructions/FIX-dossier-vente-corrections.md §5) — one row per category
 * present in `lines`, each summed from the échéancier rather than entered
 * by hand. Categories with no lines on this dossier are omitted rather than
 * shown as an all-zero row. */
export function categoryTotals(lines: EcheancierLine[]): CategoryTotals[] {
  const byCode = new Map<string, EcheancierLine[]>();
  for (const l of lines) {
    const list = byCode.get(l.categorie) ?? [];
    list.push(l);
    byCode.set(l.categorie, list);
  }
  return FINANCING_CATEGORIES.filter((c) => byCode.has(c.code)).map((c) => {
    const catLines = byCode.get(c.code)!;
    const montant = round2(catLines.reduce((sum, l) => sum + (l.montant || 0), 0));
    const regle = round2(catLines.reduce((sum, l) => sum + lineSettled(l), 0));
    return { code: c.code, label: c.label, montant, regle, reste: round2(montant - regle) };
  });
}

export function netAPayer(lines: EcheancierLine[]): number {
  return round2(lines.reduce((sum, l) => sum + lineRemaining(l), 0));
}

export function newPayment(): EcheancierPayment {
  return { id: crypto.randomUUID(), date: todayISO(), montant: 0, notes: '' };
}
