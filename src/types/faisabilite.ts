// Miroir des DTO de FEATURE-patrimoine-faisabilite.md (études de faisabilité, lot P8a). Taux en fraction,
// durées et délais en mois, dates ISO `YYYY-MM-DDTHH:mm:ss`.
import type { UUID } from '../types';

/** Bloc A et phases : entrées saisies et valeurs calculées par le serveur (`POST /calcul`, `fiche.valeurs`). */
export interface ValeursFaisabilite {
  superficie: number | null;
  coefEquipements: number | null;
  superficieEquipements: number | null;
  superficieNette: number | null;
  coefEmprise: number | null;
  empriseAuSol: number | null;
  cuf: number | null;
  plancherCouvert: number | null;
  coefVendable: number | null;
  plancherVendable: number | null;
  surfaceNonBatie: number | null;
  tauxTvaTerrain: number | null;
  prixAchatM2: number | null;
  prixAchatM2Ht: number | null;
  prixAchatM2Tva: number | null;
  prixTerrain: number | null;
  prixTerrainHt: number | null;
  prixTerrainTva: number | null;
  tauxFraisEnregistrement: number | null;
  fraisEnregistrement: number | null;
  fraisEnregistrementHt: number | null;
  fraisEnregistrementTva: number | null;
  tauxAutresFraisTerrain: number | null;
  autresFraisTerrain: number | null;
  autresFraisTerrainHt: number | null;
  autresFraisTerrainTva: number | null;
  coutTotalTerrain: number | null;
  coutTotalTerrainHt: number | null;
  coutConstructionM2Bati: number | null;
  coutBati: number | null;
  coutConstructionM2NonBati: number | null;
  coutNonBati: number | null;
  tauxAutresFraisExecution: number | null;
  autresFraisExecution: number | null;
  debutAchatTerrain: string | null;
  dureeAchatTerrain: number | null;
  finAchatTerrain: string | null;
  delaiAchatTerrainPeriodeValidation: number | null;
  debutPeriodeValidation: string | null;
  dureePeriodeValidation: number | null;
  finPeriodeValidation: string | null;
  delaiPeriodeValidationPermisBatir: number | null;
  debutPermisBatir: string | null;
  dureePermisBatir: number | null;
  finPermisBatir: string | null;
  delaiPermisBatirEtudes: number | null;
  debutEtudes: string | null;
  dureeEtudes: number | null;
  finEtudes: string | null;
  delaiPermisBatirTravaux: number | null;
  debutTravaux: string | null;
  dureeTravaux: number | null;
  finTravaux: string | null;
  delaiTravauxConcretisation: number | null;
  debutConcretisation: string | null;
  dureeConcretisation: number | null;
  finConcretisation: string | null;
  delaiTravauxFinalisation: number | null;
  debutFinalisation: string | null;
  dureeFinalisation: number | null;
  finFinalisation: string | null;
  /** Messages Verif OMRAN dans l'ordre ; toujours vide dans la fiche. */
  erreurs: string[];
}

/** Bilan stocké par OMRAN, lecture seule (rendu vivant en P8b). */
export interface BilanEtudeDto {
  chiffreAffaires: number | null;
  coutExecution: number | null;
  coutExecutionHt: number | null;
  coutTotal: number | null;
  coutTotalHt: number | null;
  coutRevientM2: number | null;
  prixVenteM2: number | null;
  pourcentageConcretisation: number | null;
  montantConcretisation: number | null;
  montantFinalisation: number | null;
  coutFinancement: number | null;
  tauxAutofinancement: number | null;
  montantAutofinancement: number | null;
  tauxFinancementClient: number | null;
  tauxFinancementCredit: number | null;
  margeBrute: number | null;
  tauxIs: number | null;
  montantIs: number | null;
  margeNette: number | null;
  rentabiliteCoutProjet: number | null;
  rentabiliteChiffreAffaires: number | null;
  rentabiliteFondsPropres: number | null;
}

