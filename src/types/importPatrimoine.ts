// DTO de FEATURE-patrimoine-import-export.md §1 (import Excel des articles / sous-articles), noms du fil.
import type { UUID } from '../types';

export type TypeImportPatrimoine = 'articles' | 'sous-articles';

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
  trancheId: UUID;
  fichier: File;
  /** Vrai = « Vérifier les données » : rien n'est écrit. */
  simulation: boolean;
  feuille?: string;
}
