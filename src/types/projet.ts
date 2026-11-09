// Miroir des DTO de FEATURE-projet-lots-decomptes.md (module Projet : lots et décomptes), noms du fil exacts.
import type { UUID } from '../types';

export interface ElementReferentielProjetDto {
  id: UUID;
  code: string | null;
  description: string | null;
  ordre: number | null;
}

export interface StatutLotProjetDto {
  id: UUID;
  code: string | null;
  description: string | null;
  ordre: number | null;
  typeCode: string | null;
  entiteCode: string | null;
}

export interface ProjetFiltreDto {
  id: UUID;
  code: string | null;
  description: string | null;
  nbLots: number;
}

export interface ReferentielsProjetDto {
  projets: ProjetFiltreDto[];
  typesLot: ElementReferentielProjetDto[];
  statutsLot: StatutLotProjetDto[];
  statutsFacture: ElementReferentielProjetDto[];
  categories: ElementReferentielProjetDto[];
}

export interface LotListItemDto {
  id: UUID;
  code: string | null;
  description: string | null;
  projetId: UUID | null;
  projetCode: string | null;
  typeCode: string | null;
  typeDescription: string | null;
  statutCode: string | null;
  statutDescription: string | null;
  statutOrdre: number | null;
  fournisseurId: UUID | null;
  fournisseurNom: string | null;
  categorieCode: string | null;
  categorieDescription: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  delaiJours: number | null;
  multiFournisseur: boolean;
  montantHT: number | null;
  montantTVA: number | null;
  montantTTC: number | null;
  montantsDepuisBordereau: boolean;
  /** Pourcentage 0–100. */
  tauxRetenueGarantie: number | null;
  nbDecomptes: number;
  cumulDecomptesHT: number | null;
  cumulDecomptesTTC: number | null;
  cumulTravauxSupplementaires: number | null;
  cumulRetenueGarantie: number | null;
  /** Non plafonné ; null si marché nul. */
  avancementPct: number | null;
  totalFacture: number | null;
  totalRegle: number | null;
  resteARegler: number | null;
}

export interface LotDetailDto extends LotListItemDto {
  projetDescription: string | null;
  entiteCode: string | null;
  entiteDescription: string | null;
  montantForfaitaireHT: number | null;
  montantForfaitaireTVA: number | null;
  montantForfaitaireTTC: number | null;
  estimationHT: number | null;
  estimationTVA: number | null;
  estimationTTC: number | null;
  estimationDepuisBordereau: boolean;
  retenueGarantieTheorique: number | null;
  avanceTheorique: number | null;
  tauxAvance: number | null;
  tauxCompteProrata: number | null;
  tauxAssuranceDEC: number | null;
  tauxAssuranceTRC: number | null;
  tvaDefaut: number | null;
  delaiPaiementJours: number | null;
  garantieMois: number | null;
  restitutionGarantieBloquee: boolean;
  avecDecomposition: boolean;
  clos: boolean;
  cumulNetAPayer: number | null;
  dateDebutPrevisionnelle: string | null;
  delaiPrevisionnelJours: number | null;
  dateFinPrevisionnelle: string | null;
  dateLancementAppelOffres: string | null;
  dateRetraitDossiers: string | null;
  dateEcheanceRemiseOffres: string | null;
  dateOuverturePlis: string | null;
  dateAdjudication: string | null;
  dateSignatureMarche: string | null;
  dateOrdreService: string | null;
  dateLancementTravaux: string | null;
  dateCreation: string | null;
  creePar: string | null;
  dateModification: string | null;
  modifiePar: string | null;
}

export interface LigneBordereauDto {
  id: UUID;
  ordre: number | null;
  groupe: string | null;
  code: string | null;
  designation: string | null;
  unite: string | null;
  quantite: number | null;
  prixUnitaireHT: number | null;
  /** Pourcentage 0–100. */
  tauxTVA: number | null;
  totalHT: number | null;
  totalTTC: number | null;
}

export interface TotauxBordereauDto {
  totalHT: number | null;
  totalTVA: number | null;
  totalTTC: number | null;
  nbLignes: number;
}

export interface BordereauDto {
  lotId: UUID;
  lignes: LigneBordereauDto[];
  totaux: TotauxBordereauDto;
}