/** Unité de base de l'étude ; en écriture `id` absent = création, `uniteCode` / `uniteLibelle` ignorés. */
export interface LigneUniteEtudeDto {
  /** PKey ; dans `/calcul`, identifiant provisoire libre reliant les ventilations. */
  id?: UUID | null;
  sorting: number | null;
  uniteBaseId: UUID;
  uniteCode?: string | null;
  uniteLibelle?: string | null;
  quantite: number | null;
}

export interface VentilationEtudeDto {
  id?: UUID | null;
  /** `LigneUniteEtudeDto.id` d'une unité de cette étude. */
  uniteEtudeId: UUID;
  quantite: number | null;
  poids: number | null;
}

/** Tranche de l'étude ; le front préremplit les dates d'une tranche neuve depuis les phases de l'étude. */
export interface LigneTrancheEtudeDto {
  id?: UUID | null;
  code: string;
  sorting: number | null;
  trancheId: UUID | null;
  trancheLibelle?: string | null;
  /** Somme des poids = 1 exactement (Verif). */
  poids: number | null;
  debutTravaux: string | null;
  finTravaux: string | null;
  debutCommercialisation: string | null;
  finCommercialisation: string | null;
  finConcretisation: string | null;
  debutFinalisation: string | null;
  dateLivraison: string | null;
  datePermisHabiter: string | null;
  unites: VentilationEtudeDto[];
}

export interface EtudeFaisabiliteListeDto {
  id: UUID;
  code: string;
  description: string;
  dateDocument: string | null;
  societeId: UUID | null;
  societeLibelle: string | null;
  terrainLibelle: string | null;
  statutId: UUID | null;
  statutLibelle: string | null;
  /** Nom de couleur .NET (ex. `Green`). */
  statutCouleur: string | null;
  bloquee: boolean;
  superficie: number | null;
  coutTotalTerrain: number | null;
  /** Charge TTC. */
  coutTotal: number | null;
  chiffreAffaires: number | null;
  /** Fonds propres TTC. */
  montantAutofinancement: number | null;
  margeNette: number | null;
  montantConcretisation: number | null;
  montantFinalisation: number | null;
  pourcentageConcretisation: number | null;
  /** Retours : null si le dénominateur HT est nul. */
  rentabiliteCoutProjet: number | null;
  rentabiliteChiffreAffaires: number | null;
  rentabiliteFondsPropres: number | null;
}

export interface EtudeFaisabiliteDto {
  id: UUID;
  code: string;
  description: string;
  dateDocument: string | null;
  societeId: UUID | null;
  societeLibelle: string | null;
  terrainId: UUID | null;
  terrainLibelle: string | null;
  /** LndLandId, lecture seule. */
  terrainFoncierId: UUID | null;
  descriptionTerrain: string | null;
  statutId: UUID | null;
  statutLibelle: string | null;
  statutCouleur: string | null;
  /** Bloquée : toute écriture répond 409 avant Débloquer. */
  bloquee: boolean;
  /** Calculé par le serveur (unités à catégorie d'article, non surface), lecture seule. */
  nombreArticlesAVendre: number | null;
  proportionTerrainPourTva: boolean | null;
  tauxTvaDefaut: number | null;
  tauxTvaInterets: number | null;
  ecartTypeTravaux: number | null;
  ecartTypeConcretisation: number | null;
  ecartTypeFinalisation: number | null;
  delaiRetourJours: number | null;
  tauxRetenueGarantie: number | null;
  tauxApplicationRetenueGarantie: number | null;
  pourcentageConcretisation: number | null;
  tauxIs: number | null;
  prixVenteM2: number | null;
  valeurs: ValeursFaisabilite;
  /** Recalculé par le serveur à chaque écriture de l'étude. */
  bilan: BilanEtudeDto;
  unites: LigneUniteEtudeDto[];
  tranches: LigneTrancheEtudeDto[];
  userCreate: string | null;
  userCreateDateTime: string | null;
  userUpdate: string | null;
  userUpdateDateTime: string | null;
}

