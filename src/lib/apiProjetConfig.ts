// Endpoints de FEATURE-projet-config.md : projets et référentiels Administrateur seul (403 sinon), statuts de lot pour tous.
// Types de lot : moteur /api/referentiels-admin/types-lot (famille PROJET), voir apiReferentielsAdmin.ts.
import { request } from './api';
import type { UUID } from '../types';
import type {
  ChoixProjetDto,
  CritereAvancementDto,
  CritereAvancementEcritureDto,
  ExecutionTransitionProjetDto,
  HistoriqueProjetDto,
  ImportCriteresDto,
  ProjetConfigDto,
  ProjetConfigRequest,
  ReferentielsProjetConfigDto,
  StatutLotDto,
  TransitionProjetDto,
  TypeLotParDefautDto,
  VentilationTrancheDto,
  VentilationTrancheEcritureDto,
} from '../types/projetConfig';

const RACINE = '/api/projet/config';
const PROJETS = `${RACINE}/projets`;

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
  return request('GET', `${RACINE}/statuts-lot`);
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
