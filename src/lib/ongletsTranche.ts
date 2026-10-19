import type { LigneFraisDto, ReferentielItemDto } from '../types';

/** Colonne d'une grille d'onglet de tranche : `nom` = champ du fil ; `type` règle la saisie et l'affichage. */
export interface ColonneOnglet<L> {
  nom: keyof L & string;
  libelle: string;
  type: 'choix' | 'montant' | 'surface' | 'nombre' | 'pourcent' | 'case';
  /** `choix` : valeurs proposées (id → code — description). */
  choix?: ReferentielItemDto[];
  /** Champ calculé pour cette ligne : affiché, non saisi. */
  calcule?: (ligne: L) => boolean;
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
