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
  /** Nom .NET brut de `StrStatus.ColorName` (ex. `LimeGreen`). */
  couleur: string | null;
  genre: GenreLot | null;
}

/** Genre d'un lot (`StrEntityId`), FEATURE-lots-liste-parite.md. */
export type GenreLot = 'ENTREPRENEURS' | 'FOURNISSEURS' | 'ADMINISTRATION' | 'MAITRES_OEUVRE' | 'CONCESSIONNAIRES';

export interface ProjetFiltreDto {
  id: UUID;
  code: string | null;
  description: string | null;
  nbLots: number;
  /** Entité juridique (`CfgCompany`) du projet. */
  entiteId: UUID | null;
}

export interface EntiteFiltreDto {
  id: UUID;
  code: string | null;
  libelle: string | null;
}

export interface ReferentielsProjetDto {
  projets: ProjetFiltreDto[];
  typesLot: ElementReferentielProjetDto[];
  statutsLot: StatutLotProjetDto[];
  statutsFacture: ElementReferentielProjetDto[];
  categories: ElementReferentielProjetDto[];
  fournisseurs: ElementReferentielProjetDto[];
  entites: EntiteFiltreDto[];
}

/** `GET /api/projet/lots/totaux` : Σ des lignes de la liste, toutes pages. */
export interface TotauxLotsDto {
  nombreLots: number;
  coutPrevisionnelHT: number;
  coutPrevisionnelTTC: number;
  coutPrevisionnelNetAPayer: number;
  coutPrevisionnelRegle: number;
  coutPrevisionnelReste: number;
}

/** Corps de `POST /api/projet/lots`. */
export interface CreerLotRequest {
  genre: GenreLot;
  description: string;
  projetId: UUID;
  categorieId: UUID;
  typeId: UUID;
  fournisseurId?: UUID | null;
  deviseId?: UUID | null;
}

export interface TransitionLotDto {
  id: UUID;
  libelle: string | null;
  statutArriveeId: UUID | null;
  statutArriveeLibelle: string | null;
  statutArriveeCouleur: string | null;
}

export interface ExecutionTransitionLotDto {
  transitionId: UUID;
  notes?: string | null;
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
  /** Fraction 0–1 réalisée du marché HT (vue OMRAN `Achievement`). */
  avancement: number;
  coutPrevisionnelHT: number;
  coutPrevisionnelTTC: number;
  coutPrevisionnelNetAPayer: number;
  /** Règlements annulés compris, comme la vue OMRAN. */
  coutPrevisionnelRegle: number;
  coutPrevisionnelReste: number;
  statutCouleur: string | null;
  genre: GenreLot | null;
  notes: string | null;
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
  // FEATURE-lot-fiche-parite.md E1 : onglets de la fiche OMRAN (ratios en pourcentage 0–100).
  typeId: UUID | null;
  deviseId: UUID | null;
  deviseCode: string | null;
  categorieId: UUID | null;
  dateDebutBase: string | null;
  delaiBaseJours: number | null;
  dateFinBase: string | null;
  dateReportAppelOffres: string | null;
  dateRapportDepouillement: string | null;
  dateAchevementTravaux: string | null;
  dateRecollement: string | null;
  variationMassePct: number | null;
  tauxRemboursementApproPct: number | null;
  totalPoints: number | null;
  typePaiementId: UUID | null;
  typePaiementLibelle: string | null;
  remiseSurTravauxSupp: boolean;
  retenueSurTravauxSupp: boolean;
  saisieSurQuantites: boolean;
  avancementParLigne: boolean;
  dateResiliation: string | null;
  causeResiliation: string | null;
  descriptionDetaillee: string | null;
  montantAssuranceDEC: number | null;
  montantAssuranceTRC: number | null;
  /** Onglet Général (FEATURE-lot-fiche-suivi.md E2). */
  general: GeneralLotDto | null;
  /** Fraction 0–1, = `avancement` de la liste. */
  avancementFacture: number | null;
  /** Fraction 0–1. */
  avancementDecompte: number | null;
}

