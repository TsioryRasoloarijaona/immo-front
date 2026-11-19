// Endpoints de FEATURE-projet-config.md : projets et référentiels Administrateur seul (403 sinon), statuts de lot pour tous.
// Types de lot : moteur /api/referentiels-admin/types-lot (famille PROJET), voir apiReferentielsAdmin.ts.
import { request } from './api';
import type { UUID } from '../types';
import type {
  CatalogueStatutLotDto,
  ChoixProjetDto,
  CritereAvancementDto,
  CritereAvancementEcritureDto,
  ExecutionTransitionProjetDto,
  HistoriqueProjetDto,
  ImportCriteresDto,
  NoeudNivellementDto,
  NoeudNivellementEcritureDto,
  ProjetConfigDto,
  ProjetConfigRequest,
  ReferentielsProjetConfigDto,
  StatutLotDto,
  StatutLotEcritureDto,
  TransitionLotEcritureDto,
  TransitionProjetDto,
  TransitionStatutLotDto,
  TypeLotParDefautDto,
  VentilationTrancheDto,
  VentilationTrancheEcritureDto,
} from '../types/projetConfig';

const RACINE = '/api/projet/config';
const PROJETS = `${RACINE}/projets`;
const STATUTS_LOT = `${RACINE}/statuts-lot`;
const TRANSITIONS_LOT = `${RACINE}/transitions-lot`;

export function listProjetsConfig(): Promise<ProjetConfigDto[]> {
  return request('GET', PROJETS);
}

/** 400 champ obligatoire manquant, 409 code déjà utilisé. */
export function createProjetConfig(body: ProjetConfigRequest): Promise<ProjetConfigDto> {
  return request('POST', PROJETS, { body });
}

export function updateProjetConfig(id: UUID, body: ProjetConfigRequest): Promise<ProjetConfigDto> {
  return request('PUT', `${PROJETS}/${id}`, { body });
}

/** 409 « Utilisé par … », message du serveur à afficher tel quel. */
export function deleteProjetConfig(id: UUID): Promise<void> {
  return request('DELETE', `${PROJETS}/${id}`);
}

export function getReferentielsProjetConfig(): Promise<ReferentielsProjetConfigDto> {
  return request('GET', `${RACINE}/referentiels`);
}

export function listStatutsLot(): Promise<StatutLotDto[]> {
  return request('GET', STATUTS_LOT);
}

/** 404 genre inconnu ou hors des 5 genres de lot. */
export function getCatalogueStatutLot(genreId: UUID): Promise<CatalogueStatutLotDto> {
  return request('GET', `${STATUTS_LOT}/catalogue?genreId=${genreId}`);
}

/** POST sans id, PUT avec ; 403 sans droit MarketStatusList, 400 saisie, 409 code pris dans le genre. */
export function saveStatutLot(body: StatutLotEcritureDto, id?: UUID): Promise<StatutLotDto> {
  return id ? request('PUT', `${STATUTS_LOT}/${id}`, { body }) : request('POST', STATUTS_LOT, { body });
}

/** 409 statut cité (lots, transitions, historique, paramétrages) : message du serveur à afficher tel quel. */
export function deleteStatutLot(id: UUID): Promise<void> {
  return request('DELETE', `${STATUTS_LOT}/${id}`);
}

export function listTransitionsLot(): Promise<TransitionStatutLotDto[]> {
  return request('GET', TRANSITIONS_LOT);
}

/** POST sans id, PUT avec ; 403 sans droit MarketWorkFlowList, 400 saisie, 409 couple départ → arrivée déjà pris. */
export function saveTransitionLot(body: TransitionLotEcritureDto, id?: UUID): Promise<TransitionStatutLotDto> {
  return id ? request('PUT', `${TRANSITIONS_LOT}/${id}`, { body }) : request('POST', TRANSITIONS_LOT, { body });
}

export function deleteTransitionLot(id: UUID): Promise<void> {
  return request('DELETE', `${TRANSITIONS_LOT}/${id}`);
}

/** Type de lot par défaut (AdmParamsGuid « DefaultMarketType ») : lecture pour tous, écriture Administrateur. */
export function getTypeLotParDefaut(): Promise<TypeLotParDefautDto> {
  return request('GET', `${RACINE}/types-lot/defaut`);
}

