// Endpoints de FEATURE-achat-depenses-projet.md §4.2 : dépenses des projets visibles, en lecture.
import { request, withPageable } from './api';
import type { PageDto, Pageable, UUID } from '../types';
import type { DepensesProjetDto, FiltresReglementsProjet, ReglementProjetDto } from '../types/depensesProjet';

const RACINE = '/api/projet/depenses';

/** Un élément par projet visible ayant au moins une facture ; vide hors périmètre (jamais 403). */
export function getDepensesProjet(projetIds: UUID[] = []): Promise<DepensesProjetDto[]> {
  return request('GET', RACINE, { query: { projetIds } });
}

/** Tri fixe côté serveur (date du règlement puis n° décroissants). */
export function getReglementsProjet(filtres: FiltresReglementsProjet = {}, pageable?: Pageable): Promise<PageDto<ReglementProjetDto>> {
  return request('GET', `${RACINE}/reglements`, { query: withPageable({ ...filtres }, pageable) });
}
