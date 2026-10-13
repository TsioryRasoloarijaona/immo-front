// Fenêtre « Leads de … » : état d'activité de chaque lead (FEATURE-leads-a-relancer.md).
import { getActiviteLeads } from './api';
import { formatNumber, pluriel } from './format';
import { useApi } from './useApi';
import type { LeadActiviteDto, UUID } from '../types';

/** Pages de la liste (100) ; le serveur en accepte 200 par appel. */
const PAR_APPEL = 100;

export type FiltreActivite = 'toutes' | 'jamais' | 'endormies';

export const FILTRES_ACTIVITE: readonly { valeur: FiltreActivite; libelle: string }[] = [
  { valeur: 'toutes', libelle: 'Toutes' },
  { valeur: 'jamais', libelle: 'Jamais traitées' },
  { valeur: 'endormies', libelle: 'Endormies' },
];

export interface ActiviteLeads {
  parId: ReadonlyMap<UUID, LeadActiviteDto>;
  chargee: boolean;
  error: string | null;
}

/** Activité des lignes chargées, en appels de 100 ids ; une erreur laisse la liste utilisable sans l'état. */
export function useActiviteLeads(ids: readonly UUID[]): ActiviteLeads {
  const cle = ids.join(',');
  const etat = useApi(async () => {
    const lots: UUID[][] = [];
    for (let i = 0; i < ids.length; i += PAR_APPEL) lots.push(ids.slice(i, i + PAR_APPEL));
    const lus = await Promise.all(lots.map((lot) => getActiviteLeads({ ids: lot })));
    return new Map(lus.flat().map((a) => [a.id, a]));
  }, [cle]);
  return {
    parId: etat.data ?? new Map<UUID, LeadActiviteDto>(),
    chargee: !etat.error && etat.data !== null,
    error: etat.error,
  };
}

export function jamaisTraite(a: LeadActiviteDto): boolean {
  return a.nombreActions === 0;
}

/** Au moins une action, la dernière il y a plus de 7 j : disjoint de « jamais traité ». */
export function endormi(a: LeadActiviteDto): boolean {
  return a.nombreActions > 0 && a.endormi;
}

/** En rouge : jamais traité ou endormi. */
export function dort(a: LeadActiviteDto): boolean {
  return jamaisTraite(a) || a.endormi;
}

export function libelleActions(a: LeadActiviteDto): string {
  return pluriel(a.nombreActions, 'action');
}

export function libelleEtat(a: LeadActiviteDto): string {
  if (jamaisTraite(a)) return 'jamais traité';
  if (a.endormi) return `${formatNumber(a.joursSansAction)} j sans action`;
  if (a.joursSansAction === 0) return "aujourd'hui";
  return `il y a ${formatNumber(a.joursSansAction)} j`;
}

export function correspond(a: LeadActiviteDto | undefined, filtre: FiltreActivite): boolean {
  if (filtre === 'toutes') return true;
  if (!a) return false;
  return filtre === 'jamais' ? jamaisTraite(a) : endormi(a);
}

/** « · 9 jamais traitées · 2 endormies (> 7 j) », sur les lignes chargées. */
export function resumeActivite(ids: readonly UUID[], parId: ReadonlyMap<UUID, LeadActiviteDto>): string {
  const activites = ids.map((id) => parId.get(id)).filter((a): a is LeadActiviteDto => a !== undefined);
  const jamais = activites.filter(jamaisTraite).length;
  const endormies = activites.filter(endormi).length;
  return ` · ${pluriel(jamais, 'jamais traitée', 'jamais traitées')} · ${pluriel(endormies, 'endormie')} (> 7 j)`;
}

/** « Tout cocher » sur les seules lignes visibles ; la sélection des lignes masquées est gardée. */
export function basculerVisibles(selection: ReadonlySet<string>, visibles: readonly UUID[]): Set<string> {
  const suivante = new Set(selection);
  const toutes = visibles.length > 0 && visibles.every((id) => selection.has(id));
  for (const id of visibles) {
    if (toutes) suivante.delete(id);
    else suivante.add(id);
  }
  return suivante;
}