/** PATCH /api/projet/lots/{id} : champ absent = inchangé, null = vidé ; taux en pourcentage 0–100. */
export interface ModifierLotRequest {
  description: string;
  fournisseurId: UUID | null;
  deviseId: UUID | null;
  categorieId: UUID;
  typeId: UUID;
  dureeGarantieMois: number | null;
  tauxAvancePct: number | null;
  tauxRetenueGarantiePct: number | null;
  tauxCompteProrataPct: number | null;
  tauxAssuranceDECPct: number | null;
  montantAssuranceDEC: number | null;
  tauxAssuranceTRCPct: number | null;
  montantAssuranceTRC: number | null;
  tvaDefautPct: number | null;
  delaiPaiementJours: number | null;
  montantForfaitaireHT: number | null;
  montantForfaitaireTTC: number | null;
  dateDebutBase: string | null;
  delaiBaseJours: number | null;
  dateFinBase: string | null;
  dateLancementAppelOffres: string | null;
  dateRetraitDossiers: string | null;
  dateEcheanceRemiseOffres: string | null;
  dateReportAppelOffres: string | null;
  dateOuverturePlis: string | null;
  dateRapportDepouillement: string | null;
  dateAdjudication: string | null;
  dateSignatureMarche: string | null;
  dateOrdreService: string | null;
  dateLancementTravaux: string | null;
  dateAchevementTravaux: string | null;
  dateRecollement: string | null;
  variationMassePct: number | null;
  tauxRemboursementApproPct: number | null;
  totalPoints: number | null;
  typePaiementId: UUID | null;
  remiseSurTravauxSupp: boolean | null;
  retenueSurTravauxSupp: boolean | null;
  saisieSurQuantites: boolean | null;
  avancementParLigne: boolean | null;
  restitutionGarantieBloquee: boolean | null;
  dateResiliation: string | null;
  causeResiliation: string | null;
  descriptionDetaillee: string | null;
  notes: string | null;
}

// FEATURE-lot-fiche-suivi.md : onglets Général, Suivi, Retenues (montants à 2 décimales, taux en pourcentage 0–100).
export interface TrioDto {
  ht: number | null;
  tva: number | null;
  ttc: number | null;
}

export interface ColonneCoutDto {
  bordereau: TrioDto;
  approvisionnement: TrioDto;
  depassements: TrioDto;
  travauxSupplementaires: TrioDto;
  fluctuations: TrioDto;
  avenants: TrioDto;
  total: TrioDto;
  retenueNonRemboursable: number | null;
  remboursement: number | null;
  regulation: number | null;
  netAPayer: number | null;
  regle: number | null;
  reste: number | null;
}

export interface GeneralLotDto {
  marche: TrioDto;
  estimationBase: TrioDto;
  estimationConfidentielle: TrioDto;
  modificationBdpf: TrioDto;
  marcheAjuste: TrioDto;
  coutPrevisionnel: ColonneCoutDto;
  coutReel: ColonneCoutDto;
}

/** null = case absente de la colonne (avoirs : seuls montants et régulation ; décomptes : pas de régulation). */
export interface ColonneSuiviDto {
  montantHT: number | null;
  tva: number | null;
  montantTTC: number | null;
  approTTC: number | null;
  depassementsTTC: number | null;
  travauxSuppTTC: number | null;
  fluctuationsTTC: number | null;
  totalTTC: number | null;
  avenantsTTC: number | null;
  coutTTC: number | null;
  retenues: number | null;
  remboursement: number | null;
  regulation: number | null;
}

/** Avance sur décompte : taux, estBase, confidentielle et marche null. */
export interface BlocAvanceDto {
  taux: number | null;
  estBase: number | null;
  confidentielle: number | null;
  marche: number | null;
  validee: number | null;
  reglee: number | null;
  amortie: number | null;
  /** Réglée − amortie, peut être négatif. */
  resteAAmortir: number | null;
}