/**
 * Corps de `POST`, `PATCH` et `POST /calcul`. PATCH : absent = inchangé. Paires coefficient ↔ montant
 * (`coefEquipements`/`superficieEquipements`, `coefEmprise`/`empriseAuSol`, `cuf`/`plancherCouvert`,
 * `coefVendable`/`plancherVendable`, `prixAchatM2`/`prixTerrain`) : l'un ou l'autre, le coefficient gagne.
 */
export interface SaisieEtudeDto {
  code?: string;
  description?: string;
  dateDocument?: string;
  societeId?: UUID;
  terrainId?: UUID;
  descriptionTerrain?: string;
  proportionTerrainPourTva?: boolean;
  tauxTvaDefaut?: number;
  tauxTvaInterets?: number;
  superficie?: number;
  coefEquipements?: number;
  superficieEquipements?: number;
  coefEmprise?: number;
  empriseAuSol?: number;
  cuf?: number;
  plancherCouvert?: number;
  coefVendable?: number;
  plancherVendable?: number;
  prixAchatM2?: number;
  prixTerrain?: number;
  tauxTvaTerrain?: number;
  tauxFraisEnregistrement?: number;
  tauxAutresFraisTerrain?: number;
  coutConstructionM2Bati?: number;
  coutConstructionM2NonBati?: number;
  tauxAutresFraisExecution?: number;
  debutAchatTerrain?: string;
  dureeAchatTerrain?: number;
  dureePeriodeValidation?: number;
  dureePermisBatir?: number;
  dureeEtudes?: number;
  dureeTravaux?: number;
  dureeConcretisation?: number;
  dureeFinalisation?: number;
  delaiAchatTerrainPeriodeValidation?: number;
  delaiPeriodeValidationPermisBatir?: number;
  delaiPermisBatirEtudes?: number;
  delaiPermisBatirTravaux?: number;
  delaiTravauxConcretisation?: number;
  delaiTravauxFinalisation?: number;
  ecartTypeTravaux?: number;
  ecartTypeConcretisation?: number;
  ecartTypeFinalisation?: number;
  delaiRetourJours?: number;
  tauxRetenueGarantie?: number;
  tauxApplicationRetenueGarantie?: number;
  /** Fraction 0-1 (400 sinon). */
  pourcentageConcretisation?: number;
  /** Fraction 0-1 (400 sinon). */
  tauxIs?: number;
  prixVenteM2?: number;
  /** PATCH : `terrainId`, `debutAchatTerrain` → NULL ; nombre → 0 ; texte → "". */
  champsAVider?: string[];
  /** `/calcul` seulement : grilles à contrôler par Verif. */
  unites?: LigneUniteEtudeDto[];
  tranches?: LigneTrancheEtudeDto[];
}

// ------------------------------------------------------------------ P8b-1 : financement (FEATURE-patrimoine-faisabilite-workflow.md §1)

/** Remboursement ; si taux et intérêts sont envoyés, le taux gagne ; `montantARegler` jamais saisi. */
export interface RemboursementFaisabiliteDto {
  id?: UUID | null;
  date: string | null;
  montantBase: number | null;
  tauxInteret?: number | null;
  montantInterets?: number | null;
  /** Calculé : base + intérêts. */
  montantARegler?: number | null;
}

/** Crédit (« Déblocage de crédit ») ; `montantARegler`, `totalInterets`, `ecartBase` calculés (ignorés en écriture). */
export interface FinancementFaisabiliteDto {
  id?: UUID | null;
  description: string | null;
  dateDeblocage: string | null;
  montant: number | null;
  nombreRemboursements: number | null;
  /** < 1 devient 1. */
  periodiciteMois: number | null;
  periodeGraceMois: number | null;
  tauxCharge: number | null;
  montantARegler?: number | null;
  totalInterets?: number | null;
  /** Σ bases − montant débloqué : information (orange), jamais un refus. */
  ecartBase?: number | null;
  remboursements: RemboursementFaisabiliteDto[];
}

/** Bouton « Générer » : rien n'est écrit. */
export interface EcheancierDemandeDto {
  dateDeblocage: string | null;
  montant: number | null;
  nombreRemboursements: number | null;
  periodiciteMois: number | null;
  periodeGraceMois: number | null;
  tauxCharge: number | null;
}

