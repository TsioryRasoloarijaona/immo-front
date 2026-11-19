// Demandes internes d'achat (BuySelection), FEATURE-n6-demandes-achat.md.
import type { UUID } from '../types';
import type { SecondValideur } from './projet';

export interface ElementDemandeAchat {
  id: UUID;
  code: string | null;
  libelle: string | null;
}

export interface StatutDemandeAchat {
  id: UUID;
  libelle: string | null;
  couleur: string | null;
}

export interface DemandeAchatLigne {
  id: UUID;
  procedure: string | null;
  statut: StatutDemandeAchat | null;
  code: string | null;
  date: string | null;
  description: string | null;
  entite: string | null;
  projet: string | null;
  lot: string | null;
  module: string | null;
  fournisseur: string | null;
  categorie: string | null;
  declencheur: string | null;
  notes: string | null;
  montantEstimeTTC: number | null;
  estDerniere: boolean;
}

export interface DatesDemandeAchat {
  lancement?: string | null;
  retraitDossier?: string | null;
  echeanceOffres?: string | null;
  report?: string | null;
  ouverturePlis?: string | null;
  rapportDepouillement?: string | null;
  adjudication?: string | null;
  signatureMarche?: string | null;
}

export interface PhasesDemandeAchat {
  bordereau: boolean;
  preselection: boolean;
  offres: boolean;
  selection: boolean;
}

export interface DemandeAchatFiche {
  id: UUID;
  code: string | null;
  date: string | null;
  description: string | null;
  descriptionLongue: string | null;
  procedure: ElementDemandeAchat | null;
  statut: StatutDemandeAchat | null;
  societe: ElementDemandeAchat | null;
  projet: ElementDemandeAchat | null;
  lot: ElementDemandeAchat | null;
  typeLot: ElementDemandeAchat | null;
  categorie: ElementDemandeAchat | null;
  devise: ElementDemandeAchat | null;
  module: ElementDemandeAchat | null;
  declencheur: ElementDemandeAchat | null;
  fournisseur: ElementDemandeAchat | null;
  tvaDefaut: number | null;
  prixEstimeHT: number | null;
  prixEstimeTTC: number | null;
  paiement: ElementDemandeAchat | null;
  delaiPaiement: number | null;
  dates: DatesDemandeAchat;
  notes: string | null;
  texteLettre: string | null;
  estDerniere: boolean;
  procedureModifiable: boolean;
  phases: PhasesDemandeAchat;
  confidentielle: boolean;
  lotMultiFournisseur: boolean;
}

export interface SaisieDemandeAchat {
  procedureId: UUID | null;
  societeId: UUID | null;
  description: string | null;
  date?: string | null;
  projetId?: UUID | null;
  typeLotId?: UUID | null;
  categorieId?: UUID | null;
  deviseId?: UUID | null;
  moduleId?: UUID | null;
  declencheurId?: UUID | null;
  descriptionLongue?: string | null;
  tvaDefaut?: number | null;
  prixEstimeHT?: number | null;
  prixEstimeTTC?: number | null;
  paiementId?: UUID | null;
  delaiPaiement?: number | null;
  dates?: DatesDemandeAchat | null;
  notes?: string | null;
  texteLettre?: string | null;
}

export interface StatutCibleDemandeAchat {
  id: UUID;
  code: string | null;
  libelle: string | null;
  couleur: string | null;
}

export interface TransitionDemandeAchat {
  id: UUID;
  libelle: string | null;
  statutCible: StatutCibleDemandeAchat | null;
  avecCommentaire: boolean;
  avecDateUtilisateur: boolean;
  avecSecondValideur: boolean;
}

export interface ExecutionTransitionDemandeAchat {
  transitionId: UUID;
  notes?: string | null;
  dateUtilisateur?: string | null;
  secondValideur?: SecondValideur | null;
}

export interface HistoriqueDemandeAchat {
  date: string | null;
  utilisateur: string | null;
  description: string | null;
  notes: string | null;
  dateUtilisateur: string | null;
}

/** `champDate` : nom de colonne (DocDate par défaut), voir la doc de l'endpoint. */
export interface FiltresDemandesAchat {
  societeIds?: UUID[];
  projetIds?: UUID[];
  sansProjet?: boolean;
  procedureId?: UUID;
  statutIds?: UUID[];
  champDate?: string;
  du?: string;
  au?: string;
  fournisseur?: string;
  code?: string;
  montantMin?: number;
  montantMax?: number;
  recherche?: string;
}
