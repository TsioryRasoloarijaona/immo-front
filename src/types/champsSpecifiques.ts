// Miroir des DTO de FEATURE-patrimoine-relances-champs.md (champs spécifiques), noms du fil exacts.
import type { UUID } from '../types';

export type PorteurChamps =
  | 'projet'
  | 'tranche'
  | 'entite'
  | 'article'
  | 'terrain'
  | 'lotissement'
  | 'prospection-terrain'
  | 'etude';

export interface ChampSpecifiqueDto {
  champId: UUID;
  categorie: string | null;
  ordreCategorie: number | null;
  libelle: string | null;
  ordre: number | null;
  /** String, Date, Decimal, Money, Int, Percentage, Bit ou Drop down. */
  typeDonnee: string | null;
  valeurDefaut: string | null;
  obligatoire: boolean;
  choix: string[];
  /** Date aaaa-mm-jj, décimale au point, pourcentage en fraction, true/false. */
  valeur: string | null;
}

export interface ValeurChampDto {
  champId: UUID;
  valeur: string | null;
}

export interface EcritureValeursChampsDto {
  valeurs: ValeurChampDto[];
}

export interface DefinitionChampDto {
  categorie: string | null;
  ordreCategorie: number | null;
  libelle: string;
  ordre: number | null;
  typeDonnee: string;
  valeurDefaut: string | null;
  obligatoire: boolean;
  choix: string[];
}