// ------------------------------------------------------------------ P8b-1 : bilan (§2.1-2.3)

/** Ligne saisie, clé = catégorie ; priorité ratio > montantHt > montant ; unité OU référence. */
export interface SaisiePrevisionDto {
  categorieId: UUID;
  uniteEtudeId?: UUID | null;
  categorieReferenceId?: UUID | null;
  ratio?: number | null;
  montantHt?: number | null;
  montant?: number | null;
  /** Absent = TVA par défaut de l'étude. */
  tauxTva?: number | null;
  estPourProjet?: boolean | null;
  /** « Traiter au début du projet ». */
  dateApplication?: string | null;
}

export interface VentilationPrevisionDto {
  trancheEtudeId: UUID;
  trancheCode: string | null;
  montantHt: number | null;
  montant: number | null;
}

/** Nœud de l'arbre à plat (parent avant enfants). */
export interface LignePrevisionDto {
  categorieId: UUID;
  parentId: UUID | null;
  code: string | null;
  libelle: string | null;
  estRecette: boolean;
  profondeur: number;
  uniteEtudeId: UUID | null;
  uniteCode: string | null;
  categorieReferenceId: UUID | null;
  categorieReferenceLibelle: string | null;
  ratio: number | null;
  tauxTva: number | null;
  montantHtPropre: number | null;
  montantPropre: number | null;
  /** Totaux du nœud, enfants compris. */
  montantHt: number | null;
  montant: number | null;
  poids: number | null;
  estPourProjet: boolean;
  dateApplication: string | null;
  indivise: boolean;
  /** Montant imposé (terrain, frais, intérêts) : non modifiable. */
  verrouillee: boolean;
  ventilation: VentilationPrevisionDto[];
}

export interface TotauxPrevisionsDto {
  depenseHt: number | null;
  depense: number | null;
  recetteHt: number | null;
  recette: number | null;
  /** Avertissement « terrain non inclus : relations de trésorerie non configurées ». */
  terrainNonInclus: boolean;
}

export interface BilanFaisabilitePrevisionsDto {
  lignes: LignePrevisionDto[];
  totaux: TotauxPrevisionsDto;
  bilan: BilanEtudeDto;
}

export interface CategorieBilanDto {
  id: UUID;
  code: string | null;
  libelle: string | null;
  parentId: UUID | null;
  estRecette: boolean;
  ordre: number | null;
}

// ------------------------------------------------------------------ P8b-1 : trésorerie (§2.5-2.6)

export interface MontantTrancheDto {
  trancheCode: string | null;
  credit: number | null;
  debit: number | null;
}

export interface MoisTresorerieDto {
  /** `YYYY-MM-01`. */
  mois: string;
  concretisation: number | null;
  finalisation: number | null;
  depense: number | null;
  garantie: number | null;
  financement: number | null;
  remboursement: number | null;
  depenseProjet: number | null;
  /** Cumul des crédits − débits. */
  solde: number | null;
  tranches: MontantTrancheDto[];
}

export interface LigneTresorerieDto {
  date: string | null;
  /** Concretisation, Finalization, Expense, ExpenseBackGuarantee, Funding, Refunding, ProjectExpense. */
  type: string;
  libelle: string | null;
  debit: number | null;
  credit: number | null;
  trancheCode: string | null;
}

export interface TresorerieFaisabiliteDto {
  mois: MoisTresorerieDto[];
  lignes: LigneTresorerieDto[];
}

/** Écarts-types ≥ 0,5 ; absent = valeur de l'étude. */
export interface ApercuTresorerieDto {
  ecartTypeTravaux?: number | null;
  ecartTypeConcretisation?: number | null;
  ecartTypeFinalisation?: number | null;
  avecFinancement?: boolean | null;
}

/** Filtres de `GET /api/etudes-faisabilite` ; absent = pas de filtre. */
export interface FiltresEtudes {
  societeId?: UUID;
  statutId?: UUID;
  search?: string;
}
