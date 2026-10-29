import { referentielItems, useEntitesReferentiel, useProjetsReferentiel, useTranchesFiltre } from './referentiels';
import { puceSelection } from './pucesFiltres';
import type { ItemFiltre } from '../components/liste/BoiteFiltre';
import type { ReferentielItemDto, TrancheListItemDto } from '../types';

/** Tranche impossible : un filtre actif mais vide ne doit jamais partir sans paramètre (ce serait tout afficher). */
export const AUCUNE_TRANCHE = '00000000-0000-0000-0000-000000000000';

export type SelectionCascade = { entiteId: string[]; projetId: string[]; trancheId: string[] };
export const CASCADE_VIDE: SelectionCascade = { entiteId: [], projetId: [], trancheId: [] };

export type NiveauCascade = keyof SelectionCascade;

type Sources = { entites: ReferentielItemDto[]; projets: ReferentielItemDto[]; tranches: TrancheListItemDto[] };

/** La liste des tranches ne sert que `entiteCode`, pas `entiteId` : le lien passe par le code. */
function tranchesCompatibles(sel: SelectionCascade, s: Sources): TrancheListItemDto[] {
  const codes = s.entites.filter((e) => sel.entiteId.includes(e.id) && e.code).map((e) => e.code);
  return sel.entiteId.length === 0 ? s.tranches : s.tranches.filter((t) => !!t.entiteCode && codes.includes(t.entiteCode));
}

function projetsCompatibles(sel: SelectionCascade, s: Sources): ItemFiltre[] {
  const vus = new Set<string>();
  const items: ItemFiltre[] = [];
  for (const t of tranchesCompatibles(sel, s)) {
    if (!t.projetId || vus.has(t.projetId)) continue;
    vus.add(t.projetId);
    const ref = s.projets.find((p) => p.id === t.projetId);
    items.push({ value: t.projetId, label: ref?.description || ref?.code || t.projetCode || t.projetId });
  }
  return items;
}

function tranchesDeLaBoite(sel: SelectionCascade, s: Sources): TrancheListItemDto[] {
  const visibles = tranchesCompatibles(sel, s);
  return sel.projetId.length === 0 ? visibles : visibles.filter((t) => !!t.projetId && sel.projetId.includes(t.projetId));
}


/** Règle 4 : ce qui devient incompatible en aval est décoché. */
function appliquer(sel: SelectionCascade, niveau: NiveauCascade, valeur: string[], s: Sources): SelectionCascade {
  let suivant: SelectionCascade = { entiteId: sel.entiteId, projetId: sel.projetId, trancheId: sel.trancheId, [niveau]: valeur };
  if (niveau === 'entiteId') {
    const projets = projetsCompatibles(suivant, s);
    suivant = { ...suivant, projetId: suivant.projetId.filter((p) => projets.some((i) => i.value === p)) };
  }
  if (niveau !== 'trancheId') {
    const ids = tranchesDeLaBoite(suivant, s).map((t) => t.id);
    suivant = { ...suivant, trancheId: suivant.trancheId.filter((t) => ids.includes(t)) };
  }
  return suivant;
}

/** `null` = rien à envoyer ; `[AUCUNE_TRANCHE]` si un filtre est actif mais ne laisse aucune tranche. */
function effectives(sel: SelectionCascade, boite: TrancheListItemDto[]): string[] | null {
  if (sel.entiteId.length + sel.projetId.length + sel.trancheId.length === 0) return null;
  const ids = sel.trancheId.length > 0 ? sel.trancheId : boite.map((t) => t.id);
  return ids.length > 0 ? ids : [AUCUNE_TRANCHE];
}

export function useCascadeTranches(sel: SelectionCascade) {
  const s: Sources = { entites: useEntitesReferentiel().data, projets: useProjetsReferentiel().data, tranches: useTranchesFiltre().data };
  const tranchesEffectives = (autre: SelectionCascade = sel) => effectives(autre, tranchesDeLaBoite(autre, s));

  return {
    entites: referentielItems(s.entites),
    projets: projetsCompatibles(sel, s),
    tranches: tranchesDeLaBoite(sel, s).map((t) => ({ value: t.id, label: t.description || t.code || t.id })),
    changer: (niveau: NiveauCascade, valeur: string[]) => appliquer(sel, niveau, valeur, s),
    tranchesEffectives,
    /**
     * Paramètres de requête. `serveurEntite` : l'écran accepte `entiteId` (garde les lignes sans tranche de l'entité) ;
     * les tranches ne partent alors que si un projet ou une tranche est coché.
     */
    params(serveurEntite = false): { entiteId?: string[]; trancheId?: string[] } {
      const entiteId = serveurEntite && sel.entiteId.length > 0 ? sel.entiteId : undefined;
      const tranchesUtiles = !serveurEntite || sel.projetId.length + sel.trancheId.length > 0;
      return { entiteId, trancheId: tranchesUtiles ? (tranchesEffectives() ?? undefined) : undefined };
    },
  };
}

export type CascadeTranches = ReturnType<typeof useCascadeTranches>;

export function pucesCascade(cascade: CascadeTranches, valeur: SelectionCascade): string[] {
  return [
    ...puceSelection('Entité', cascade.entites, valeur.entiteId),
    ...puceSelection('Projet', cascade.projets, valeur.projetId),
    ...puceSelection('Tranche', cascade.tranches, valeur.trancheId),
  ];
}