export interface RetenueGarantieDto {
  taux: number | null;
  estBase: number | null;
  confidentielle: number | null;
  marcheAjuste: number | null;
  avenants: number | null;
  factures: number | null;
  retenue: number | null;
  validee: number | null;
  restituee: number | null;
  resteARestituer: number | null;
  gestionnaireCompteProrata: boolean;
  aRembourser: number | null;
  remboursement: number | null;
}

export interface PartRetenueDto {
  avenant: number | null;
  total: number | null;
}

export interface BlocRetenueDto {
  taux: number | null;
  /** null pour le compte prorata. */
  quotePart: number | null;
  estBase: number | null;
  confidentielle: number | null;
  marcheAjuste: number | null;
  decompte: PartRetenueDto;
  facture: PartRetenueDto;
}

export interface ColonneRetenueDto {
  retenueForfaitaire: number | null;
  /** null côté décomptes. */
  penaliteCompteProrata: number | null;
  penaliteRg: number | null;
  blocageRg: number | null;
  penaliteAvance: number | null;
  retenues: number | null;
}

export interface RetenuesLotDto {
  compteProrata: BlocRetenueDto;
  assuranceDecennale: BlocRetenueDto;
  assuranceTrc: BlocRetenueDto;
  decompte: ColonneRetenueDto;
  facture: ColonneRetenueDto;
}

export interface SuiviLotDto {
  colonnes: { decomptes: ColonneSuiviDto; factures: ColonneSuiviDto; avoirs: ColonneSuiviDto };
  avanceMarche: BlocAvanceDto;
  avanceDecompte: BlocAvanceDto;
  retenueGarantie: RetenueGarantieDto;
  retenues: RetenuesLotDto;
}

export interface DemandeAchatLotDto {
  id: UUID;
  procedureAchat: string | null;
  statutDescription: string | null;
  statutCouleur: string | null;
  code: string | null;
  date: string | null;
  description: string | null;
  fournisseurId: UUID | null;
  fournisseurNom: string | null;
  notes: string | null;
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
  groupeId: UUID | null;
  /** WeightingRatio tel que stocké ; null si non saisi. */
  ponderation: number | null;
  /** Pourcentage 0–100. */
  tauxFODEC: number | null;
  categorieId: UUID | null;
  notes: string | null;
  /** Définitif : citée par un décompte (non supprimable) ; toujours faux à l'estimatif. */
  decomptee: boolean;
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
  groupes: GroupeBordereauDto[];
  /** Vrai si PUT …/bordereau serait accepté pour l'appelant. */
  modifiable: boolean;
  /** Pourcentage 0–100, null si vide. */
  tvaParDefaut: number | null;
  categorieParDefautId: UUID | null;
}

// FEATURE-lot-ecritures.md §4 : bordereau entier envoyé à l'enregistrement (ids des nouveaux nœuds générés par le front).
export interface GroupeSaisieDto {
  id: UUID;
  parentId: UUID | null;
  ordre: number | null;
  code: string | null;
  description: string | null;
  notes: string | null;
}

export interface LigneSaisieDto {
  id: UUID;
  groupeId: UUID | null;
  ordre: number | null;
  code: string | null;
  designation: string | null;
  unite: string | null;
  quantite: number | null;
  prixUnitaireHT: number | null;
  /** Pourcentage 0–100. */
  tauxTVA: number | null;
  /** Pourcentage 0–100. */
  tauxFODEC: number | null;
  categorieId: UUID | null;
  ponderation: number | null;
  notes: string | null;
}

export interface BordereauSaisieDto {
  groupes: GroupeSaisieDto[];
  lignes: LigneSaisieDto[];
}

// FEATURE-lot-sous-fenetres.md §4 : sous-fenêtres de la fiche lot, en lecture.
export interface GroupeBordereauDto {
  id: UUID;
  /** null à la racine. */
  parentId: UUID | null;
  ordre: number | null;
  code: string | null;
  description: string | null;
  stock: boolean;
  notes: string | null;
}

