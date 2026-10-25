// Champs spécifiques (GEN0007) : lecture selon la visibilité du porteur, écritures Administrateur.
import { request } from './api';
import type { UUID } from '../types';
import type {
  ChampSpecifiqueDto,
  DefinitionChampDto,
  EcritureValeursChampsDto,
  PorteurChamps,
} from '../types/champsSpecifiques';

const BASE = '/api/champs-specifiques';

export function getTypesChamps(): Promise<string[]> {
  return request<string[]>('GET', `${BASE}/types`);
}

export function getChampsSpecifiques(porteur: PorteurChamps, id: UUID): Promise<ChampSpecifiqueDto[]> {
  return request<ChampSpecifiqueDto[]>('GET', `${BASE}/${porteur}/${encodeURIComponent(id)}`);
}

/** Tout ou rien ; 400 nommant le champ refusé. */
export function enregistrerChampsSpecifiques(
  porteur: PorteurChamps,
  id: UUID,
  corps: EcritureValeursChampsDto,
): Promise<ChampSpecifiqueDto[]> {
  return request<ChampSpecifiqueDto[]>('PUT', `${BASE}/${porteur}/${encodeURIComponent(id)}`, { body: corps });
}

export function creerDefinitionChamp(porteur: PorteurChamps, corps: DefinitionChampDto): Promise<ChampSpecifiqueDto> {
  return request<ChampSpecifiqueDto>('POST', `${BASE}/${porteur}/definitions`, { body: corps });
}

/** Remplacement complet de la définition. */
export function modifierDefinitionChamp(
  porteur: PorteurChamps,
  champId: UUID,
  corps: DefinitionChampDto,
): Promise<ChampSpecifiqueDto> {
  return request<ChampSpecifiqueDto>('PATCH', `${BASE}/${porteur}/definitions/${encodeURIComponent(champId)}`, {
    body: corps,
  });
}

/** Supprime aussi les valeurs de tous les objets du porteur. */
export function supprimerDefinitionChamp(porteur: PorteurChamps, champId: UUID): Promise<void> {
  return request<void>('DELETE', `${BASE}/${porteur}/definitions/${encodeURIComponent(champId)}`);
}
