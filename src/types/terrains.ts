// Miroir des DTO de FEATURE-patrimoine-terrains.md (terrains, frais, facture de frais, lotissements).
import type { ReferentielItemDto, UUID } from '../types';

/** Filtres de `GET /api/terrains` et `GET /api/lotissements` ; absent = pas de filtre. */
export type FiltresTerrains = {
  /** Sans casse ni espaces : code, description, titre foncier, adresse, notes, libellés. */
  search?: string;
  entiteId?: UUID;
  statutId?: UUID;
  vocationId?: UUID;
};

/** Ligne des listes Terrains et Lotissements. */
export interface TerrainListeDto {
  id: UUID;
  code?: string | null;
  description?: string | null;
  entite?: ReferentielItemDto | null;
  ville?: ReferentielItemDto | null;
  statut?: ReferentielItemDto | null;
  vocation?: ReferentielItemDto | null;
  /** Renseignée pour un lot de terrain. */
  tranche?: ReferentielItemDto | null;
  surfaceDefinitive?: number | null;
  prixDefinitifTTC?: number | null;
  titreFoncier?: string | null;
  occupe: boolean;
}

/** Fiche terrain ; `coutTotal` / `coutUnitaireFinal` calculés à la lecture. Taux en fraction. */
export interface TerrainDetailDto {
  id: UUID;
  code?: string | null;
  description?: string | null;
  entite?: ReferentielItemDto | null;
  pays?: ReferentielItemDto | null;
  ville?: ReferentielItemDto | null;
  nature?: ReferentielItemDto | null;
  vocation?: ReferentielItemDto | null;
  categorie?: ReferentielItemDto | null;
  type?: ReferentielItemDto | null;
  /** Lecture seule (entité LandProject). */
  statut?: ReferentielItemDto | null;
  niveau?: ReferentielItemDto | null;
  vocationTerrain?: ReferentielItemDto | null;
  orientation?: ReferentielItemDto | null;
  categorieCharge?: ReferentielItemDto | null;
  /** Propriétaire : fournisseur par défaut des frais. */
  fournisseur?: ReferentielItemDto | null;
  parent?: ReferentielItemDto | null;
  estTermine?: boolean | null;
  sousTerrainsAutorises: boolean;
  /** Surfaces, prix et titre foncier protégés. */
  occupe: boolean;
  prospectionFonciereId?: UUID | null;
  surfaceProvisoire?: number | null;
  prixM2ProvisoireHT?: number | null;
  prixM2ProvisoireTTC?: number | null;
  prixProvisoireHT?: number | null;
  prixProvisoireTTC?: number | null;
  surfaceDefinitive?: number | null;
  prixM2DefinitifHT?: number | null;
  prixM2DefinitifTTC?: number | null;
  prixDefinitifHT?: number | null;
  prixDefinitifTTC?: number | null;
  tauxTva?: number | null;
  prixAchatM2?: number | null;
  prixAchat?: number | null;
  dateAchat?: string | null;
  datePermisConstruire?: string | null;
  coutTotal?: number | null;
  coutUnitaireFinal?: number | null;
  titreFoncier?: string | null;
  intituleTitreFoncier?: string | null;
  dateTitreFoncier?: string | null;
  adresse?: string | null;
  lienGoogle?: string | null;
  notes?: string | null;
  anomalies?: string | null;
  sousTerrains?: TerrainListeDto[] | null;
  userCreate?: string | null;
  userCreateDateTime?: string | null;
  userUpdate?: string | null;
  userUpdateDateTime?: string | null;
}

/** POST / PATCH (absent ou null = inchangé) / sous-terrain (code, description, surfaces, prix). */
export interface TerrainEcritureDto {
  code?: string;
  description?: string;
  entiteId?: UUID;
  paysId?: UUID;
  villeId?: UUID;
  /** Terrain implicite ; une autre nature → 400. */
  natureId?: UUID;
  vocationId?: UUID;
  categorieId?: UUID;
  typeId?: UUID;
  niveauId?: UUID;
  vocationTerrainId?: UUID;
  orientationId?: UUID;
  categorieChargeId?: UUID;
  estTermine?: boolean;
  surfaceProvisoire?: number;
  surfaceDefinitive?: number;
  /** Exclusif avec `prixM2ProvisoireTTC`. */
  prixM2ProvisoireHT?: number;
  prixM2ProvisoireTTC?: number;
  /** Exclusif avec `prixM2DefinitifTTC`. */
  prixM2DefinitifHT?: number;
  prixM2DefinitifTTC?: number;
  tauxTva?: number;
  prixAchatM2?: number;
  prixAchat?: number;
  fournisseurId?: UUID;
  dateAchat?: string;
  datePermisConstruire?: string;
  titreFoncier?: string;
  intituleTitreFoncier?: string;
  dateTitreFoncier?: string;
  adresse?: string;
  lienGoogle?: string;
  notes?: string;
  anomalies?: string;
  /** PATCH : champs facultatifs à vider. */
  champsAVider?: string[];
}

/** Frais StkExpense ; une ligne validée se renvoie inchangée au PUT (modifiée ou retirée → 409). */
export interface LigneFraisTerrainDto {
  id?: UUID;
  /** `YYYY-MM-DD`. */
  date: string;
  montant: number;
  notes?: string;
  typeFraisId: UUID;
  /** Absent = propriétaire du terrain ; absent des deux → 400. */
  fournisseurId?: UUID | null;
  readonly typeFraisCode?: string | null;
  readonly typeFraisDescription?: string | null;
  readonly fournisseurDescription?: string | null;
  readonly valide?: boolean | null;
  readonly factureId?: UUID | null;
  readonly factureCode?: string | null;
}

/** Facture fournisseur créée par « Valider pour règlement ». */
export interface FactureFraisTerrainDto {
  factureId: UUID;
  code: string;
  montant: number;
}
