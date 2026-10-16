import type { UUID } from '../types';

/** Miroir de `/api/modeles-documents` (FEATURE-modeles-documents.md §6) — noms du fil à l'identique. */

export type TypeChamp = 'TEXTE' | 'MONTANT' | 'POURCENTAGE' | 'DATE' | 'NOMBRE' | 'BOOLEEN';

export interface CategorieModeleDto {
  code: string;
  libelle: string;
}

export interface ChampModeleDto {
  cle: string;
  libelle: string;
  type: TypeChamp;
  exemple?: string | null;
}

export interface GroupeChampsDto {
  libelle: string;
  champs: ChampModeleDto[];
}

export interface ListeChampsDto {
  cle: string;
  libelle: string;
  champs: ChampModeleDto[];
}

export interface CatalogueChampsDto {
  categorie: string;
  groupes: GroupeChampsDto[];
  listes: ListeChampsDto[];
}

export interface MiseEnPageDto {
  format?: string | null;
  margeHaut?: number | null;
  margeBas?: number | null;
  margeGauche?: number | null;
  margeDroite?: number | null;
  enTete?: string | null;
  piedDePage?: string | null;
}

export interface ModeleDocumentResumeDto {
  id: UUID;
  code: string;
  libelle: string;
}

export interface ModeleDocumentAdminDto {
  id: UUID;
  categorie: string;
  code: string;
  libelle: string;
  ordre: number;
  actif: boolean;
  versionCourante?: number | null;
  modifieLe?: string | null;
  modifiePar?: string | null;
}

export interface ModeleDocumentDetailDto extends ModeleDocumentAdminDto {
  contenu: string;
  miseEnPage: MiseEnPageDto;
}

export interface VersionModeleDto {
  numero: number;
  creeLe?: string | null;
  creePar?: string | null;
  courante: boolean;
}

export interface CreerModeleDocumentRequest {
  categorie: string;
  code: string;
  libelle: string;
  ordre?: number;
  contenu: string;
  miseEnPage?: MiseEnPageDto;
}

export interface ModifierModeleDocumentRequest {
  libelle?: string;
  ordre?: number;
  actif?: boolean;
  contenu?: string;
  miseEnPage?: MiseEnPageDto;
}

export interface ApercuModeleRequest {
  contenu: string;
  miseEnPage?: MiseEnPageDto;
  ficheId: UUID;
}
