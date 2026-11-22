// DTO de FEATURE-n5-tableaux-de-bord-projet.md (noms du fil, docs/api-docsV4.json).
import type { UUID } from '../types';

export interface ProjetChoixDto {
  id: UUID;
  code: string;
  libelle: string;
}

export interface NoeudTresorerieDto {
  /** Clé opaque, à renvoyer dans `noeud` de /cellule. */
  cle: string;
  libelle: string;
  estCredit: boolean;
  niveau: number;
  /** 12 montants, janvier en premier. */
  montants: number[];
  total: number;
  regle: number;
  enfants: NoeudTresorerieDto[];
}

export interface OngletsTresorerieDto {
  projet: NoeudTresorerieDto[];
  fournisseur: NoeudTresorerieDto[];
}

export interface TresorerieProjetDto {
  annee: number;
  projets: ProjetChoixDto[];
  mois: string[];
  onglets: OngletsTresorerieDto;
}

export interface LigneCelluleTresorerieDto {
  date: string;
  dateOrigine: string;
  libelle: string;
  groupe: string;
  montant: number;
  type: string;
  reporte: boolean;
  objetId: UUID;
  objetNamespace: string;
}

export interface FiltresTresorerieProjet {
  annee?: number;
  projets: UUID[];
  societe?: UUID;
}

export type CodeColonneBilan =
  | 'etudeFaisabilite' | 'estimationBase' | 'estimationConfidentielle' | 'marche'
  | 'marcheAjuste' | 'previsions' | 'coutPrevisionnel' | 'coutReel';

export interface ColonneBilanDto {
  code: CodeColonneBilan;
  libelle: string;
}

export interface NoeudBilanDto {
  categorieId: UUID;
  libelle: string;
  niveau: number;
  valeurs: Partial<Record<CodeColonneBilan, number>>;
  ecart: number;
  enfants: NoeudBilanDto[];
}

export interface BilanProjetDto {
  colonnes: ColonneBilanDto[];
  lignes: NoeudBilanDto[];
  ecart1: CodeColonneBilan | null;
  ecart2: CodeColonneBilan | null;
  ttc: boolean;
}

export interface FiltresBilansProjet {
  projets: UUID[];
  ttc?: boolean;
  colonne1?: CodeColonneBilan;
  colonne2?: CodeColonneBilan;
}
