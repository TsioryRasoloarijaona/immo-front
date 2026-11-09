// Contrat de FEATURE-projet-config.md (/api/projet/config) ; noms du fil exacts.
import type { ReferentielItemDto, UUID } from '../types';

export interface ProjetConfigDto {
  id: UUID;
  code?: string;
  description?: string;
  descriptionLongue?: string | null;
  adresse?: string | null;
  notes?: string | null;
  societeId?: UUID | null;
  societeCode?: string | null;
  /** StrEntity « PrjProject », posé par le serveur. */
  entiteId?: UUID | null;
  entiteCode?: string | null;
  /** Posé par le serveur (« Nouveau » à la création). */
  statutId?: UUID | null;
  statutCode?: string | null;
  gestionnaireId?: UUID | null;
  gestionnaireNom?: string | null;
  ventile: boolean;
  tauxVentilationDefaut?: number | null;
  partiesCommunes: boolean;
  /** Code « AAAA-… » : projet comptable d'exercice (badge « Exercice »). */
  anneeSociete: boolean;
  nbLots: number;
  nbPiecesAchat: number;
  dateCreation?: string | null;
  creePar?: string | null;
  dateModification?: string | null;
  modifiePar?: string | null;
}

/** Création ou remplacement complet ; 400 sans code, libellé ou société, 409 code déjà utilisé. */
export interface ProjetConfigRequest {
  code: string;
  description: string;
  descriptionLongue?: string | null;
  adresse?: string | null;
  notes?: string | null;
  societeId: UUID;
  gestionnaireId?: UUID | null;
  ventile?: boolean | null;
  tauxVentilationDefaut?: number | null;
  partiesCommunes?: boolean | null;
}

export interface StatutLotDto {
  id: UUID;
  code?: string;
  description?: string;
  ordre?: number | null;
  /** Nom de couleur .NET (`LimeGreen`…), tel quel. */
  couleur?: string | null;
  groupeId: UUID;
  groupeCode?: string;
  /** Libellé du genre de lot (Entrepreneurs, Fournisseurs, Maîtres d'ouvrage). */
  genre?: string;
  categorie?: string | null;
}

export interface ReferentielsProjetConfigDto {
  societes: ReferentielItemDto[];
  statutsProjet: ReferentielItemDto[];
  /** `description` = nom du membre du personnel. */
  gestionnaires: ReferentielItemDto[];
}
