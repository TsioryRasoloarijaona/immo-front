import type { BlocCommissionDto, LigneFraisDto, ReferentielItemDto } from '../types';
import { libelleBloc } from './commissionsTranche';
import { formatCurrency, formatDate, formatNumber, formatPercent, formatSurface } from './format';

/** Colonne d'une grille d'onglet de tranche : `nom` = champ du fil ; `type` règle la saisie et l'affichage. */
export interface ColonneOnglet<L> {
  nom: keyof L & string;
  libelle: string;
  /** `bloc` : bloc de commission (montant ou % du prix de vente TTC). */
  type: 'choix' | 'montant' | 'surface' | 'nombre' | 'pourcent' | 'case' | 'date' | 'texte' | 'bloc';
  /** `choix` : valeurs proposées (id → code — description), ou celles qui dépendent de la ligne. */
  choix?: ReferentielItemDto[] | ((ligne: L) => ReferentielItemDto[]);
  /** `choix` : « — » proposé (valeur nulle). */
  facultatif?: boolean;
  /** Champ calculé pour cette ligne : affiché, non saisi. */
  calcule?: (ligne: L) => boolean;
}

export type Valeur = string | number | boolean | BlocCommissionDto | null | undefined;

/** Ligne d'une grille en cours de saisie ; `cle` stable (l'`id` manque aux lignes nouvelles). */
export interface Rangee<L> {
  cle: string;
  ligne: L;
}

export function choixDe<L>(colonne: ColonneOnglet<L>, ligne: L): ReferentielItemDto[] {
  return typeof colonne.choix === 'function' ? colonne.choix(ligne) : colonne.choix ?? [];
}

const FORMATS_NOMBRE: Partial<Record<ColonneOnglet<unknown>['type'], (n: number | null) => string>> = {
  montant: formatCurrency,
  surface: (n) => formatSurface(n),
  pourcent: (n) => formatPercent(n, 2),
};

/** Valeur affichée d'une cellule en lecture. */
export function afficherValeur<L>(colonne: ColonneOnglet<L>, ligne: L): string {
  const valeur = ligne[colonne.nom] as Valeur;
  switch (colonne.type) {
    case 'case':
      return valeur ? 'Oui' : 'Non';
    case 'choix': {
      const choix = choixDe(colonne, ligne).find((c) => c.id === valeur);
      return choix ? libelleChoix(choix) : '—';
    }
    case 'date':
      return formatDate(typeof valeur === 'string' ? valeur : null);
    case 'texte':
      return typeof valeur === 'string' && valeur !== '' ? valeur : '—';
    case 'bloc':
      return libelleBloc(typeof valeur === 'object' ? valeur : null);
    default:
      break;
  }
  const format = FORMATS_NOMBRE[colonne.type] ?? ((n: number | null) => formatNumber(n));
  return format(typeof valeur === 'number' ? valeur : null);
}

/** Saisie d'une cellule ; `normaliser` recalcule la ligne (frais : HT ↔ TTC). */
export function changerRangee<L>(rangees: Rangee<L>[], cle: string, nom: keyof L, valeur: Valeur,
  normaliser?: (ligne: L) => L): Rangee<L>[] {
  return rangees.map((r) => {
    if (r.cle !== cle) return r;
    const ligne = { ...r.ligne, [nom]: valeur };
    return { cle, ligne: normaliser ? normaliser(ligne) : ligne };
  });
}

const ECHELLE = 1e6;

const arrondi = (valeur: number) => Math.round(valeur * ECHELLE) / ECHELLE;

/** Même règle que le serveur (TTC = HT × (1 + TVA), échelle 6) : le montant saisi donne l'autre. */
export function montantsFrais(ligne: LigneFraisDto): LigneFraisDto {
  const facteur = 1 + (ligne.tauxTva ?? 0);
  return ligne.saisiEnTTC
    ? { ...ligne, montantHT: arrondi((ligne.montantTTC ?? 0) / facteur) }
    : { ...ligne, montantTTC: arrondi((ligne.montantHT ?? 0) * facteur) };
}

export const libelleChoix = (choix: ReferentielItemDto) =>
  [choix.code, choix.description].filter(Boolean).join(' — ');

/** Somme d'un champ numérique (Σ du plancher couvert). */
export function somme<L>(lignes: L[], champ: (l: L) => number | null | undefined): number {
  return lignes.reduce((total, l) => total + (champ(l) ?? 0), 0);
}
