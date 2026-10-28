// DTO de FEATURE-patrimoine-import-export.md §1-§2 (import Excel du patrimoine), noms du fil.
import type { UUID } from '../types';

/** Types à mapping (FEATURE-patrimoine-import-generique.md) : `/colonnes`, `/analyse`, champ `mapping` de l'import. */
export type TypeImportGenerique = 'entites-juridiques' | 'projets' | 'tranches' | 'prospections-terrain';

export type TypeImportPatrimoine =
  | 'articles'
  | 'sous-articles'
  | 'presentations'
  | 'terrains'
  | 'lotissements'
  | 'previsions'
  | TypeImportGenerique;

export type TypeColonneImport = 'TEXTE' | 'ENTIER' | 'DECIMAL' | 'DATE' | 'BOOLEEN' | 'REFERENCE';

export interface ColonneImportDto {
  /** Champ du DTO d'écriture ; null si la colonne est ignorée. */
  propriete: string | null;
  /** Libellé OMRAN, en-tête attendu dans le fichier. */
  entete: string;
  type: TypeColonneImport;
  /** Vrai pour le code (seul pivot), qui doit être mappé. */
  pivot: boolean;
  obligatoire: boolean;
  /** Colonne acceptée mais non gérée par l'écran (avertissement). */
  ignoree: boolean;
  /** Référentiel d'une colonne REFERENCE ; null sinon. */
  reference: string | null;
}

export interface ColonneMappeeDto {
  /** Libellé de la colonne cible. */
  entete: string;
  /** Rang dans `AnalyseImportDto.entetes` ; -1 = non mappée. */
  indexColonne: number;
  propriete: string | null;
}

export interface MappingImportDto {
  /** Toujours `code`. */
  pivot: string;
  colonnes: ColonneMappeeDto[];
}

export interface AnalyseImportDto {
  feuilles: string[];
  feuille: string;
  entetes: string[];
  mappingPropose: MappingImportDto;
  /** Cinq premières lignes, une valeur par en-tête ("" = vide). */
  apercu: string[][];
  avertissements: string[];
}

export type ResultatImport = 'CREATION' | 'MISE_A_JOUR' | 'INCHANGEE' | 'ERREUR' | 'NON_VERIFIEE';

export interface LigneBilanDto {
  /** N° de ligne Excel (2 = première donnée). */
  numero: number;
  pivot: string | null;
  code: string | null;
  resultat: ResultatImport;
  message: string;
}

export interface BilanImportDto {
  type: TypeImportPatrimoine;
  simulation: boolean;
  /** Vrai seulement si tout a été écrit (aucune erreur, pas de simulation). */
  ecrit: boolean;
  lignesLues: number;
  creations: number;
  misesAJour: number;
  inchangees: number;
  erreurs: number;
  avertissements: string[];
  lignes: LigneBilanDto[];
}

export interface DemandeImportPatrimoine {
  type: TypeImportPatrimoine;
  /** Obligatoire pour articles, sous-articles et prévisions (400 sinon) ; ignorée pour les autres types. */
  trancheId?: UUID;
  fichier: File;
  /** Vrai = « Vérifier les données » : rien n'est écrit. */
  simulation: boolean;
  feuille?: string;
  /** Types à mapping seulement ; absent = en-têtes du fichier = libellés cibles. */
  mapping?: MappingImportDto;
}
