// Miroir des DTO de FEATURE-admin-email-historique.md.
import type { UUID } from '../types';

export interface LigneEmailDto {
  id: UUID;
  date: string | null;
  utilisateur: string | null;
  expediteur: string | null;
  destinataires: string | null;
  objet: string | null;
  automatique: boolean | null;
  envoye: boolean | null;
  erreur: string | null;
  libelleObjet: string | null;
}

export interface EmailDetailDto extends LigneEmailDto {
  copie: string | null;
  copieCachee: string | null;
  corps: string | null;
  html: boolean | null;
}

export interface FiltresEmail {
  dateDebut?: string;
  dateFin?: string;
  texte?: string;
  utilisateur?: string;
  envoye?: boolean;
  page?: number;
  size?: number;
}
