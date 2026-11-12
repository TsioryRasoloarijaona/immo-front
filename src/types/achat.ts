// Contrat de FEATURE-achat-lecture-factures.md §3 (pièces d'achat en lecture), noms du fil exacts.
import type { UUID } from '../types';

export type NatureDocumentAchat = 'INVOICE' | 'ORDER' | 'QUOTE' | 'DOCUMENT_TO_PAY' | 'DELIVRY' | 'REFUND';

export interface FiltresDocumentsAchat {
  natures?: NatureDocumentAchat[];
  statutIds?: UUID[];
  /** Un projet hors périmètre est ignoré (page vide s'il ne reste rien). */
  projetIds?: UUID[];
  lotId?: UUID;
  fournisseurId?: UUID;
  /** `YYYY-MM-DD`, inclus, sur la colonne de `champDate` (date de la pièce par défaut). */
  du?: string;
  au?: string;
  /** Reste à régler > 0,05 ; les pièces trop réglées n'y figurent pas. */
  nonSoldes?: boolean;
  search?: string;
  /** Statut « OK pour paiement » seulement ; absent ou false = pas de filtre. */
  okPourPaiement?: boolean;
  /** Pièces du module Projet (PRJ) seulement, comme Projet › Dépenses ; absent = tous les modules. */
  moduleProjet?: boolean;
  // FEATURE-achat-liste-parite.md E1.
  /** Croisé avec les sociétés habilitées : une société non habilitée est ignorée (page vide s'il ne reste rien). */
  societeIds?: UUID[];
  /** Se combine par ET avec `moduleProjet` ; code inconnu = 400. */
  modules?: ModuleAchat[];
  typeLotIds?: UUID[];
  /** true = IsClosed 1, false = 0 ou NULL, absent = toutes. */
  archive?: boolean;
  /** true = IsAccounted 1, false = 0 ou NULL, absent = toutes. */
  comptabilise?: boolean;
  /** Bornes incluses sur le montant à payer ; montantDe > montantA = page vide. */
  montantDe?: number;
  montantA?: number;
  /** Colonne portée par `du` / `au` ; défaut DATE_PIECE. */
  champDate?: ChampDateAchat;
  /** true : la colonne de `champDate` est renseignée, `du` / `au` ignorés. */
  dateRenseignee?: boolean;
}

export type ModuleAchat = 'BUY' | 'PRJ' | 'STL';
export type ChampDateAchat = 'DATE_PIECE' | 'ECHEANCE';

export interface SocieteAchatDto {
  id: UUID;
  code: string | null;
  description: string | null;
}

export interface ModuleAchatDto {
  code: ModuleAchat;
  libelle: string;
}

export interface TypeLotAchatDto {
  id: UUID;
  code: string | null;
  libelle: string | null;
}

export interface NatureAchatDto {
  code: NatureDocumentAchat;
  libelle: string;
}

export interface StatutAchatDto {
  id: UUID;
  code: string | null;
  description: string | null;
  okPourPaiement: boolean;
  valideComptabilite: boolean;
  ordre: number | null;
}

export interface ProjetAchatDto {
  id: UUID;
  code: string | null;
  description: string | null;
}

export interface FournisseurAchatDto {
  id: UUID;
  nom: string | null;
}

export interface ReferentielsAchatDto {
  natures: NatureAchatDto[];
  statuts: StatutAchatDto[];
  projets: ProjetAchatDto[];
  fournisseurs: FournisseurAchatDto[];
  /** Sociétés habilitées seulement ; vide sans habilitation. */
  societes: SocieteAchatDto[];
  modules: ModuleAchatDto[];
  typesLot: TypeLotAchatDto[];
}

export interface DocumentAchatListItemDto {
  id: UUID;
  code: string | null;
  /** DocType stocké ; une valeur hors liste est rendue telle quelle. */
  nature: string | null;
  natureLibelle: string | null;
  reference: string | null;
  description: string | null;
  dateDocument: string | null;
  dateEcheance: string | null;
  fournisseurId: UUID | null;
  fournisseurNom: string | null;
  projetId: UUID;
  projetCode: string | null;
  lotId: UUID | null;
  lotCode: string | null;
  societeCode: string | null;
  statutId: UUID | null;
  statutCode: string | null;
  statutDescription: string | null;
  okPourPaiement: boolean;
  montantHT: number | null;
  montantTVA: number | null;
  montantTTC: number | null;
  montantAPayer: number;
  /** Règlements annulés exclus. */
  montantRegle: number;
  /** Négatif si la pièce est trop réglée. */
  resteARegler: number;
  solde: boolean;
  /** Réglé au-delà d'un à-payer positif ; faux pour une pièce à déduire. */
  tropRegle: boolean;
  /** À payer < −0,05 : récupération d'avance sur décompte. */
  aDeduire: boolean;
  /** Décompte dont `PrjWorkingOut.BuyDocumentId` pointe la pièce ; null sans décompte. */
  decompteId: UUID | null;
  decompteCode: string | null;
  /** N° d'ordre du décompte dans son lot. */
  decompteNumero: number | null;
  // FEATURE-achat-liste-parite.md E2.
  /** Colonne « Entité » (CfgCompany.Description). */
  societeNom: string | null;
  moduleCode: ModuleAchat | null;
  moduleLibelle: string | null;
  typeLotId: UUID | null;
  typeLotLibelle: string | null;
  archive: boolean;
  comptabilise: boolean;
  referenceBureauOrdre: string | null;
  personneAContacter: string | null;
  dossierGroupement: string | null;
  /** Catégories de ventilation séparées par « , ». */
  categories: string | null;
  deviseCode: string | null;
  /** Toujours null (vide dans OMRAN). */
  dateAlerte: string | null;
  /** BC : HT ≤ Σ HT de ses factures et statut non terminé. */
  aCloturer: boolean;
  /** Nom de couleur .NET du statut. */
  statutCouleur: string | null;
  /** Agrégats du BC (FEATURE-achat-bc-agregats.md) ; null hors bon de commande. */
  agregats: AgregatsBonCommandeDto | null;
}

