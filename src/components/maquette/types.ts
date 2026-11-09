import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ColonneGrille } from '../DataGrid';
import type { TypeChamp } from '../fiche/ChampFiche';
import type { IdOutil } from '../../lib/outilsListe';
import type { BadgeTone } from '../../types';

export type Valeur = string | number | boolean;

/** Une ligne de maquette : valeurs de la grille et de la fiche, indexées par le nom de la colonne. */
export type Ligne = { id: string } & Record<string, Valeur>;

export interface OngletStatique {
  id: string;
  libelle: string;
  colonnes: ColonneGrille<Ligne>[];
  lignes: Ligne[];
}

export interface ChampStatique {
  nom: string;
  libelle: string;
  type?: TypeChamp;
  large?: boolean;
}

export interface ActionStatique {
  id: string;
  libelle: string;
  icone: LucideIcon;
  /** Renseignée, l'action demande d'abord confirmation. */
  confirmation?: string;
}

/** Description complète d'un écran de liste statique : le gabarit n'a pas d'autre entrée. */
export interface ConfigEcran {
  titre: string;
  /** Singulier de l'effectif (« 12 lots »). */
  unite: string;
  /** Nature de la fiche, affichée dans sa barre de titre. */
  nature: string;
  colonnes: ColonneGrille<Ligne>[];
  lignes: Ligne[];
  recherche: string;
  /** Colonnes proposées en boîtes à cocher ; les valeurs viennent des lignes. */
  filtres?: string[];
  /** Colonne ISO filtrée par la période. */
  colonneDate?: string;
  champs: ChampStatique[];
  titreFiche: (ligne: Ligne) => string;
  onglets?: (ligne: Ligne) => OngletStatique[];
  /** Contenu libre sous les champs de la fiche (récapitulatif, circuit de statuts…). */
  extra?: (ligne: Ligne) => ReactNode;
  outils: IdOutil[];
  propres?: ActionStatique[];
  /** Bouton sur chaque ligne (« Lancer »). */
  actionLigne?: ActionStatique;
}

/** Référentiel Code / Description (+ colonnes en plus). */
export interface DefReferentiel {
  titre: string;
  unite: string;
  nature: string;
  extras?: { nom: string; libelle: string }[];
  /** Une ligne = [code, description, ...valeurs des colonnes en plus]. */
  lignes: string[][];
}

/** Tableau de bord statique : cartes de chiffres puis tableaux. */
export interface ConfigBord {
  titre: string;
  cartes: { libelle: string; valeur: string; sous?: string; tone?: BadgeTone }[];
  sections: { titre: string; colonnes: ColonneGrille<Ligne>[]; lignes: Ligne[] }[];
}
