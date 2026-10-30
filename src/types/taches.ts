// Fil de /api/administration/taches (FEATURE-admin-taches.md), noms exacts de l'OpenAPI.
import type { UUID } from '../types';

export interface TacheDto {
  id: UUID;
  code: string | null;
  description: string | null;
  typeId: UUID | null;
  typeLibelle: string | null;
  declencheurId: UUID | null;
  declencheurNom: string | null;
  datePrevue: string | null;
  dureePrevue: number | null;
  dateFinPrevue: string | null;
  dateDebut: string | null;
  duree: number | null;
  dateFin: string | null;
  moduleId: UUID | null;
  prioriteId: UUID | null;
  prioriteLibelle: string | null;
  gestionnaireId: UUID | null;
  gestionnaireNom: string | null;
  assigneId: UUID | null;
  assigneNom: string | null;
  entiteId: UUID | null;
  projetId: UUID | null;
  notes: string | null;
  statutId: UUID;
  statutLibelle: string | null;
}

/** En PATCH, absent ou null = inchangé. */
export interface TacheEcritureDto {
  description?: string | null;
  typeId?: UUID | null;
  declencheurId?: UUID | null;
  datePrevue?: string | null;
  dureePrevue?: number | null;
  dateFinPrevue?: string | null;
  dateDebut?: string | null;
  duree?: number | null;
  dateFin?: string | null;
  moduleId?: UUID | null;
  prioriteId?: UUID | null;
  gestionnaireId?: UUID | null;
  assigneId?: UUID | null;
  entiteId?: UUID | null;
  projetId?: UUID | null;
  notes?: string | null;
}

export interface FiltresTaches {
  statutId?: UUID;
  typeId?: UUID;
  prioriteId?: UUID;
  gestionnaireId?: UUID;
  texte?: string;
}

export interface TransitionTacheDto {
  statutId: UUID;
  code: string | null;
  commentaireRequis: boolean;
}

export interface StatutTacheDto {
  id: UUID;
  code: string | null;
  ordre: number | null;
  transitions: TransitionTacheDto[];
}

export interface ChangerStatutTacheRequest {
  statutId: UUID;
  commentaire?: string;
}
