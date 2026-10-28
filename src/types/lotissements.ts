// Miroir des DTO de FEATURE-patrimoine-lotissements.md (fiche et écriture d'un lot de terrain).
import type { UUID } from '../types';

/** POST (trancheId, code, description, vocationId, categorieId, typeId obligatoires) / PATCH (absent = inchangé). */
export interface LotissementEcritureDto {
  /** Changée en PATCH : présentation vidée ; 409 si le lot est occupé ou a des prospections. */
  trancheId?: UUID;
  /** Unique dans la tranche, toutes natures confondues (409). */
  code?: string;
  description?: string;
  /** PROJET refusée (400). */
  vocationId?: UUID;
  /** Nature TER ou LOT DE TERRAIN. */
  categorieId?: UUID;
  typeId?: UUID;
  /** Type de présentation de la tranche du lot ; d'une autre tranche → 400. */
  presentationId?: UUID;
  orientationId?: UUID;
  categorieChargeId?: UUID;
  entiteSyndicId?: UUID;
  adresse?: string;
  notes?: string;
  anomalies?: string;
  contenanceLibre?: string;
  surfaceProvisoire?: number;
  surfaceDefinitive?: number;
  /** Exclusif avec `prixM2ProvisoireTTC`. */
  prixM2ProvisoireHT?: number;
  prixM2ProvisoireTTC?: number;
  /** Exclusif avec `prixM2DefinitifTTC`. */
  prixM2DefinitifHT?: number;
  prixM2DefinitifTTC?: number;
  /** Fraction (0,2 = 20 %). */
  tauxTva?: number;
  titreFoncier?: string;
  estTitre?: boolean;
  remiseMax1?: number;
  remiseMax2?: number;
  avanceMinimum?: number;
  loyerMensuelHT?: number;
  nombreCautions?: number;
  disponibleVenteWeb?: boolean;
  disponibleLocationWeb?: boolean;
  dateEnregistrement?: string;
  numeroEnregistrement?: string;
  lieuEnregistrement?: string;
  cpfImmatriculation?: string;
  dateImmatriculation?: string;
  titreFoncierMere?: string;
  intituleTitreFoncier?: string;
  dateTitreFoncier?: string;
  proprieteDite?: string;
  fractionDivise?: string;
  fractionDiviseTerrain?: string;
  partiesDivises?: number;
  partiesIndivises?: number;
  quotaTerrainGroupe?: string;
  notesTitreFoncier?: string;
  referenceElectricite?: string;
  policeElectricite?: string;
  compteurElectricite?: string;
  releveElectricite?: string;
  referenceEau?: string;
  policeEau?: string;
  compteurEau?: string;
  releveEau?: string;
  referenceGaz?: string;
  policeGaz?: string;
  compteurGaz?: string;
  releveGaz?: string;
  cos?: number;
  cuf?: number;
  arreteAlignement?: number;
  retraitVoisin?: number;
  hauteurMax?: number;
  latitude?: number;
  longitude?: number;
  /** PATCH : champs facultatifs à vider ; socle (tranche, code, classification, surfaces, prix, TVA, titre) → 400. */
  champsAVider?: string[];
}

/** Fiche d'un lot : références à plat (comme ArticleDetailDto), champs de la fiche article à plat. */
export interface LotissementDetailDto {
  id: UUID;
  code?: string | null;
  description?: string | null;
  trancheId?: UUID | null;
  trancheCode?: string | null;
  trancheDescription?: string | null;
  programmeId?: UUID | null;
  programmeCode?: string | null;
  programmeDescription?: string | null;
  entiteId?: UUID | null;
  entiteCode?: string | null;
  entiteDescription?: string | null;
  vocationId?: UUID | null;
  vocationCode?: string | null;
  vocationLibelle?: string | null;
  categorieId?: UUID | null;
  categorieCode?: string | null;
  categorieLibelle?: string | null;
  typeId?: UUID | null;
  typeCode?: string | null;
  typeLibelle?: string | null;
  presentationTypeId?: UUID | null;
  presentationTypeCode?: string | null;
  presentationTypeLibelle?: string | null;
  orientationLibelle?: string | null;
  categorieChargeLibelle?: string | null;
  entiteSyndicLibelle?: string | null;
  adresse?: string | null;
  notes?: string | null;
  titreFoncier?: string | null;
  estTitre?: boolean | null;
  /** Affecté à un dossier : surfaces, prix, classification, titre et code en lecture seule. */
  estOccupe: boolean;
  surfaceProvisoire?: number | null;
  surfaceDefinitive?: number | null;
  prixM2ProvisoireHT?: number | null;
  prixM2ProvisoireTTC?: number | null;
  prixM2DefinitifHT?: number | null;
  prixM2DefinitifTTC?: number | null;
  prixProvisoireHT?: number | null;
  prixProvisoireTTC?: number | null;
  prixDefinitifHT?: number | null;
  prixDefinitifTTC?: number | null;
  tauxTva?: number | null;
  remiseMax1?: number | null;
  remiseMax2?: number | null;
  cos?: number | null;
  cuf?: number | null;
  arreteAlignement?: number | null;
  retraitVoisin?: number | null;
  hauteurMax?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  creePar?: string | null;
  creeLe?: string | null;
  modifiePar?: string | null;
  modifieLe?: string | null;
  // Champs de la fiche article (FicheArticleDto), à plat.
  orientationId?: UUID | null;
  categorieChargeId?: UUID | null;
  entiteSyndicId?: UUID | null;
  avanceMinimum?: number | null;
  loyerMensuelHT?: number | null;
  nombreCautions?: number | null;
  anomalies?: string | null;
  contenanceLibre?: string | null;
  disponibleVenteWeb?: boolean | null;
  disponibleLocationWeb?: boolean | null;
  dateEnregistrement?: string | null;
  numeroEnregistrement?: string | null;
  lieuEnregistrement?: string | null;
  cpfImmatriculation?: string | null;
  dateImmatriculation?: string | null;
  titreFoncierMere?: string | null;
  intituleTitreFoncier?: string | null;
  dateTitreFoncier?: string | null;
  proprieteDite?: string | null;
  fractionDivise?: string | null;
  fractionDiviseTerrain?: string | null;
  partiesDivises?: number | null;
  partiesIndivises?: number | null;
  quotaTerrainGroupe?: string | null;
  notesTitreFoncier?: string | null;
  referenceElectricite?: string | null;
  policeElectricite?: string | null;
  compteurElectricite?: string | null;
  releveElectricite?: string | null;
  referenceEau?: string | null;
  policeEau?: string | null;
  compteurEau?: string | null;
  releveEau?: string | null;
  referenceGaz?: string | null;
  policeGaz?: string | null;
  compteurGaz?: string | null;
  releveGaz?: string | null;
  /** Calculée à la lecture : superficie − superficie des équipements. */
  superficieNette?: number | null;
  superficieTitree?: number | null;
}
