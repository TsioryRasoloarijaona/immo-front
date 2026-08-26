import type { ReactNode } from 'react';
import { IconMessage, IconNote, IconPhoneIn, IconPhoneOut } from '../components/icons';
import type { BadgeTone, EvenementCalendrierDto, ProspectionDetailDto, ProspectionListItemDto } from '../types';

// Best-effort ordered pipeline read off the real étape labels migrated from
// the legacy Omran export (see CLAUDE.md) — the API only ever gives us a
// free-text `etape` string (ProspectionListItemDto/DetailDto), no explicit
// ordered enum, so this is a display convention, not a contract.
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

export function isSideTrackEtape(etape: string | undefined): boolean {
  const e = (etape ?? '').trim();
  return e === 'A RAPPELER PAR LE COMMERCIAL' || e === 'AFFAIRES A SUIVRE' || e === 'AFFAIRES  A SUIVRE';
}

export function pipelineStageIndex(etape: string | undefined): number {
  return PIPELINE_STAGES.indexOf((etape ?? '') as (typeof PIPELINE_STAGES)[number]);
}

export function etapeBadgeTone(etape: string | undefined, fermee?: boolean): BadgeTone {
  if (fermee) return 'warning';
  if (isSideTrackEtape(etape)) return 'amber';
  const idx = pipelineStageIndex(etape);
  if (idx <= 0) return 'neutral';
  if (idx < PIPELINE_STAGES.length - 1) return 'progress';
  return 'success';
}

// Shared filter-bar state for ProspectionsList/PreProspectionsList — kept
// here rather than in the component file so ProspectionFilterBar.tsx only
// exports the component (react-refresh requirement).
export interface ProspectionFilterBarState {
  search: string;
  etape: string[];
  origine: string[];
  commercial: string[];
  trancheId: string[];
  dateDebut: string;
  dateFin: string;
  ouvertes: 'all' | 'open' | 'closed';
}

export function emptyProspectionFilters(): ProspectionFilterBarState {
  return { search: '', etape: [], origine: [], commercial: [], trancheId: [], dateDebut: '', dateFin: '', ouvertes: 'open' };
}

export function standingClass(standing: string): string {
  const s = (standing || '').toLowerCase();
  if (s.includes('très haut')) return 'bg-[var(--brand-bg)] text-[var(--brand)]';
  if (s.includes('touristique')) return 'bg-[var(--amber-bg)] text-[var(--amber)]';
  if (s.includes('haut')) return 'bg-[var(--info-bg)] text-[var(--info)]';
  if (s.includes('social')) return 'bg-[var(--success-bg)] text-[var(--success)]';
  return 'bg-[var(--neutral-bg)] text-foreground';
}

/** Display name for a prospection row/detail — prefers the linked prospect's
 * name, falls back to the free-text lead description captured before a
 * Prospect record exists (pré-prospection), then the code. */
export function prospectionDisplayName(
  p: Pick<ProspectionListItemDto | ProspectionDetailDto, 'prospectNom' | 'code'> & { tempDescription?: string },
): string {
  return p.prospectNom?.trim() || p.tempDescription?.trim() || p.code?.trim() || 'Sans nom';
}

/** Full name from a Prospect/Client DTO's prenom+nom (or raisonSociale for a
 * company record). */
export function personDisplayName(p: { prenom?: string; nom?: string; raisonSociale?: string }): string {
  const full = `${p.prenom ?? ''} ${p.nom ?? ''}`.trim();
  return full || p.raisonSociale?.trim() || 'Sans nom';
}

// InteractionDto only carries `entrante` (incoming/outgoing) — no
// actionType/channel field like the legacy export had — so the icon can only
// reflect direction, not medium (call vs visit vs note).
export function interactionIcon(entrante: boolean | undefined): ReactNode {
  const Icon = entrante ? IconPhoneIn : IconPhoneOut;
  return <Icon />;
}

// EvenementCalendrierDto.resultatCode carries the same text as the
// resultats-interaction référentiel's `code` (a real, stable value, not a
// display-only label) — comparing against it distinguishes a visite from a
// simple rendez-vous without inventing a business enum on the front. Only
// "Le prospect veut faire une visite du projet" behaves as a visite today;
// match loosely on "visite" so a future référentiel entry phrased
// differently (e.g. "Visite du projet demandée") keeps working.
export function isVisiteEvenement(ev: Pick<EvenementCalendrierDto, 'resultatCode'>): boolean {
  return (ev.resultatCode ?? '').toLowerCase().includes('visite');
}

export function noteIcon(): ReactNode {
  return <IconNote />;
}

export function genericIcon(): ReactNode {
  return <IconMessage />;
}
