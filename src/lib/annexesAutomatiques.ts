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

/**
 * Prix proposé : `prixSuggere` du lot principal, qui inclut déjà tous ses sous-articles (prix OMRAN du lot),
 * plus les autres articles cochés qui ne sont pas des sous-articles de ce lot.
 */
export function prixProposeDesArticles(selection: readonly ArticleDetailDto[]): number {
  if (selection.length === 0) return 0;
  const principal = selection[0];
  const enfants = new Set((principal.sousLots ?? []).map((s) => s.id));
  return selection
    .filter((a, index) => index === 0 || !enfants.has(a.id))
    .reduce((somme, a) => somme + (a.prixSuggere ?? 0), 0);
}

/** Écart de prix sous le demi-centime : arrondi du prix saisi, pas une remise (seuil du serveur). */
export function sansRemise(montantRemise: number): boolean {
  return Math.abs(montantRemise) < 0.005;
}

/** Montant ramené au centime, pour pré-remplir un champ de prix. */
export function arrondiCentimes(montant: number): number {
  return Math.round(montant * 100) / 100;
}
