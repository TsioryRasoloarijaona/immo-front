/** `GET /api/dossiers/statuts` : code à passer tel quel dans `?statut=`. */
export interface StatutListeDossierDto {
  code: string;
  libelle?: string | null;
  ordre?: number | null;
  /** Annulation ou résiliation : exclu de la liste sans `inclureSortis`. */
  sortie: boolean;
}

/** `GET /api/dossiers/champs-date` : les 47 dates de période d'OMRAN. */
export interface ChampDateListeDto {
  code: string;
  libelle: string;
}

/** Population de la liste : les lots libres sont la ligne « Libre » d'OMRAN. */
export type LignesListeDossiers = 'DOSSIERS' | 'DOSSIERS_ET_LIBRES' | 'LIBRES';

/**
 * Montants par nature d'une ligne de `GET /api/dossiers` (servis seulement si demandés dans `?colonnes=`).
 * Complète `DossierListItemDto` de `types.ts` ; `null`/absents sur un lot libre.
 */
export interface MontantsNatureDossier {
  /** `ComFolder.AgreementPrice` ; groupable et agrégeable. */
  prixContractuel?: number | null;
  prixContractuelRegle?: number | null;
  prixContractuelReste?: number | null;
  prixRegle?: number | null;
  prixReste?: number | null;
  /** Calculé (prix + modifications + frais + pénalités) ; ≠ `totalAPayer` (colonne stockée). */
  netAPayer?: number | null;
  netAPayerRegle?: number | null;
  /** Négatif quand le client a trop payé. */
  netAPayerReste?: number | null;
  /** Pourcentage 0–100 (40 = 40 %), jamais un ratio. */
  tauxAvance?: number | null;
  /** Pourcentage 0–100. */
  tauxAvanceReel?: number | null;
  avance?: number | null;
  avanceReglee?: number | null;
  avanceReste?: number | null;
  autofinancement?: number | null;
  autofinancementRegle?: number | null;
  autofinancementReste?: number | null;
  credit?: number | null;
  creditRegle?: number | null;
  creditReste?: number | null;
  frais?: number | null;
  fraisRegles?: number | null;
  fraisReste?: number | null;
  /** Échéances de la catégorie `DefaultSyndicFeeDocumentType`, sous-ensemble de `frais`. */
  fraisSyndic?: number | null;
  fraisSyndicRegles?: number | null;
  fraisSyndicReste?: number | null;
  /** `ComFolder.ModificationsAmount`. */
  modifications?: number | null;
  modificationsReglees?: number | null;
  modificationsReste?: number | null;
  /** Σ signée des échéances de pénalité (crédit +, débit −). */
  penalites?: number | null;
  penalitesRegles?: number | null;
  penalitesReste?: number | null;
  tropPercu?: number | null;
  tropPercuRegle?: number | null;
  tropPercuReste?: number | null;
}

/** `GET /api/dossiers/totaux` : Σ des montants par nature sur tout le filtre (taux exclus). */
export interface TotauxDossiersDto {
  nombreDossiers: number;
  /** Clé = nom de colonne du catalogue (`avance`, `tropPercuReste`…). */
  sommes: Record<string, number>;
}
