// Shapes mirror the JSON export in /public/data (see json/*.json), which in turn
// mirrors the legacy Omran Estate SQL Server schema. Fields kept close to source
// naming so the eventual Spring Boot API can slot in without a remap.

export interface Person {
  id: string;
  code: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  idNumber: string;
  idPlace: string;
  idDate: string | null;
  birthDate: string | null;
  birthPlace: string;
  profession: string;
  isProspect: boolean;
  isOldCustomer: boolean;
  nbrChildren: number;
  fatherName: string;
  motherName: string;
  _isMock?: boolean;
}

export interface ArticleRef {
  id: string;
  code: string;
  description: string;
  area: number;
  salePrice: number;
  type: string;
  category: string;
  isUnderItem: boolean;
  /** Titre foncier number (e.g. "70075/64"). Real when cross-resolved against
   * the full Article record by id (rare in this 50-row sample — see
   * resolveArticleTitleNumber in lib/domain.tsx); otherwise a deterministic
   * placeholder so the field isn't left blank. See
   * instructions/FIX-dossier-vente-corrections.md §2. */
  titleNumber?: string;
  /** Chambre-count descriptor (e.g. "1 CHAMBRES+") — distinct from `type`
   * (APPARTEMENT/VILLA/…). Not present in the Omran export at all for this
   * sample; derived client-side, see articleTypology in lib/domain.tsx. */
  typology?: string;
  _isMock?: boolean;
}

export interface Prospection {
  id: string;
  code: string;
  date: string | null;
  displayName: string;
  phone: string;
  email: string;
  prospect: Person | null;
  trancheId: string | null;
  articleId: string | null;
  article: ArticleRef | null;
  budgetMin: number;
  budgetMax: number;
  areaMin: number;
  areaMax: number;
  fundingOwnBase: number;
  fundingCredit: number;
  fundingOther: number;
  notes: string;
  nature: string;
  origin: string;
  support: string;
  isClosed: boolean;
  closingDate: string | null;
  closingReason: string;
  closingReasonText: string;
  isOldCustomer: boolean;
  alertValidityDate: string | null;
  alertMessage: string;
  commercialId: string;
  commercial: string | null;
  createdBy: string;
  createdAt: string | null;
  updatedBy: string;
  updatedAt: string | null;
}

export interface Dossier {
  id: string;
  code: string;
  date: string | null;
  description: string;
  client: Person | null;
  commercial: string;
  articleId: string | null;
  article: ArticleRef | null;
  area: number;
  globalArea: number;
  unitCost: number;
  itemPrice: number;
  underItemsPrice: number;
  priceBeforeDiscount: number;
  discount: number;
  discountAmount: number;
  priceAfterDiscount: number;
  price: number;
  vatRatio: number;
  priceHT: number;
  totalToPay: number;
  /** "prix_contractuel" — a separate figure from `price` (prix retenu TTC),
   * even when the two coincide, as observed on the real screen. Never
   * derive this from `price`. See
   * instructions/FIX-dossier-vente-corrections.md §1. */
  contractualPrice: number | null;
  probabilityOfFinalisation: number;
  paymentMethod: string;
  commissionRate: number;
  reservationDate: string | null;
  agreementDate: string | null;
  agreementSavingDate: string | null;
  agreementDatePrevisionel: string | null;
  ownershipCertificateDate: string | null;
  receptionDate: string | null;
  creditApprovalDate: string | null;
  creditPossessionDate: string | null;
  advanceDate: string | null;
  insuranceDate: string | null;
  bankRecordDate: string | null;
  interventionDate: string | null;
  revival1: string | null;
  revival2: string | null;
  revival1ValidityDate: string | null;
  revival2ValidityDate: string | null;
  deliveryDateReal: string | null;
  precisionActDate: string | null;
  contractPrintDate: string | null;
  cancelDate: string | null;
  cancelDescription: string;
  finalTitleNumber: string;
  finalTitleDate: string | null;
  isAccounted: boolean;
  isOldCustomer: boolean;
  isPenaltyDisabled: boolean;
  isConfirmedAgreementDate: boolean;
  prospectionId: string | null;
  notes: string;
  createdBy: string;
  createdAt: string | null;
  updatedBy: string;
  updatedAt: string | null;
  statusIdRaw?: string;
  /** Demo-only: this dossier's client was deliberately reassigned to share an
   * existing client across dossiers so the Clients page can demonstrate
   * multi-dossier aggregation — the source sample generates one unique mock
   * client per dossier otherwise. See instructions/FIX-clients-and-module-switcher.md. */
  _demoSharedClient?: boolean;
  /** Set when this dossier was created through the multi-step creation
   * wizard's "Échéancier" step. Prototype-only field — see EcheancierLine. */
  echeancier?: EcheancierLine[];
  /** Additional lots reserved together with `article` in the same dossier
   * (the wizard supports selecting several lots, but the schema — mirroring
   * Omran's — only has one primary `article`/`articleId` per dossier).
   * Prototype-only. */
  additionalLots?: ArticleRef[];
}

