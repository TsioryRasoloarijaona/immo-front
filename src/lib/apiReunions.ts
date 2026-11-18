// Réunions de chantier (FEATURE-n1-reunions-chantier.md) ; chaque écriture d'onglet renvoie la fiche entière.
import { request } from './api';
import type { UUID } from '../types';
import type {
  AvancementSaisieDto,
  ChoixReunionsDto,
  ContactSaisieDto,
  DecisionSaisieDto,
  FiltresReunions,
  IntervenantSaisieDto,
  ReunionCreationDto,
  ReunionFicheDto,
  ReunionLigneDto,
  ReunionModificationDto,
} from '../types/reunions';

const RACINE = '/api/projet/reunions';

/** Projets habilités seulement ; 403 sans `Yes.Prj.Front.Bul.MeetingList`. */
export function listReunions(filtres: FiltresReunions = {}): Promise<ReunionLigneDto[]> {
  return request('GET', RACINE, { query: { ...filtres } });
}

/** Types, statuts de réserve et lots du projet (si donné). */
export function getChoixReunions(projetId?: UUID): Promise<ChoixReunionsDto> {
  return request('GET', `${RACINE}/choix`, { query: { projetId } });
}

export function getReunion(id: UUID): Promise<ReunionFicheDto> {
  return request('GET', `${RACINE}/${id}`);
}

/** Le serveur reporte le P.V. précédent (même projet et type) dans la fiche renvoyée. */
export function creerReunion(corps: ReunionCreationDto): Promise<ReunionFicheDto> {
  return request('POST', RACINE, { body: corps });
}

export function modifierReunion(id: UUID, corps: ReunionModificationDto): Promise<ReunionFicheDto> {
  return request('PUT', `${RACINE}/${id}`, { body: corps });
}

export function supprimerReunion(id: UUID): Promise<void> {
  return request('DELETE', `${RACINE}/${id}`);
}

/** Écriture dans un onglet : `chemin` relatif à la réunion (`/decisions`, `/intervenants/{iid}/contacts/{cid}`…). */
function ecrireOnglet(methode: 'POST' | 'PUT' | 'PATCH' | 'DELETE', id: UUID, chemin: string, corps?: unknown): Promise<ReunionFicheDto> {
  return request(methode, `${RACINE}/${id}${chemin}`, corps === undefined ? undefined : { body: corps });
}

export function ajouterMaitresOuvrage(id: UUID, contactIds: UUID[]): Promise<ReunionFicheDto> {
  return ecrireOnglet('POST', id, '/maitres-ouvrage', { contactIds });
}

export function majMaitreOuvrage(id: UUID, ligneId: UUID, corps: ContactSaisieDto): Promise<ReunionFicheDto> {
  return ecrireOnglet('PATCH', id, `/maitres-ouvrage/${ligneId}`, corps);
}

export function supprimerMaitreOuvrage(id: UUID, ligneId: UUID): Promise<ReunionFicheDto> {
  return ecrireOnglet('DELETE', id, `/maitres-ouvrage/${ligneId}`);
}

/** 409 si un intervenant existe déjà pour ce lot et ce fournisseur. */
export function creerIntervenant(id: UUID, corps: IntervenantSaisieDto): Promise<ReunionFicheDto> {
  return ecrireOnglet('POST', id, '/intervenants', corps);
}

export function modifierIntervenant(id: UUID, intervenantId: UUID, corps: IntervenantSaisieDto): Promise<ReunionFicheDto> {
  return ecrireOnglet('PUT', id, `/intervenants/${intervenantId}`, corps);
}

export function supprimerIntervenant(id: UUID, intervenantId: UUID): Promise<ReunionFicheDto> {
  return ecrireOnglet('DELETE', id, `/intervenants/${intervenantId}`);
}

export function creerContactIntervenant(id: UUID, intervenantId: UUID, corps: ContactSaisieDto): Promise<ReunionFicheDto> {
  return ecrireOnglet('POST', id, `/intervenants/${intervenantId}/contacts`, corps);
}

export function modifierContactIntervenant(id: UUID, intervenantId: UUID, ligneId: UUID, corps: ContactSaisieDto): Promise<ReunionFicheDto> {
  return ecrireOnglet('PUT', id, `/intervenants/${intervenantId}/contacts/${ligneId}`, corps);
}

export function supprimerContactIntervenant(id: UUID, intervenantId: UUID, ligneId: UUID): Promise<ReunionFicheDto> {
  return ecrireOnglet('DELETE', id, `/intervenants/${intervenantId}/contacts/${ligneId}`);
}

export function creerDecision(id: UUID, corps: DecisionSaisieDto): Promise<ReunionFicheDto> {
  return ecrireOnglet('POST', id, '/decisions', corps);
}

export function modifierDecision(id: UUID, decisionId: UUID, corps: DecisionSaisieDto): Promise<ReunionFicheDto> {
  return ecrireOnglet('PUT', id, `/decisions/${decisionId}`, corps);
}

/** 409 si la décision est reprise par une réunion suivante. */
export function supprimerDecision(id: UUID, decisionId: UUID): Promise<ReunionFicheDto> {
  return ecrireOnglet('DELETE', id, `/decisions/${decisionId}`);
}

/** `pourcentage` 0 à 100 ; 0 ou null vide la cellule. */
export function majAvancement(id: UUID, corps: AvancementSaisieDto): Promise<ReunionFicheDto> {
  return ecrireOnglet('PUT', id, '/avancements', corps);
}
