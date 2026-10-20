// Classes littérales : Tailwind ne voit pas les classes calculées. Tailles : jetons `--fiche-*` d'index.css.

/** Une paire libellé | valeur, libellé à gauche sur une ligne de 26 px. */
export const LIGNE_CHAMP =
  'grid min-h-(--fiche-row-h) min-w-0 grid-cols-[var(--fiche-label-w)_minmax(0,1fr)] items-center gap-x-2';

export const ETIQUETTE_CHAMP = 'min-w-0 text-micro leading-[1.15] font-medium text-muted-foreground';

/** Un libellé trop long passe sur deux lignes puis se coupe (le texte complet est en infobulle). */
export const TEXTE_ETIQUETTE = 'line-clamp-2 break-words';

export const VALEUR_CHAMP = 'min-w-0 break-words text-body font-medium text-foreground';

/** Autant de colonnes que la largeur le permet. */
export const GRILLE_CHAMPS = 'grid grid-cols-[repeat(auto-fill,minmax(var(--fiche-col-min),1fr))] gap-x-4 gap-y-1.5';