export interface BordereauEstimatifDto {
  lotId: UUID;
  /** Vrai si PUT …/bordereau-estimatif serait refusé (droit, statut du lot, multi-fournisseurs). */
  verrouille: boolean;
  groupes: GroupeBordereauDto[];
  lignes: LigneBordereauDto[];
  totaux: TotauxBordereauDto;
  /** Pourcentage 0–100, null si vide. */
  tvaParDefaut: number | null;
  categorieParDefautId: UUID | null;
}

export interface AvanceLotDto {
  id: UUID;
  code: string | null;
  statutId: UUID | null;
  statutDescription: string | null;
  statutCouleur: string | null;
  date: string | null;
  /** Négatif = avance à déduire. */
  netAPayer: number;
  regle: number;
  reste: number;
  deviseCode: string | null;
  notes: string | null;
}

export interface AvancesLotDto {
  surMarche: AvanceLotDto[];
  surDecompte: AvanceLotDto[];
}

export interface AvoirLotDto {
  id: UUID;
  date: string | null;
  code: string | null;
  statutDescription: string | null;
  statutCouleur: string | null;
  personneAContacter: string | null;
  montantHT: number | null;
  montantTVA: number | null;
  montantTTC: number | null;
  referenceBureauOrdre: string | null;
}

export interface AvenantLotDto {
  id: UUID;
  ordre: number | null;
  date: string | null;
  code: string | null;
  description: string | null;
  montantHT: number | null;
  montantTVA: number | null;
  montantTTC: number | null;
  netAPayer: number | null;
  /** Codes des factures séparés par « , » ; null sans facture. */
  factureCode: string | null;
}

export interface EcheanceRgLotDto {
  id: UUID;
  ordre: number | null;
  description: string | null;
  delaiJours: number | null;
  echeance: string | null;
  /** Pourcentage 0–100. */
  pourcentage: number | null;
}

export interface ReceptionLotDto {
  id: UUID;
  ordre: number | null;
  code: string | null;
  dateReception: string | null;
  demandeeParFournisseur: boolean;
  lieu: string | null;
  typeDescription: string | null;
  genreDescription: string | null;
  definitive: boolean;
}

export interface RemboursementsLotDto {
  echeances: EcheanceRgLotDto[];
  receptions: ReceptionLotDto[];
  remboursementsRg: AvanceLotDto[];
  remboursementsProrata: AvanceLotDto[];
}

/** Montants à 0 et avancements (fraction 0–1) null pour un mois sans donnée. */
export interface PointPrevisionDto {
  /** Premier jour du mois. */
  mois: string;
  estimation: number;
  avancementEstimation: number | null;
  prevision: number;
  avancementPrevision: number | null;
  reel: number;
  avancementReel: number | null;
}

export interface PrevisionsLotDto {
  lotId: UUID;
  debut: string | null;
  mois: PointPrevisionDto[];
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
  notes: string | null;
  /** « Ava. TTC » : AmountTTC − dépassement. */
  lignesTTC: number | null;
  /** « Ava. % » : 0 sans bordereau. */
  avaPct: number | null;
  /** « Dépa. TTC ». */
  depassementTTC: number | null;
  approvisionnementAPayer: number | null;
  fluctuationsAPayer: number | null;
  /** « Tot. TTC » = montantTTC + travauxSupplementaires + approvisionnementAPayer + fluctuationsAPayer. */
  totalTTC: number | null;
  /** Facturé ou pas le dernier du lot : lecture seule. */
  verrouille: boolean;
  motifVerrou: string | null;
  peutSupprimer: boolean;
}

/** `GET /api/projet/decomptes/totaux` : mêmes filtres que la liste, toutes pages. */
export interface TotauxDecomptesDto {
  nombre: number;
  montantHT: number;
  montantTTC: number;
  lignesTTC: number;
  depassementTTC: number;
  travauxSupplementaires: number;
  approvisionnementAPayer: number;
  fluctuationsAPayer: number;
  totalTTC: number;
  retenueGarantie: number;
  netAPayer: number;
  montantRegle: number;
  resteARegler: number;
}

