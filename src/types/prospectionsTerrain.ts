// Miroir des DTO de FEATURE-patrimoine-prospections-terrain.md (prospections terrain LndLand, zones, transitions).
import type { ReferentielItemDto, UUID } from '../types';

/** Surfaces et prix recalculés par le serveur (`CalculSurfacesTerrain`) ; coefficients en fraction. */
export interface SurfacesTerrain {
  superficie?: number | null;
  superficieEquipements?: number | null;
  superficieEquipementACeder?: number | null;
  superficieARegler?: number | null;
  superficieACeder?: number | null;
  /** Lecture seule : voies / superficie nette. */
  coefEquipements?: number | null;
  /** Lecture seule : superficie − les quatre surfaces. */
  superficieNette?: number | null;
  cos?: number | null;
  superficieCos?: number | null;
  cuf?: number | null;
  superficieCuf?: number | null;
  coefVendable?: number | null;
  superficieVendable?: number | null;
  coefCommerce?: number | null;
  superficieCommerce?: number | null;
  coefBureau?: number | null;
  superficieBureau?: number | null;
  /** Lecture seule : vendable − bureau − commerce. */
  superficieHabitat?: number | null;
  coefParking?: number | null;
  superficieParking?: number | null;
  /** Prix du m² du propriétaire. */
  prixM2?: number | null;
  /** Prix total du propriétaire = prixM2 × superficie. */
  prix?: number | null;
}

/** Filtres de `GET /api/prospections-terrain` ; absent = pas de filtre. */
export type FiltresProspectionsTerrain = {
  search?: string;
  archivee?: boolean;
  transformee?: boolean;
  statutId?: UUID;
  vocationId?: UUID;
  niveauId?: UUID;
  categorieId?: UUID;
  villeId?: UUID;
  amenage?: boolean;
};

/** Ligne de liste ; dates `YYYY-MM-DD`. */
export interface ProspectionTerrainListeDto extends SurfacesTerrain {
  id: UUID;
  code?: string | null;
  description?: string | null;
  date?: string | null;
  categorie?: ReferentielItemDto | null;
  type?: ReferentielItemDto | null;
  niveau?: ReferentielItemDto | null;
  vocation?: ReferentielItemDto | null;
  pays?: ReferentielItemDto | null;
  ville?: ReferentielItemDto | null;
  statut?: ReferentielItemDto | null;
  /** ARGB hexadécimal (ex. `ffff8000`). */
  statutCouleur?: string | null;
  /** Code du type de statut (Nouveau, Annulation…). */
  statutType?: string | null;
  dateValiditeStatut?: string | null;
  courtier?: ReferentielItemDto | null;
  adresse?: string | null;
  proprietaires?: string | null;
  notes?: string | null;
  anomalies?: string | null;
  estArchivee?: boolean | null;
  estTransformee?: boolean | null;
  /** Vrai = Aménagé, faux = Brut (zones). */
  estAmenage?: boolean | null;
  arreteAlignement?: number | null;
  hauteurMax?: number | null;
  prixPropose?: number | null;
  dateEnregistrement?: string | null;
  numeroEnregistrement?: string | null;
  lieuEnregistrement?: string | null;
  cpfImmatriculation?: string | null;
  dateImmatriculation?: string | null;
  nbEtudesFaisabilite: number;
  creePar?: string | null;
  creeLe?: string | null;
  modifiePar?: string | null;
  modifieLe?: string | null;
}

/** Saisie d'une zone (`PUT …/zones`) ; sans `id` = création. */
export interface ZoneTerrainEcritureDto {
  id?: UUID | null;
  identification?: string | null;
  superficie?: number | null;
  cos?: number | null;
  superficieCos?: number | null;
  cuf?: number | null;
  /** Donné seul → CUF = plancher / (superficie × COS), comme OMRAN. */
  superficieCuf?: number | null;
  coefVendable?: number | null;
  superficieVendable?: number | null;
  coefCommerce?: number | null;
  superficieCommerce?: number | null;
  coefBureau?: number | null;
  superficieBureau?: number | null;
  coefParking?: number | null;
  superficieParking?: number | null;
  arreteAlignement?: number | null;
  hauteurMax?: number | null;
  notes?: string | null;
}

export interface ZoneTerrainDto extends ZoneTerrainEcritureDto {
  readonly superficieHabitat?: number | null;
}

