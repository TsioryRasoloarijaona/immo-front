// Travaux chantier et Modifications (FEATURE-n2-travaux-chantier.md).
import { request } from './api';
import type { UUID } from '../types';
import type { ModificationRequest } from '../types/dossierSousListes';
import type {
  FiltresModifications,
  FiltresTravaux,
  JourTravailleEcritureDto,
  JourTravailleFicheDto,
  JourTravailleLigneDto,
  ModificationProjetLigneDto,
  ReferentielsModificationsDto,
  ReferentielsTravauxDto,
} from '../types/travauxChantier';

const TRAVAUX = '/api/projet/travaux-chantier';
const MODIFICATIONS = '/api/projet/modifications';

/** Statuts visibles et projets habilités seulement ; 403 sans `Yes.Prj.Front.Bul.GrhWorkedDayView`. */
export function listTravauxChantier(filtres: FiltresTravaux = {}): Promise<JourTravailleLigneDto[]> {
  return request('GET', TRAVAUX, { query: { ...filtres } });
}

/** Niveaux du projet donné (vide sans projet ou projet non habilité). */
export function getReferentielsTravaux(projetId?: UUID): Promise<ReferentielsTravauxDto> {
  return request('GET', `${TRAVAUX}/referentiels`, { query: { projetId } });
}

export function getJourTravaille(id: UUID): Promise<JourTravailleFicheDto> {
  return request('GET', `${TRAVAUX}/${id}`);
}

/** 201 au statut de départ ; 403 avec le message OMRAN si ce statut n'est pas visible. */
export function creerJourTravaille(corps: JourTravailleEcritureDto): Promise<JourTravailleFicheDto> {
  return request('POST', TRAVAUX, { body: corps });
}

/** Changer de société vide le personnel ; changer de type recopie unités, prix et TVA du type. */
export function modifierJourTravaille(id: UUID, corps: JourTravailleEcritureDto): Promise<JourTravailleFicheDto> {
  return request('PUT', `${TRAVAUX}/${id}`, { body: corps });
}

export function supprimerJourTravaille(id: UUID): Promise<void> {
  return request('DELETE', `${TRAVAUX}/${id}`);
}

/** Tranches habilitées seulement ; 403 sans `Yes.Prj.Front.Modification.ModificationList`. */
export function listModificationsProjet(filtres: FiltresModifications = {}): Promise<ModificationProjetLigneDto[]> {
  return request('GET', MODIFICATIONS, { query: { ...filtres } });
}

export function getReferentielsModifications(): Promise<ReferentielsModificationsDto> {
  return request('GET', `${MODIFICATIONS}/referentiels`);
}

export function getModificationProjet(id: UUID): Promise<ModificationProjetLigneDto> {
  return request('GET', `${MODIFICATIONS}/${id}`);
}

/** Même recalcul des montants du dossier que l'onglet Modifications du dossier. */
export function modifierModificationProjet(id: UUID, corps: ModificationRequest): Promise<ModificationProjetLigneDto> {
  return request('PUT', `${MODIFICATIONS}/${id}`, { body: corps });
}
