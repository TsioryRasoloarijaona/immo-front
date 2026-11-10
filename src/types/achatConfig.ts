// DTO de FEATURE-achat-regle-commune.md §4.1 : statuts et transitions des pièces d'achat, en lecture seule.
import type { UUID } from '../types';

export interface StatutAchatConfigDto {
  id: UUID;
  code: string | null;
  description: string | null;
  ordre: number | null;
  /** Type d'état (AdmWorkFlowStateType.Description). */
  categorie: string | null;
  /** Nom de couleur .NET tel quel. */
  couleur: string | null;
  okPourPaiement: boolean;
  valideComptabilite: boolean;
  lectureSeule: boolean;
  dureeVieJours: number | null;
  nombrePieces: number;
}

export interface RoleTransitionDto {
  id: UUID;
  code: string | null;
}

export interface TransitionAchatDto {
  id: UUID;
  ordre: number | null;
  description: string | null;
  /** null = sans gestion. */
  gestionCode: string | null;
  /** « Sans gestion » si aucune. */
  gestionLibelle: string;
  statutDepartId: UUID | null;
  statutDepartCode: string | null;
  statutArriveeId: UUID | null;
  statutArriveeCode: string | null;
  noteObligatoire: boolean;
  valideeParDeclencheur: boolean;
  /** Triés par code ; vide si aucun rôle. */
  roles: RoleTransitionDto[];
  nombrePassages: number;
  /** ISO yyyy-MM-dd, null si jamais empruntée. */
  dernierPassage: string | null;
}
