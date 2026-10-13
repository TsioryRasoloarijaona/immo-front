// Repères numérotés des maquettes de l'aide (FEATURE-aide.md, lot 2).

/** Largeur de dessin d'une maquette, en px : l'écran réel réduit, mis à l'échelle de la colonne. */
export const LARGEUR_MAQUETTE = 900;

/** Côté d'où part la flèche courte vers une petite cible ; sans côté, la pastille se pose sur le coin. */
export type Cote = 'gauche' | 'droite' | 'haut' | 'bas';

const COTES: readonly string[] = ['gauche', 'droite', 'haut', 'bas'];

export function coteDe(valeur: string | undefined): Cote | undefined {
  return valeur && COTES.includes(valeur) ? (valeur as Cote) : undefined;
}

/** Étape survolée ou focalisée, partagée entre le texte du guide et la maquette. */
export interface LienReperes {
  actif: number | null;
  onActif: (etape: number | null) => void;
  /** Numéros des étapes qui ont une pastille, connus après la mesure de la maquette. */
  onPresents?: (etapes: readonly number[]) => void;
}

/**
 * Attributs posés sur l'élément visé par l'étape `n`. `sous` : sélecteur d'un descendant quand l'élément vient
 * d'un composant réutilisé qui ne transmet pas ses attributs (ex. le premier bouton d'une liste).
 */
export function cible(n: number, cote?: Cote, sous?: string): Record<`data-${string}`, string> {
  const attributs: Record<`data-${string}`, string> = { 'data-repere': String(n) };
  if (cote) attributs['data-cote'] = cote;
  if (sous) attributs['data-sous'] = sous;
  return attributs;
}

export const idEtape = (n: number) => `aide-etape-${n}`;
export const idRepere = (n: number) => `aide-repere-${n}`;
