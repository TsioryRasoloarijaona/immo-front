// Travaux chantier et Modifications (FEATURE-n2-travaux-chantier.md), noms du fil de /api/projet/*.
import type { ReferentielItemDto, UUID } from '../types';
import type { EtatModification } from './dossierSousListes';
import type { SecondValideur } from './projet';

export interface FiltresTravaux {
  societeId?: UUID;
  projetIds?: UUID[];
  du?: string;
  au?: string;
  /** Cases de statut cochées ; vide = tous les statuts visibles. */
  statutIds?: UUID[];
  typeId?: UUID;
  employeId?: UUID;
  recherche?: string;
}

export interface StatutJourTravailleDto {
  id: UUID;
  libelle: string | null;
  couleur: string | null;
}

/** N2b : `GET …/{id}/transitions`, même calcul que l'exécution. */
export interface TransitionJourTravaille {
  id: UUID;
  libelle: string | null;
  statutCible: (StatutJourTravailleDto & { code: string | null }) | null;
  avecCommentaire: boolean;
  avecDateUtilisateur: boolean;
  avecSecondValideur: boolean;
}

/** `notes` obligatoire si `avecCommentaire`, ignoré sauf `avecCommentaire` ou `avecDateUtilisateur` ; `secondValideur` si `avecSecondValideur`. */
export interface ExecutionTransitionJourTravaille {
  transitionId: UUID;
  notes?: string | null;
  dateUtilisateur?: string | null;
  secondValideur?: SecondValideur | null;
}

/** Ligne StrHistory, la plus récente en tête. */
export interface HistoriqueJourTravaille {
  date: string | null;
  utilisateur: string | null;
  description: string | null;
  notes: string | null;
  dateUtilisateur: string | null;
}

export interface JourTravailleLigneDto {
  id: UUID;
  statut: StatutJourTravailleDto | null;
  date: string | null;
  /** "HH:mm" */
  heureDebut: string | null;
  heureFin: string | null;
  personnel: string | null;
  niveau: string | null;
  type: string | null;
  article: string | null;
  groupe: string | null;
  projet: string | null;
  niveauCode: string | null;
  client: string | null;
  quantite: number | null;
  unite: string | null;
  prixUnitaireHT: number | null;
  totalHT: number | null;
  code: string | null;
  description: string | null;
  notes: string | null;
}

/** Corps du POST / PUT et valeurs de la fiche. Obligatoires : societeId, typeId, date, quantite, quantite1. */
export interface JourTravailleEcritureDto {
  societeId: UUID | null;
  projetId: UUID | null;
  typeId: UUID | null;
  date: string | null;
  heureDebut: string | null;
  heureFin: string | null;
  employeId: UUID | null;
  clientId: UUID | null;
  niveauId: UUID | null;
  zoneId: UUID | null;
  articleId: UUID | null;
  quantite: number | null;
  quantite1: number | null;
  unite: string | null;
  prixUnitaireHT: number | null;
  tva: number | null;
  unite1: string | null;
  prixUnitaireHT1: number | null;
  tva1: number | null;
  code: string | null;
  description: string | null;
  notes: string | null;
}

export interface JourTravailleFicheDto {
  id: UUID;
  statut: StatutJourTravailleDto | null;
  valeurs: JourTravailleEcritureDto;
  totalHT: number | null;
  totalHT1: number | null;
  facture: string | null;
  factureProforma: string | null;
}

export interface TypeTravauxDto {
  id: UUID;
  code: string | null;
  libelle: string | null;
  groupe: string | null;
  unite: string | null;
  prixUnitaireHT: number | null;
  tva: number | null;
  unite1: string | null;
  prixUnitaireHT1: number | null;
  tva1: number | null;
}

export interface ReferentielsTravauxDto {
  types: TypeTravauxDto[];
  statuts: StatutJourTravailleDto[];
  /** Faux : le bouton « Nouveau » est à masquer (la création répond 403). */
  departAutorise: boolean;
  zones: ReferentielItemDto[];
  niveaux: ReferentielItemDto[];
  articles: ReferentielItemDto[];
  personnel: ReferentielItemDto[];
}

export interface FiltresModifications {
  trancheId?: UUID;
  etats?: EtatModification[];
  du?: string;
  au?: string;
  recherche?: string;
}

export interface EtatModificationProjetDto {
  code: string;
  libelle: string;
}

export interface ModificationProjetLigneDto {
  id: UUID;
  dossierId: UUID;
  etat: EtatModificationProjetDto | null;
  dateDemande: string | null;
  projet: string | null;
  categorie: string | null;
  type: string | null;
  code: string | null;
  bloc: string | null;
  etage: number | null;
  description: string | null;
  acquereur: string | null;
  telephone: string | null;
  etatDossier: string | null;
  dateValidationTechnique: string | null;
  dateValidationClient: string | null;
  cout: number | null;
  montantHT: number | null;
  montantTTC: number | null;
  notes: string | null;
}

export interface ReferentielsModificationsDto {
  tranches: ReferentielItemDto[];
  etats: EtatModificationProjetDto[];
}
