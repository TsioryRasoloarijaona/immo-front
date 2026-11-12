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
}
