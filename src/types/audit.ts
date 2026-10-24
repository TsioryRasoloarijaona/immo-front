// Miroir des DTO de FEATURE-patrimoine-audit-actions.md (journal d'audit OMRAN et notes).
import type { UUID } from '../types';

/** Objet du patrimoine porteur d'audit, de notes et (article seul) d'actions. */
export type Porteur = 'projet' | 'tranche' | 'article' | 'prospection-terrain' | 'etude';

/** Action brute d'`AdmWebHistorics`, traduite à l'écran. */
export type ActionAudit = 'Added' | 'Modified' | 'Deleted';

export interface ChangementAuditDto {
  /** Nom de colonne, ou de la navigation pour une clé étrangère (ex. `CfgProject`). */
  propriete: string;
  /** Vide pour un ajout. Dates au format OMRAN `jj/MM/aaaa HH:mm:ss`. */
  ancienneValeur: string;
  nouvelleValeur: string;
}

export interface LigneAuditDto {
  id: UUID;
  date?: string;
  utilisateur?: string;
  action?: ActionAudit;
  typeObjet?: string;
  libelleTypeObjet?: string;
  libelleObjet?: string;
  /** Ligne enfant (ex. lien tranche–article) : type du parent, sinon null. */
  parentTypeObjet?: string | null;
  /** Vide si `Details` est illisible. */
  details: ChangementAuditDto[];
}

export interface NoteDto {
  id: UUID;
  date?: string;
  auteur?: string;
  /** « jj/MM/aaaa HH:mm auteur ». */
  description?: string;
  /** Texte brut (balises retirées) : à afficher comme texte, jamais en HTML. */
  texte: string;
  rappel?: string | null;
}

export interface CreerNoteRequest {
  porteur: Porteur;
  id: UUID;
  texte: string;
  rappel?: string;
}