export interface LigneApprovisionnementDto {
  id: UUID;
  ordre: number | null;
  code: string | null;
  designation: string | null;
  unite: string | null;
  quantite: number | null;
  prixUnitaireHT: number | null;
  tauxTVA: number | null;
  montantHT: number | null;
  montantTTC: number | null;
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
  okPourPaiement: boolean;
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
  ligneMarcheId: UUID | null;
  /** Quantité saisie (QuantityOrigin) : seule quantité lue par l'enregistrement. */
  quantiteSaisie: number | null;
}

/** Aperçu « lignes rechargées » : rien n'est écrit, d'où l'id null. */
export type LigneDecompteRechargee = Omit<LigneDecompteDto, 'id'> & { id: UUID | null };

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
  referenceInterne: string | null;
  avanceSurMontant: boolean;
  retenueGarantieSurMontant: boolean;
  assuranceDECSurMontant: boolean;
  assuranceTRCSurMontant: boolean;
  compteProrataSurMontant: boolean;
  /** Taux en pourcentage (ratio × 100). */
  tauxAvance: number | null;
  tauxAssuranceDEC: number | null;
  tauxAssuranceTRC: number | null;
  tauxCompteProrata: number | null;
  remboursementCompteProrata: number | null;
  cumulPrecedentTTC: number | null;
  tauxApprovisionnement: number | null;
  approvisionnementAncien: number | null;
  approvisionnementNouveau: number | null;
  fluctuationsAnciennes: number | null;
  resteAvance: number | null;
  resteAvanceSurDecompte: number | null;
  regularisation: number | null;
  approvisionnements: LigneApprovisionnementDto[];
  peutModifier: boolean;
  peutRecalculer: boolean;
  peutDefinirDernier: boolean;
}

/** Ligne de `EnregistrerDecompteRequest.lignes` ; `id` null = ligne de l'aperçu « lignes rechargées ». */
export interface LigneDecompteSaisie {
  id: UUID | null;
  ligneMarcheId: UUID | null;
  quantiteSaisie: number | null;
  coefficient: number | null;
}

/** `PUT /api/projet/decomptes/{id}` : champ absent ou null = valeur stockée gardée ; taux en pourcentage. */
export interface EnregistrerDecompteRequest {
  dateDocument?: string | null;
  referenceInterne?: string | null;
  notes?: string | null;
  fournisseurId?: UUID | null;
  avanceSurMontant?: boolean | null;
  retenueGarantieSurMontant?: boolean | null;
  assuranceDECSurMontant?: boolean | null;
  assuranceTRCSurMontant?: boolean | null;
  compteProrataSurMontant?: boolean | null;
  tauxAvance?: number | null;
  tauxRetenueGarantie?: number | null;
  tauxAssuranceDEC?: number | null;
  tauxAssuranceTRC?: number | null;
  tauxCompteProrata?: number | null;
  avanceAmortie?: number | null;
  retenueGarantie?: number | null;
  assuranceDEC?: number | null;
  assuranceTRC?: number | null;
  compteProrata?: number | null;
  avanceSurDecompte?: number | null;
  remboursementCompteProrata?: number | null;
  fluctuations?: number | null;
  tauxApprovisionnement?: number | null;
  regularisation?: number | null;
  dernier?: boolean | null;
  lignes?: LigneDecompteSaisie[] | null;
}

/** Filtres de `GET /api/projet/lots` ; `projetIds` vide = tous les projets visibles. */
export interface FiltresLots {
  projetIds?: UUID[];
  /** Aucun = tous les statuts. */
  statutIds?: UUID[];
  entiteId?: UUID;
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
  /** Société (« Entité ») du projet du lot. */
  societeId?: UUID;
}
