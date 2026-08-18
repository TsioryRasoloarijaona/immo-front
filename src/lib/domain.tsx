import type { ReactNode } from 'react';
import {
  IconMail,
  IconMessage,
  IconNote,
  IconPhoneIn,
  IconPhoneOut,
  IconVisit,
  IconWeb,
} from '../components/icons';
import type { BadgeTone, Prospection } from '../types';

// The ordered pipeline steps ("1..5"); the two side-track values are exception
// states rendered separately rather than positioned on the stepper.
export const PIPELINE_STAGES = [
  '1 A TRAITER',
  '2 EN COURS DE TRAITEMENT',
  '3 QUALIFIÉ',
  '4 APRES VISITES',
  '5 AVANT CONCRETISATION',
] as const;

export const PIPELINE_STAGE_SHORT: Record<string, string> = {
  '1 A TRAITER': 'À traiter',
  '2 EN COURS DE TRAITEMENT': 'En cours',
  '3 QUALIFIÉ': 'Qualifié',
  '4 APRES VISITES': 'Après visites',
  '5 AVANT CONCRETISATION': 'Avant concrétisation',
};

export function isSideTrackNature(nature: string): boolean {
  return nature === 'A RAPPELER PAR LE COMMERCIAL' || nature.trim() === 'AFFAIRES  A SUIVRE' || nature.trim() === 'AFFAIRES A SUIVRE';
}

export function pipelineStageIndex(nature: string): number {
  return PIPELINE_STAGES.indexOf(nature as (typeof PIPELINE_STAGES)[number]);
}

export function natureBadgeTone(nature: string, isClosed: boolean): BadgeTone {
  if (isClosed) return 'warning';
  if (isSideTrackNature(nature)) return 'amber';
  const idx = pipelineStageIndex(nature);
  if (idx <= 0) return 'neutral';
  if (idx < PIPELINE_STAGES.length - 1) return 'progress';
  return 'success';
}

// Not part of any lookups.json referential (the real export has no
// title/gender field at all — see the Person.title/gender doc comment in
// types.ts) — these are the exact option labels visible on the real Omran
// fiche (Titre: Madame / Sexe: Féminin…), just not sourced from sample data.
export const PERSON_TITLE_OPTIONS = ['Monsieur', 'Madame', 'Mademoiselle'];
export const PERSON_GENDER_OPTIONS = ['Masculin', 'Féminin'];

export type ProspectionStage = 'pre' | 'qualified';

// Omran's real pipeline has two gates before a sale file can exist: a raw,
// unqualified lead ("Pré-Prospection") and a qualified lead linked to a real
// contact with an assigned salesperson ("Prospection"). There's no explicit
// stage field in this export, so it's derived from those two link fields —
// see instructions/FIX-prospection-pipeline.md.
export function prospectionStage(p: Pick<Prospection, 'prospect' | 'commercial'>): ProspectionStage {
  return p.prospect && p.commercial ? 'qualified' : 'pre';
}

export function isPreProspection(p: Pick<Prospection, 'prospect' | 'commercial'>): boolean {
  return prospectionStage(p) === 'pre';
}

/** What's still missing before a Pré-Prospection can be transformed into a
 * qualified Prospection (mirrors the real system's required-field gate). */
export function missingQualificationFields(p: Pick<Prospection, 'prospect' | 'commercial'>): string[] {
  const missing: string[] = [];
  if (!p.prospect) missing.push('un contact lié (fiche prospect)');
  if (!p.commercial) missing.push('un commercial assigné');
  return missing;
}

/** Whether the "Qualification" tab's data (budget, superficie, origine) is
 * filled in enough to call this lead assessed — the trigger that
 * auto-advances the Nature gauge to "3 QUALIFIÉ" (see updateProspectionField
 * in lib/store.tsx). Distinct from missingQualificationFields above, which
 * gates the separate Pré-Prospection→Prospection transformation. */
