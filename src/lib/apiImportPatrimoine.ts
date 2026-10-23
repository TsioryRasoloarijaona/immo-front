// Endpoints de FEATURE-patrimoine-import-export.md §1 (Administrateur). 404 = type inconnu ou tranche invisible.
import { API_BASE_URL, fetchByteEndpointBlob, postMultipart } from './api';
import type { UUID } from '../types';
import type { BilanImportDto, DemandeImportPatrimoine, TypeImportPatrimoine } from '../types/importPatrimoine';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Classeur modèle pré-rempli avec les lignes de la tranche, et ses feuilles d'aide des codes. */
export function telechargerModeleImport(type: TypeImportPatrimoine, trancheId: UUID): Promise<Blob> {
  return fetchByteEndpointBlob(`${API_BASE_URL}/api/import-patrimoine/${type}/modele?trancheId=${trancheId}`, XLSX);
}

/** Bilan dans tous les cas où le fichier est lu ; 400 = fichier refusé en entier (message dans `ApiError`), 413 > 10 Mo. */
export function importerPatrimoine(d: DemandeImportPatrimoine): Promise<BilanImportDto> {
  return postMultipart<BilanImportDto>(`/api/import-patrimoine/${d.type}`, d.fichier, {
    trancheId: d.trancheId,
    simulation: d.simulation,
    feuille: d.feuille,
  });
}