export interface TrancheRules {
  advancePercent: number;
  concretisationPercent: number;
  beforeReservationAmount: number;
  defaultExpenseAmount: number;
  cancellationPenalityPercent: number;
  cancellationPenalityBasedOnItemPrice: boolean;
  articleTransferPenality: number;
  sliceTransferPenality: number;
  customerTransferPenality: number;
  syndicAmount: number;
  syndicPeriod: number;
  warrantyDelay: number;
  warrantyDelayAdded: number;
  agreementFirstDelay: number;
  agreementSecondDelay: number;
  agreementFirstPenaltyPercent: number;
  agreementSecondPenaltyPercent: number;
  paymentBalanceDelay: number;
  withdrawalDelay: number;
  interventionMinimumDelai: number;
  maxVisitNumber: number;
  isWithGiftForProposer: boolean;
  isWithGiftForOldCustomer: boolean;
  isWithGiftForProspectionOrigin: boolean;
  accumulatedGifts: boolean;
  isWithVerifMaxEcheanceDelai: boolean;
  maxEcheanceDelai: number;
  isWithVerifCredit: boolean;
  creditPercent: number;
  commerceTribunal: string;
  cancellationRightCode: string;
}

export interface Tranche {
  id: string;
  code: string;
  description: string;
  programme: string;
  standing: string;
  address: string;
  city: string;
  coveredFloorArea: number;
  workStartDate: string | null;
  workEndDate: string | null;
  marketingStartDate: string | null;
  marketingEndDate: string | null;
  occupancyPermitsDate: string | null;
  deliveryDate: string | null;
  receptionDate: string | null;
  endDateConcretisation: string | null;
  startDateFinalisation: string | null;
  revival1Date: string | null;
  isForSale: boolean;
  isForRent: boolean;
  isForProject: boolean;
  isForBuy: boolean;
  isForSav: boolean;
  rules: TrancheRules;
  createdBy: string;
  createdAt: string | null;
}

export interface Article {
  id: string;
  code: string;
  description: string;
  address: string;
  area: number;
  notes: string;
  salePrice: number;
  salePriceHT: number;
  purchaseCost: number;
  type: string;
  category: string;
  isUnderItem: boolean;
  titleNumber: string;
  titleDate: string | null;
  isTitled: boolean;
  deliveryDate: string | null;
  reservationDate: string | null;
  folderId: string | null;
  vat: number;
  createdAt: string | null;
}

/** A single instalment paid against an EcheancierLine — the expandable
 * "sous-lignes de paiement" seen on the real screen. */
export interface EcheancierPayment {
  id: string;
  date: string | null;
  montant: number;
  notes?: string;
}

/** A line of a Dossier's Échéancier. What was originally spec'd as two
 * separate wizard steps — "Plan de financement" (source of funds) then
 * "Échéancier" (call-up schedule) — turned out on the real screen to be one
 * and the same: each financing-category line carries its own settlement
 * tracking (montant/réglé/reste), an invoice reference, and expandable
 * payment sub-lines. See
 * instructions/FIX-dossier-vente-corrections.md §3 (supersedes the two-step
 * split originally described in FEATURE-plan-financement.md). */
export interface EcheancierLine {
  id: string;
  /** Code from FINANCING_CATEGORIES (src/lib/financing.ts), e.g. "AVANCE". */
  categorie: string;
  /** Total due for this line. */
  montant: number;
  /** Échéance (due) date. */
  date: string | null;
  /** "Référence de facture" — free text, optional (not every line is invoiced). */
  invoiceRef?: string;
  notes: string;
  /** Expandable payment sub-lines; réglé = sum(payments.montant), reste = montant - réglé. */
  payments: EcheancierPayment[];
}

export interface Communication {
  id: string;
  date: string | null;
  description: string;
  isIncoming: boolean;
  /** Follow-up reminder date (was misleadingly named alertValidityDate pre-export). */
  alertDate: string | null;
  /** The actual call/visit report text (was misleadingly named alertMessage pre-export). */
  report: string;
  user: string;
  prospectionId: string | null;
  folderId: string | null;
  tierId: string | null;
  actionType: string;
  isUnpaid: boolean;
  isSystem: boolean;
  _prospectionLinkIsMock?: boolean;
  /** RDV scheduling — prototype-only local state, not part of the source export. */
  appointmentDate?: string | null;
  appointmentLabel?: string | null;
}

export interface SettlementLine {
  [key: string]: unknown;
}

export interface Settlement {
  id: string;
  code: string;
  date: string | null;
  echeanceDate: string | null;
  settlementDate: string | null;
  description: string;
  amount: number;
  isCredit: boolean;
  status: string;
  notes: string;
  tierId: string | null;
  tier: string;
  category: string;
  isAccounted: boolean;
  lines: SettlementLine[];
  createdBy: string;
  createdAt: string | null;
}

export interface Gift {
  code: string;
  description: string;
  price: number;
}

export interface Lookups {
  prospectionOrigins: string[];
  prospectionKinds: string[];
  prospectionClosingReasons: string[];
  trancheStandings: string[];
  actionMessageTypes: string[];
  paymentMethods: string[];
  gifts: Gift[];
}

export type BadgeTone = 'neutral' | 'info' | 'progress' | 'success' | 'warning' | 'amber';

export interface DerivedDossierStatus {
  label: string;
  tone: BadgeTone;
}