export interface DecompteListItemDto {
  id: UUID;
  code: string | null;
  numero: number | null;
  dateDocument: string | null;
  lotId: UUID;
  lotCode: string | null;
  lotDescription: string | null;
  projetId: UUID | null;
  projetCode: string | null;
  fournisseurId: UUID | null;
  fournisseurNom: string | null;
  montantHT: number | null;
  montantTTC: number | null;
  travauxSupplementaires: number | null;
  retenueGarantie: number | null;
  /** Net stocké par OMRAN. */
  netAPayer: number | null;
  /** Net recalculé par Arpent, 2 décimales. */
  netAPayerRecalcule: number;
  /** netAPayer − netAPayerRecalcule, signé. */
  ecartNetAPayer: number;
  /** |écart| > 0,02 : s'affiche, ne bloque rien. */
  ecartSignificatif: boolean;
  cumulNetRetenueGarantie: number | null;
  dernier: boolean;
  factureId: UUID | null;
  factureCode: string | null;
  factureStatutCode: string | null;
  factureStatutDescription: string | null;
  /** 0 sans facture. */
  montantRegle: number;
  /** 0 sans facture. */
  resteARegler: number;
}

export interface FactureDecompteDto {
  id: UUID;
  code: string | null;
  dateDocument: string | null;
  dateEcheance: string | null;
  montantHT: number | null;
  montantTTC: number | null;
  montantAPayer: number | null;
  regularisation: number | null;
  statutCode: string | null;
  statutDescription: string | null;
}

export interface ReglementFactureDto {
  id: UUID;
  code: string | null;
  dateDocument: string | null;
  dateEcheance: string | null;
  montant: number | null;
  typeCode: string | null;
  typeDescription: string | null;
  annule: boolean;
}

export interface LigneDecompteDto {
  id: UUID;
  ordre: number | null;
  designation: string | null;
  unite: string | null;
  quantiteMarche: number | null;
  prixUnitaireHT: number | null;
  quantiteAnterieure: number | null;
  quantitePeriode: number | null;
  quantiteCumulee: number | null;
  coefficient: number | null;
  montantHTPeriode: number | null;
  /** Peut dépasser 100 ; null si quantité marché nulle. */
  avancementLignePct: number | null;
}

export interface ExtraDecompteDto {
  id: UUID;
  designation: string | null;
  unite: string | null;
  quantite: number | null;
  prixUnitaireHT: number | null;
  tauxTVA: number | null;
  montantHT: number | null;
  montantTTC: number | null;
}

export interface RetenueDecompteDto {
  id: UUID;
  libelle: string | null;
  montant: number | null;
}

export interface DecompteDetailDto extends DecompteListItemDto {
  montantTVA: number | null;
  tauxRetenueGarantie: number | null;
  montantNetRetenueGarantie: number | null;
  avanceAmortie: number | null;
  avanceSurDecompte: number | null;
  compteProrata: number | null;
  assuranceDEC: number | null;
  assuranceTRC: number | null;
  retenuesNonRemboursables: number | null;
  retenuesRemboursables: number | null;
  fluctuations: number | null;
  fluctuationsAPayer: number | null;
  montantBrut: number | null;
  cumulTTC: number | null;
  dateCreation: string | null;
  creePar: string | null;
  dateModification: string | null;
  modifiePar: string | null;
  facture: FactureDecompteDto | null;
  reglements: ReglementFactureDto[];
  lignes: LigneDecompteDto[];
  extras: ExtraDecompteDto[];
  retenues: RetenueDecompteDto[];
}

/** Filtres de `GET /api/projet/lots` ; `projetIds` vide = tous les projets visibles. */
export interface FiltresLots {
  projetIds?: UUID[];
  statutId?: UUID;
  typeId?: UUID;
  fournisseurId?: UUID;
  search?: string;
}

/** Filtres de `GET /api/projet/decomptes`. */
export interface FiltresDecomptes {
  projetIds?: UUID[];
  lotId?: UUID;
  fournisseurId?: UUID;
  du?: string;
  au?: string;
  statutFactureId?: UUID;
  sansFacture?: boolean;
  search?: string;
}
