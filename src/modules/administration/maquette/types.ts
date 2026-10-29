import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { ColonneGrille } from '../../../components/DataGrid';
import type { TypeChamp } from '../../../components/fiche/ChampFiche';
import type { IdOutil } from '../../../lib/outilsListe';

/** Une ligne de maquette : valeurs de la grille et de la fiche, indexées par le nom de la colonne. */
export type Ligne = { id: string } & Record<string, string | number | boolean>;

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
  /** Singulier de l'effectif (« 12 pays »). */
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
  /** Contenu libre sous les champs de la fiche (arbre de droits…). */
  extra?: (ligne: Ligne) => ReactNode;
  outils: IdOutil[];
  propres?: ActionStatique[];
  effectifDansTitre?: boolean;
  /** Bouton sur chaque ligne (« Lancer »). */
  actionLigne?: ActionStatique;
}
