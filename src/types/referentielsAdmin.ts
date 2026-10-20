// Miroir des DTO de FEATURE-patrimoine-referentiels.md (référentiels administrables, /api/referentiels-admin).
import type { UUID } from '../types';

export type FamilleReferentiel = 'ARTICLES' | 'PROSPECTIONS_TERRAINS' | 'AUTRES';

export type TypeChampReferentiel =
  | 'TEXTE'
  | 'ENTIER'
  | 'DECIMAL'
  | 'FRACTION'
  | 'BOOLEEN'
  | 'COULEUR'
  | 'REFERENCE'
  | 'OPERATEUR'
  | 'LIGNES';

/** Valeur permise d'un champ OPERATEUR (0 sans contrôle, 1 `>=`, 2 `>`). */
export interface OptionDto {
  valeur: number;
  libelle: string;
}

export interface ChampReferentielDto {
  /** Clé JSON du champ dans le corps et dans la ligne lue. */
  nom: string;
  libelle: string;
  type: TypeChampReferentiel;
  obligatoire: boolean;
  /** Entre dans la clé d'unicité de la table (seul ou avec d'autres). */
  unique: boolean;
  longueurMax?: number | null;
  /** REFERENCE : route GET de la liste de choix (`ReferentielItemDto[]`). */
  choix?: string | null;
  /** OPERATEUR seulement. */
  options?: OptionDto[] | null;
  /** LIGNES seulement : champs de chaque ligne enfant. */
  champs?: ChampReferentielDto[] | null;
}

export interface DescripteurReferentielDto {
  slug: string;
  libelle: string;
  famille: FamilleReferentiel;
  /** Les lignes portent une tranche : la liste accepte `trancheId` et `global`. */
  parTranche: boolean;
  /** Ni supprimés ni recodés (description modifiable). */
  codesProteges: string[];
  champs: ChampReferentielDto[];
}

/** Valeur d'un champ sur le fil : texte, nombre, booléen, PKey (REFERENCE) ou lignes enfants (LIGNES). */
export type ValeurReferentiel = string | number | boolean | null | LigneReferentiel[];

/** Ligne lue ou écrite : `id` plus une clé par `nom` de champ du descripteur. */
export interface LigneReferentiel {
  id?: UUID;
  [champ: string]: ValeurReferentiel | undefined;
}

export interface FiltresReferentiel {
  search?: string;
  /** Référentiel par tranche : lignes de cette tranche seulement (404 si non visible). */
  trancheId?: UUID;
  /** Référentiel par tranche : lignes sans tranche seulement. */
  global?: boolean;
}
