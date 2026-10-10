/** Formes du fil des routes `/syndic/*` du service (generateur-virement, GUIDE-FRONTEND.md §16).
 * Montants en dirhams (nombres), dates `AAAA-MM-JJ`. */

export type Pastille = 'A_JOUR' | 'PARTIEL' | 'EN_RETARD' | 'PAS_ENCORE_DU' | 'AVANCE';
export type StatutExercice = 'PAYE' | 'TROP_PERCU' | 'PARTIEL' | 'IMPAYE' | 'PAS_ENCORE_DU';
export type ModePaiement = 'ESPECES' | 'VIREMENT' | 'CHEQUE';
export type StatutPaiement = 'ENCAISSE' | 'EN_ATTENTE' | 'ANNULE';

export interface Situation {
  du: number;
  paye: number;
  reste: number;
  trop_percu: number;
  statut: StatutExercice;
  pastille: Pastille;
}

export interface PaiementExercice {
  id: string;
  numero: string;
  date: string;
  montant: number;
  mode: ModePaiement;
  numero_cheque: string | null;
  reference: string | null;
  annule: boolean;
  statut: StatutPaiement;
  recu_numero: string | null;
  corrections: number;
  montant_utile: number;
}

export interface ExerciceAppartement {
  id: string;
  label: string;
  debut: string;
  fin: string;
  duree_mois: number;
  tarif_mensuel: number;
  repris_en_bloc: boolean;
  termine: boolean;
  situation: Situation;
  paiements: PaiementExercice[];
}

export interface ProprietaireLu {
  id: string;
  nom: string;
  est_societe: boolean;
  telephone: string | null;
  cin: string | null;
  manque: string | null;
}

export interface Appartement {
  id: string;
  code: string;
  numero_dossier: string | null;
  date_contrat: string | null;
  date_remise_cles: string | null;
  proprietaires: ProprietaireLu[];
  exercices: ExerciceAppartement[];
  exercice_affiche: ExerciceAppartement | null;
  concerne: boolean;
  pastille: Pastille;
  manque: string | null;
}

export interface ListeExercices {
  exercices: string[];
  payables: string[];
  par_defaut: string | null;
}

export interface LigneARelancer {
  code: string;
  proprietaires: string;
  telephone: string | null;
  reste: number;
  depuis: string | null;
  jours_de_retard: number;
  pastille: Pastille;
}

export interface TableauDeBord {
  exercice: string | null;
  nombre_appartements: number;
  du: number;
  paye: number;
  reste: number;
  trop_percu: number;
  payes: number;
  partiels: number;
  impayes: number;
  pas_encore_dus: number;
  a_relancer: LigneARelancer[];
  a_recouvrer: number;
  fiches_incompletes: { code: string; manque: string }[];
}

export type RaisonAppel = 'PROMESSE' | 'RETARD' | 'BIENTOT';

export interface Appel {
  cle: string;
  raison: RaisonAppel;
  noms: string[];
  telephones: string[];
  appartement_id: string;
  dettes: { code: string; exercice: string; reste: number; debut: string; a_venir: boolean }[];
  en_retard: number;
  a_venir: number;
  en_retard_depuis: string | null;
  derniere_note: { date: string; texte: string; promis_le: string | null; montant_promis: number | null } | null;
}

export interface PaiementListe {
  id: string;
  numero: string;
  date: string;
  appartement: string;
  exercice: string;
  proprietaires: string;
  payeur: string | null;
  mode: ModePaiement;
  numero_cheque: string | null;
  reference: string | null;
  verse_a_la_banque: boolean;
  montant: number;
  frais_bancaires: number;
  frais_absorbes: boolean;
  corrections: number;
  montant_utile: number;
  statut: StatutPaiement;
  annule: boolean;
  motif_annulation: string | null;
  recu_numero: string | null;
  recu_groupe: boolean;
  cree_par: string | null;
}

export interface ListePaiements {
  total: number;
  page: number;
  par_page: number;
  total_utile: number;
  paiements: PaiementListe[];
}

export interface FiltresPaiements {
  exercice?: string;
  appartement?: string;
  mode?: ModePaiement;
  page?: number;
  par_page?: number;
}

export interface LigneSaisie {
  appartement: string;
  exercice_id: string;
  montant?: number;
}

export interface SaisiePaiement {
  lignes: LigneSaisie[];
  montant: number;
  mode: ModePaiement;
  date: string;
  numero_cheque?: string;
  verse_a_la_banque?: boolean;
  frais?: number;
  frais_absorbes?: boolean;
  payeur?: string;
  reference?: string;
  confirmerDepassement?: boolean;
}

export interface PaiementEnregistre {
  phrase: string;
  recu: { numero: string; pdf: string };
  paiements: { id: string; numero: string; appartement: string; exercice: string; montant: number; situation: Situation }[];
}