export function isQualificationDataComplete(
  p: Pick<Prospection, 'budgetMin' | 'budgetMax' | 'areaMin' | 'areaMax' | 'origin'>,
): boolean {
  const hasBudget = (p.budgetMin ?? 0) > 0 || (p.budgetMax ?? 0) > 0;
  const hasArea = (p.areaMin ?? 0) > 0 || (p.areaMax ?? 0) > 0;
  const hasOrigin = Boolean(p.origin && p.origin.trim());
  return hasBudget && hasArea && hasOrigin;
}

const ACTION_ICONS: Record<string, (props: { className?: string }) => ReactNode> = {
  'Téléphone Sortant': IconPhoneOut,
  'Téléphone entrant': IconPhoneIn,
  Visite: IconVisit,
  Note: IconNote,
  WEB: IconWeb,
  'Mail entrant': IconMail,
  'Mail Sortant': IconMail,
  'Message sortant': IconMessage,
  'Message entrant': IconMessage,
  Instruction: IconNote,
};

export function communicationIcon(actionType: string): ReactNode {
  const Icon = ACTION_ICONS[actionType] ?? IconMessage;
  return <Icon />;
}

export function standingClass(standing: string): string {
  const s = standing.toLowerCase();
  if (s.includes('très haut')) return 'bg-[var(--brand-bg)] text-[var(--brand)]';
  if (s.includes('touristique')) return 'bg-[var(--amber-bg)] text-[var(--amber)]';
  if (s.includes('haut')) return 'bg-[var(--info-bg)] text-[var(--info)]';
  if (s.includes('social')) return 'bg-[var(--success-bg)] text-[var(--success)]';
  return 'bg-[var(--neutral-bg)] text-foreground';
}

/** Display name for a prospection: prefers the linked prospect record, falls
 * back to the free-text displayName captured at lead intake. */
export function prospectionDisplayName(p: { displayName: string; prospect: { name: string } | null }): string {
  return p.prospect?.name?.trim() || p.displayName?.trim() || 'Sans nom';
}

// Deterministic small hash so the same article id always produces the same
// synthesized value across renders/pages — mirrors the source transform
// script's `_isMock` gap-filling approach (see CLAUDE.md "Data honesty
// note"), extended here for two fields the Omran export has no signal for
// at all in this sample. See instructions/FIX-dossier-vente-corrections.md §2.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const TYPOLOGY_BY_ROOMS = ['STUDIO', '1 CHAMBRES+', '2 CHAMBRES+', '3 CHAMBRES+', '4 CHAMBRES+'];

/** "Typologie" — chambre-count descriptor, distinct from `type`
 * (APPARTEMENT/VILLA/…). Not present anywhere in this export: derived from
 * `area` where that's a plausible signal, else a deterministic per-article
 * placeholder so the field isn't left blank. Accessory items
 * (parking/terrasse/cave…) have no meaningful typologie and return
 * undefined. */
export function articleTypology(article: { id: string; area: number; category: string }): string | undefined {
  const cat = article.category?.toUpperCase() ?? '';
  if (cat.includes('PARKING') || cat.includes('TERRASSE') || cat.includes('CAVE') || cat.includes('BOX')) return undefined;
  if (article.area > 0) {
    const idx = Math.min(TYPOLOGY_BY_ROOMS.length - 1, Math.floor(article.area / 30));
    return TYPOLOGY_BY_ROOMS[idx];
  }
  return TYPOLOGY_BY_ROOMS[hashString(article.id) % TYPOLOGY_BY_ROOMS.length];
}

/** "Titre foncier" number. Real when the article's full record (looked up by
 * id among the complete Articles sample) already carries one — most
 * dossiers' embedded article reference falls outside this 50-row sample
 * (see CLAUDE.md "Data honesty note"), so this falls back to a deterministic
 * per-id placeholder rather than leaving the field empty. */
export function resolveArticleTitleNumber(
  article: { id: string; titleNumber?: string },
  allArticles: { id: string; titleNumber: string }[],
): string {
  const real = allArticles.find((a) => a.id === article.id)?.titleNumber;
  if (real) return real;
  if (article.titleNumber) return article.titleNumber;
  const h = hashString(article.id);
  return `${70000 + (h % 9999)}/${(h % 89) + 10}`;
}