export function setTypeLotParDefaut(body: TypeLotParDefautDto): Promise<TypeLotParDefautDto> {
  return request('PUT', `${RACINE}/types-lot/defaut`, { body });
}

// Onglets de la fiche projet (FEATURE-projets-config-parite.md), Administrateur seul.

export function getChoixProjet(id: UUID): Promise<ChoixProjetDto> {
  return request('GET', `${PROJETS}/${id}/choix`);
}

export function listTransitionsProjet(id: UUID): Promise<TransitionProjetDto[]> {
  return request('GET', `${PROJETS}/${id}/transitions`);
}

/** 409 transition non permise (`transitionsAutorisees`), 400 commentaire exigé absent. */
export function executeTransitionProjet(id: UUID, body: ExecutionTransitionProjetDto): Promise<ProjetConfigDto> {
  return request('POST', `${PROJETS}/${id}/transition`, { body });
}

export function listHistoriqueProjet(id: UUID): Promise<HistoriqueProjetDto[]> {
  return request('GET', `${PROJETS}/${id}/historique`);
}

export function listVentilationsProjet(id: UUID): Promise<VentilationTrancheDto[]> {
  return request('GET', `${PROJETS}/${id}/ventilations`);
}

/** `ligneId` absent = ajout, sinon modification ; 400 message du serveur à afficher tel quel. */
export function saveVentilationProjet(
  id: UUID,
  body: VentilationTrancheEcritureDto,
  ligneId?: UUID,
): Promise<VentilationTrancheDto> {
  return ligneId
    ? request('PUT', `${PROJETS}/${id}/ventilations/${ligneId}`, { body })
    : request('POST', `${PROJETS}/${id}/ventilations`, { body });
}

export function deleteVentilationProjet(id: UUID, ligneId: UUID): Promise<void> {
  return request('DELETE', `${PROJETS}/${id}/ventilations/${ligneId}`);
}

export function listCriteresProjet(id: UUID): Promise<CritereAvancementDto[]> {
  return request('GET', `${PROJETS}/${id}/criteres`);
}

/** `ligneId` absent = ajout, sinon modification. */
export function saveCritereProjet(
  id: UUID,
  body: CritereAvancementEcritureDto,
  ligneId?: UUID,
): Promise<CritereAvancementDto> {
  return ligneId
    ? request('PUT', `${PROJETS}/${id}/criteres/${ligneId}`, { body })
    : request('POST', `${PROJETS}/${id}/criteres`, { body });
}

/** 409 critère cité par un PV de réunion. */
export function deleteCritereProjet(id: UUID, ligneId: UUID): Promise<void> {
  return request('DELETE', `${PROJETS}/${id}/criteres/${ligneId}`);
}

/** Remplace tous les critères ; 409 si un critère actuel est cité par un PV. */
export function importCriteresProjet(id: UUID, body: ImportCriteresDto): Promise<CritereAvancementDto[]> {
  return request('POST', `${PROJETS}/${id}/criteres/importer`, { body });
}

// Nivellement (FEATURE-n9-planification.md R4) : lecture pour qui voit le projet, écritures Administrateur.

export function listerNivellement(id: UUID): Promise<NoeudNivellementDto[]> {
  return request('GET', `${PROJETS}/${id}/nivellement`);
}

/** 400 projet sans nivellement ou niveau trop profond : message du serveur à afficher tel quel. */
export function creerNoeudNivellement(id: UUID, parentId: UUID | null): Promise<NoeudNivellementDto> {
  const body: NoeudNivellementEcritureDto = { parentId };
  return request('POST', `${PROJETS}/${id}/nivellement`, { body });
}

export function modifierNoeudNivellement(id: UUID, noeudId: UUID, code: string): Promise<NoeudNivellementDto> {
  const body: NoeudNivellementEcritureDto = { code };
  return request('PATCH', `${PROJETS}/${id}/nivellement/${noeudId}`, { body });
}

/** Supprime aussi les descendants ; 409 si l'un est cité : message du serveur à afficher tel quel. */
export function supprimerNoeudNivellement(id: UUID, noeudId: UUID): Promise<void> {
  return request('DELETE', `${PROJETS}/${id}/nivellement/${noeudId}`);
}
