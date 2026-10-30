// Contrat de FEATURE-admin-historique.md : écran « Historique » (Administration, Sécurité).
import type { UUID } from '../types';

export type ActionHistorique = 'Added' | 'Modified' | 'Deleted';

export interface LigneHistoriqueDto {
  id: UUID;
  objetId: UUID | null;
  dateAction: string;
  utilisateur: string | null;
  entite: string | null;
  libelleEntite: string | null;
  action: ActionHistorique;
}

/** Dates ISO, jours inclus ; sans date, les 30 derniers jours. */
export interface FiltresHistorique {
  dateDebut?: string;
  dateFin?: string;
  texte?: string;
  utilisateur?: string;
  action?: ActionHistorique;
}