/** Agrégats d'un BC, calculés côté serveur sur ses pièces liées (BuyOrderId) ; montants signés. */
export interface AgregatsBonCommandeDto {
  factureHT: number;
  factureTVA: number;
  factureTTC: number;
  factureNetAPayer: number;
  livreHT: number;
  livreTTC: number;
  livreNetAPayer: number;
  resteALivrerHT: number;
  resteALivrerTTC: number;
  resteALivrerNetAPayer: number;
  avance: number;
  /** Fraction (0.2 = 20 %) ; null dans les totaux. */
  avanceTauxPrevu: number | null;
  /** Fraction ; null dans les totaux. */
  avanceTauxEffectif: number | null;
  avanceAmortie: number;
  avanceRegle: number;
  avanceReste: number;
  avanceResteAAmortir: number;
  garantieRetenue: number;
  garantieRestituee: number;
  garantieReste: number;
  regle: number;
  resteAPayerSurFacture: number;
  resteAPayerTotal: number;
  /** Codes séparés par « , » ; null sans BL ou dans les totaux. */
  bonsLivraisonCodes: string | null;
  facturesCodes: string | null;
  devisCode: string | null;
}

export interface LigneDocumentAchatDto {
  id: UUID;
  ordre: number | null;
  designation: string | null;
  unite: string | null;
  quantite: number | null;
  prixUnitaireHT: number | null;
  /** En % (20 = 20 %). */
  tauxTVA: number | null;
  remisePourcent: number | null;
  code: string | null;
  /** En % (FODECRatio × 100) ; 0 si absent. */
  fodecPourcent: number | null;
  /** Stocké (UnitPriceTTC). */
  prixUnitaireTTC: number | null;
  /** Calculés, pleine échelle : net = PU HT × (1 − remise) × (1 + FODEC). */
  prixUnitaireHTNet: number | null;
  totalHT: number | null;
  totalTVA: number | null;
  totalTTC: number | null;
}

// FEATURE-achat-fiche-parite.md E2-E4.
export interface RecapTvaAchatDto {
  /** En % (20 = 20 %). */
  tauxTVA: number | null;
  base: number | null;
  montantTVA: number | null;
}

export interface VentilationProjetAchatDto {
  projetId: UUID | null;
  projetCode: string | null;
  projetDescription: string | null;
  /** Fraction (0.6 = 60 %). */
  taux: number | null;
}

export interface PieceLieeAchatDto {
  /** null (comme code) pour une pièce hors périmètre : affichée sans lien. */
  id: UUID | null;
  code: string | null;
  dateDocument: string | null;
  statutCode: string | null;
  statutDescription: string | null;
  statutCouleur: string | null;
  reference: string | null;
  montantHT: number | null;
  montantTVA: number | null;
  montantTTC: number | null;
  projetCode: string | null;
  lotCode: string | null;
}

export interface AvoirAchatDto {
  id: UUID;
  code: string | null;
  dateDocument: string | null;
  lignes: LigneDocumentAchatDto[];
}

export interface RetenueAchatDto {
  /** Fraction (0.07 = 7 %). */
  ratio: number | null;
  montant: number | null;
}

/** Colonne droite OMRAN, lue telle quelle ; null = vide. */
export interface RetenuesAvancesAchatDto {
  amortissementAvance: RetenueAchatDto;
  resteAvance: number | null;
  retenueGarantie: RetenueAchatDto;
  assuranceTRC: RetenueAchatDto;
  assuranceDecennale: RetenueAchatDto;
  compteProrata: RetenueAchatDto;
  retenuesForfaitaires: number | null;
  avanceSurDecompte: number | null;
  approvisionnement: number | null;
  remboursementProrata: number | null;
  remboursementFluctuations: number | null;
}

export interface VentilationDocumentAchatDto {
  categorieCode: string | null;
  categorieDescription: string | null;
  /** Fraction (0.75 = 75 %). */
  taux: number | null;
}

