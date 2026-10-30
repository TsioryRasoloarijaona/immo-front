// Endpoints de FEATURE-admin-rendez-vous.md, Administrateur seul (403 sinon).
import { request } from './api';
import type { PageDto, UUID } from '../types';
import type {
  FiltresCalendrierRendezVous,
  FiltresRendezVous,
  RendezVousDto,
  RendezVousEcritureDto,
} from '../types/rendezVous';

const RACINE_RENDEZ_VOUS = '/api/administration/rendez-vous';
/** Pour `useExportListe` ; 400 si `dateDebut` suit `dateFin`. */
export const EXPORT_RENDEZ_VOUS = `${RACINE_RENDEZ_VOUS}/export`;

/** 400 si `dateDebut` suit `dateFin`. */
export function listRendezVous(
  filtres: FiltresRendezVous & { page?: number; size?: number },
): Promise<PageDto<RendezVousDto>> {
  return request('GET', RACINE_RENDEZ_VOUS, { query: { ...filtres } });
}

/** Non paginé ; 400 si borne absente, `fin` avant `debut` ou plus de 62 jours d'écart. */
export function listCalendrierRendezVous(filtres: FiltresCalendrierRendezVous): Promise<RendezVousDto[]> {
  return request('GET', `${RACINE_RENDEZ_VOUS}/calendrier`, { query: { ...filtres } });
}

/** 404 si le rendez-vous est inconnu ou si c'est une tâche. */
export function getRendezVous(id: UUID): Promise<RendezVousDto> {
  return request('GET', `${RACINE_RENDEZ_VOUS}/${id}`);
}

/** `description`, `tierId`, `datePrevue` obligatoires ; 400 aussi si fin avant début ou référence inconnue. */
export function creerRendezVous(body: RendezVousEcritureDto): Promise<RendezVousDto> {
  return request('POST', RACINE_RENDEZ_VOUS, { body });
}

/** Champ absent ou null = inchangé ; 400 fin avant début ou référence inconnue ; 404 rendez-vous inconnu. */
export function modifierRendezVous(id: UUID, body: RendezVousEcritureDto): Promise<RendezVousDto> {
  return request('PATCH', `${RACINE_RENDEZ_VOUS}/${id}`, { body });
}

export function supprimerRendezVous(id: UUID): Promise<void> {
  return request('DELETE', `${RACINE_RENDEZ_VOUS}/${id}`);
}
