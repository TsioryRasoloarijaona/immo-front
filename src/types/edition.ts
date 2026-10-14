import type { DossierFicheDto, UUID } from '../types';

/** Groupes de droits de `PATCH /api/dossiers/{id}` (FEATURE-vente-edition.md). */
export type GroupeEdition =
  | 'DATES'
  | 'ANNULATION'
  | 'CLIENT'
  | 'COMMERCIAL'
  | 'GESTIONNAIRES'
  | 'NOTAIRE'
  | 'CREDIT'
  | 'OPTIONS'
  | 'PENALITES'
  | 'PRIX'
  | 'NOTE';

export interface DroitsEditionDto {
  groupes: GroupeEdition[];
  /** Dossier annulé ou désisté : seul ANNULATION reste modifiable. */
  sorti: boolean;
}

/**
 * Corps partiel de `PATCH /api/dossiers/{id}` : seuls les champs présents changent ; vider un champ = son nom
 * dans `champsAVider`. Dates en `YYYY-MM-DDTHH:mm:ss`.
 */
export interface ModifierDossierRequest {
  concretisation?: string;
  promesseVente?: string;
  visiteTechnique?: string;
  envoiNotairePrevisionnel?: string;
  envoiNotaireConfirme?: boolean;
  enregistrementContrat?: string;
  envoiNotaire?: string;
  minute?: string;
  expedition?: string;
  relanceTitreFoncier1?: string;
  echeanceRelance1?: string;
  relanceTitreFoncier2?: string;
  echeanceRelance2?: string;
  ficheBancaire?: string;
  compromis?: string;
  attestation?: string;
  intervention?: string;
  assurance?: string;
  remiseClesEffective?: string;
  actePrecision?: string;
  promesseClient?: string;
  promesseEnregistrement?: string;
  impressionContrat?: string;
  minuteClient?: string;
  minuteAvocat?: string;
  minuteRemiseLegalisation?: string;
  minuteLegalisation?: string;
  minuteDepotEnregistrement?: string;
  remiseClesClient?: string;
  remiseClesEnregistrement?: string;
  actePrecisionClient?: string;
  actePrecisionAvocat?: string;
  actePrecisionRemiseLegalisation?: string;
  actePrecisionLegalisation?: string;
  actePrecisionDepotEnregistrement?: string;
  actePrecisionEnregistrement?: string;
  cpfDepot?: string;
  cpfRetrait?: string;
  remiseCertificatPropriete?: string;
  numeroTitre?: string;
  annulationDate?: string;
  annulationCauses?: string;
  clientId?: UUID;
  commercialId?: UUID;
  gestionnaire1Id?: UUID;
  gestionnaire2Id?: UUID;
  notaireId?: UUID;
  banqueCreditId?: UUID;
  agenceCredit?: string;
  meilleurTauxEnvoi?: string;
  meilleurTauxDecisionId?: UUID;
  meilleurTauxDecisionDate?: string;
  ancienClient?: boolean;
  cadeauPlusTard?: boolean;
  integrerModificationsAuPrix?: boolean;
  penalitesDesactivees?: boolean;
  remiseMontantHT?: number;
  /** Pourcentage 0–100 du total HT ; exclusif de `remiseMontantHT`. */
  remisePourcentage?: number;
  /** Ratio 0–1 (0,2 = 20 %). */
  tva?: number;
  forcerRemise?: boolean;
  note?: string;
  champsAVider?: (keyof ModifierDossierRequest)[];
}

export interface DossierModifieDto {
  fiche: DossierFicheDto;
  champsModifies: string[];
  /** Prix après remise TTC − (avance + crédit + autofinancement), null si nul ou prix inchangé. */
  ecartSchema?: number | null;
}
