import type { ArticleDetailDto, ArticleListItemDto } from '../types';

/**
 * Sous-articles libres du lot principal (le premier sélectionné) que la création rattache d'office,
 * même non cochés — même règle que le serveur (`annexesAutomatiques` de la simulation).
 */
export function annexesAutomatiques(selection: readonly ArticleDetailDto[]): ArticleListItemDto[] {
  if (selection.length === 0) return [];
  const principal = selection[0];
  const selectionnes = new Set(selection.map((a) => a.id));
  return (principal.sousLots ?? []).filter((s) => s.statut === 'DISPONIBLE' && !selectionnes.has(s.id));
}

/** Le dossier aura des sous-articles : articles cochés après le premier, ou rattachés d'office. */
export function aDesAnnexes(nombreSelectionnes: number, automatiques: readonly unknown[] | undefined): boolean {
  return nombreSelectionnes > 1 || (automatiques ?? []).length > 0;
}

/** Prix de référence TTC cumulé des sous-articles rattachés d'office (0 sans prix). */
export function prixAnnexesAutomatiques(annexes: readonly ArticleListItemDto[]): number {
  return annexes.reduce((somme, a) => somme + (a.prixSuggere ?? 0), 0);
}
