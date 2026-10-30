// Fil de /api/administration/rendez-vous (FEATURE-admin-rendez-vous.md), noms exacts de l'OpenAPI.
import type { UUID } from '../types';

export interface RendezVousDto {
  id: UUID;
  code: string | null;
  description: string | null;
  declencheurId: UUID | null;
  declencheurCode: string | null;
  declencheurNom: string | null;
  datePrevue: string | null;
  dureePrevue: number | null;
  dateFinPrevue: string | null;
  gestionnaireId: UUID | null;
  gestionnaireCode: string | null;
  gestionnaireNom: string | null;
  tierId: UUID | null;
  tierCode: string | null;
  tierNom: string | null;
  sourceId: UUID | null;
  sourceLibelle: string | null;
  sourceEntite: string | null;
  notes: string | null;
}

/** En PATCH, absent ou null = inchangé. */
export interface RendezVousEcritureDto {
  description?: string | null;
  declencheurId?: UUID | null;
  datePrevue?: string | null;
  dureePrevue?: number | null;
  dateFinPrevue?: string | null;
  gestionnaireId?: UUID | null;
  tierId?: UUID | null;
  notes?: string | null;
}

export interface FiltresRendezVous {
  texte?: string;
  gestionnaireId?: UUID;
  dateDebut?: string;
  dateFin?: string;
}

export interface FiltresCalendrierRendezVous {
  debut: string;
  fin: string;
  gestionnaireId?: UUID;
}
