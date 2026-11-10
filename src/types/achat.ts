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
  /** `YYYY-MM-DD`, inclus, sur la date de la pièce. */
  du?: string;
  au?: string;
  /** Reste à régler > 0,05 ; les pièces trop réglées n'y figurent pas. */
  nonSoldes?: boolean;
  search?: string;
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
  tropRegle: boolean;
  /** Décompte dont `PrjWorkingOut.BuyDocumentId` pointe la pièce ; null sans décompte. */
  decompteId: UUID | null;
  decompteCode: string | null;
  /** N° d'ordre du décompte dans son lot. */
  decompteNumero: number | null;
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