export interface HistoriqueDocumentAchatDto {
  date: string | null;
  statutCode: string | null;
  statutDescription: string | null;
  utilisateur: string | null;
  note: string | null;
  /** BuyDocumentWorkFlow.Description ; null à la création. */
  transition: string | null;
}

export interface ReglementDocumentAchatDto {
  id: UUID;
  code: string | null;
  dateDocument: string | null;
  typeCode: string | null;
  typeDescription: string | null;
  montant: number | null;
  /** Listé mais exclu du réglé. */
  annule: boolean;
  // Pointage : bon de commande seulement, null sinon (FEATURE-achat-fiche-ecritures.md E-B5).
  etat: string | null;
  datePointage: string | null;
  datePointagePrevue: string | null;
  pointageReporte: boolean | null;
  datePointageReportee: string | null;
  montantBrut: number | null;
}

// FEATURE-achat-impayes.md §4.
export interface TotauxDocumentsAchatDto {
  /** = totalElements de la liste pour les mêmes filtres. */
  nombre: number;
  montantTTC: number;
  montantAPayer: number;
  montantRegle: number;
  /** Σ à payer − Σ réglé, signé. */
  resteARegler: number;
  nombreARegler: number;
  /** Σ des restes > 0,05 seulement : ce qui est vraiment dû. */
  resteDu: number;
  montantHT: number;
  montantTVA: number;
  /** Σ des agrégats des BC du jeu (ratios et codes null) ; null sans BC. */
  agregats: AgregatsBonCommandeDto | null;
}

export interface FiltresSoldesFournisseurs {
  /** Un projet hors périmètre est ignoré. */
  projetIds?: UUID[];
  societeCodes?: string[];
  /** Nom du fournisseur, espaces et casse ignorés. */
  search?: string;
  /** Masque les lignes soldées. */
  nonSoldes?: boolean;
}

export interface SoldeFournisseurDto {
  /** null sur la ligne de total. */
  fournisseurId: UUID | null;
  fournisseurNom: string | null;
  societeCode: string | null;
  nombrePieces: number;
  montantAPayer: number;
  montantRegle: number;
  /** Signé. */
  resteARegler: number;
  solde: boolean;
  nombreARegler: number;
  nombreValideesARegler: number;
  /** Payable tout de suite : restes > 0,05 des pièces « OK pour paiement ». */
  resteValideARegler: number;
  /** Σ des à-payer négatifs, ≤ 0. */
  montantADeduire: number;
}

export interface SoldesFournisseursDto {
  lignes: SoldeFournisseurDto[];
  total: SoldeFournisseurDto;
}

export interface DocumentAchatDetailDto extends DocumentAchatListItemDto {
  notes: string | null;
  regularisation: number | null;
  timbreFiscal: number | null;
  valideComptabilite: boolean;
  entiteCode: string | null;
  entiteDescription: string | null;
  dateCreation: string | null;
  creePar: string | null;
  dateModification: string | null;
  modifiePar: string | null;
  lignes: LigneDocumentAchatDto[];
  ventilation: VentilationDocumentAchatDto[];
  historique: HistoriqueDocumentAchatDto[];
  reglements: ReglementDocumentAchatDto[];
  declencheurId: UUID | null;
  declencheurNom: string | null;
  dateLivraisonSouhaitee: string | null;
  note2: string | null;
  devisSelectionne: boolean;
  /** Σ TTC des avoirs visibles ; affiché, jamais soustrait (montantAPayer est déjà net). */
  avoirsMontant: number;
  retenuesAvances: RetenuesAvancesAchatDto;
  /** null si absent ou non visible (de même pour bonCommande*, factureSource*). */
  devisOrigineId: UUID | null;
  devisOrigineCode: string | null;
  bonCommandeId: UUID | null;
  bonCommandeCode: string | null;
  factureSourceId: UUID | null;
  factureSourceCode: string | null;
  recapTva: RecapTvaAchatDto[];
  ventilationProjets: VentilationProjetAchatDto[];
  /** Vides hors bon de commande. */
  bonsLivraison: PieceLieeAchatDto[];
  factures: PieceLieeAchatDto[];
  /** Vide hors facture. */
  avoirs: AvoirAchatDto[];
  /** Actions d'écriture ouvertes au compte (FEATURE-achat-fiche-ecritures.md E-B6) : seule source des boutons. */
  actions: ActionsPieceAchatDto;
}

export interface TransitionPermiseAchatDto {
  statutId: UUID;
  statutCode: string | null;
  statutDescription: string | null;
  noteObligatoire: boolean;
}

export interface ActionsPieceAchatDto {
  peutSupprimer: boolean;
  peutAffecter: boolean;
  transitions: TransitionPermiseAchatDto[];
}

export interface TransitionPieceAchatRequest {
  statutId: UUID;
  note?: string | null;
}

export interface AffecterBonCommandeRequest {
  bonCommandeId: UUID;
}
