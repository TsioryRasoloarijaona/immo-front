import { request } from './api';
import type { PageDto, UUID } from '../types';
import type { FamilleTiers } from '../types/administration';
import type { LigneOngletTiers, OngletTiers } from '../types/tiersOnglets';

export function listerOngletTiers(
  famille: FamilleTiers,
  id: UUID,
  onglet: OngletTiers,
  page: number,
  size: number,
): Promise<PageDto<LigneOngletTiers>> {
  return request('GET', `/api/administration/tiers/${famille}/${id}/onglets/${onglet}`, { query: { page, size } });
}