/** Fiche : champs de la liste + ids saisissables, zones, terrain issu. */
export interface ProspectionTerrainDetailDto extends ProspectionTerrainListeDto {
  categorieId?: UUID | null;
  typeId?: UUID | null;
  niveauId?: UUID | null;
  vocationId?: UUID | null;
  paysId?: UUID | null;
  villeId?: UUID | null;
  courtierId?: UUID | null;
  notaireId?: UUID | null;
  notaire?: ReferentielItemDto | null;
  orientationId?: UUID | null;
  orientation?: ReferentielItemDto | null;
  lienGoogle?: string | null;
  identificationZone?: string | null;
  conditionsRaccordement?: string | null;
  assietteFonciere?: string | null;
  leveeTopographique?: boolean | null;
  zones?: ZoneTerrainDto[] | null;
  terrainId?: UUID | null;
  terrainCode?: string | null;
  peutTransformer: boolean;
  motifNonTransformable?: string | null;
}

/** POST / PATCH (absent ou null = inchangé) ; dates `YYYY-MM-DD` ; le statut ne se saisit jamais. */
export interface ProspectionTerrainEcritureDto {
  code?: string;
  description?: string;
  date?: string;
  categorieId?: UUID;
  typeId?: UUID;
  niveauId?: UUID;
  vocationId?: UUID;
  paysId?: UUID;
  villeId?: UUID;
  courtierId?: UUID;
  notaireId?: UUID;
  orientationId?: UUID;
  lienGoogle?: string;
  adresse?: string;
  proprietaires?: string;
  notes?: string;
  anomalies?: string;
  estAmenage?: boolean;
  estArchivee?: boolean;
  dateValiditeStatut?: string;
  superficie?: number;
  superficieEquipements?: number;
  superficieEquipementACeder?: number;
  superficieARegler?: number;
  superficieACeder?: number;
  cos?: number;
  superficieCos?: number;
  cuf?: number;
  superficieCuf?: number;
  coefVendable?: number;
  superficieVendable?: number;
  coefCommerce?: number;
  superficieCommerce?: number;
  coefBureau?: number;
  superficieBureau?: number;
  coefParking?: number;
  superficieParking?: number;
  arreteAlignement?: number;
  hauteurMax?: number;
  prixM2?: number;
  prix?: number;
  prixPropose?: number;
  dateEnregistrement?: string;
  numeroEnregistrement?: string;
  lieuEnregistrement?: string;
  cpfImmatriculation?: string;
  dateImmatriculation?: string;
  identificationZone?: string;
  conditionsRaccordement?: string;
  assietteFonciere?: string;
  leveeTopographique?: boolean;
  /** PATCH : champs facultatifs à vider. */
  champsAVider?: string[];
}

/** Corps de `POST …/apercu-calcul` : `champModifie` fait gagner ce côté de sa paire. */
export type ApercuCalculDto = Omit<SurfacesTerrain, 'coefEquipements' | 'superficieNette' | 'superficieHabitat'> & {
  champModifie?: string;
};

export interface TransitionProspectionTerrainDto {
  id: UUID;
  code?: string | null;
  description?: string | null;
  statutCible?: ReferentielItemDto | null;
  commentaireObligatoire: boolean;
  avecDateUtilisateur: boolean;
  /** Non pris en charge : 409. */
  secondUtilisateur: boolean;
}

export interface ExecutionTransitionDto {
  transitionId: UUID;
  commentaire?: string;
  /** ISO `YYYY-MM-DDTHH:mm:ss`. */
  dateUtilisateur?: string;
}

export interface HistoriqueStatutProspectionDto {
  id: UUID;
  date?: string | null;
  description?: string | null;
  utilisateur?: string | null;
  transition?: string | null;
  statutId?: UUID | null;
  statut?: string | null;
  commentaire?: string | null;
  dateUtilisateur?: string | null;
}

/** Dialogue « Transformer en terrain ». */
export interface TransformationTerrainDto {
  entiteId: UUID;
  vocationId: UUID;
  /** Catégorie de nature Terrain. */
  categorieId: UUID;
  /** Défaut = code de la prospection. */
  code?: string;
}

export interface TerrainCreeDto {
  terrainId: UUID;
  code?: string | null;
}
