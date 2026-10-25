// Endpoints de FEATURE-patrimoine-import-export.md §1 et FEATURE-patrimoine-import-generique.md (Administrateur).
// 404 = type inconnu (ou sans mapping pour `/colonnes` et `/analyse`) ou tranche invisible.
import { API_BASE_URL, fetchByteEndpointBlob, postMultipart, request } from './api';
import type { UUID } from '../types';
import type {
  AnalyseImportDto,
  BilanImportDto,
  ColonneImportDto,
  DemandeImportPatrimoine,
  TypeImportGenerique,
  TypeImportPatrimoine,
} from '../types/importPatrimoine';

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Classeur modèle pré-rempli, et ses feuilles d'aide des codes ; `trancheId` pour articles, sous-articles, prévisions. */
export function telechargerModeleImport(type: TypeImportPatrimoine, trancheId?: UUID): Promise<Blob> {
  const requete = trancheId ? `?trancheId=${trancheId}` : '';
  return fetchByteEndpointBlob(`${API_BASE_URL}/api/import-patrimoine/${type}/modele${requete}`, XLSX);
}

/** Bilan dans tous les cas où le fichier est lu ; 400 = fichier ou mapping refusé en entier (`ApiError`), 413 > 10 Mo. */
export function importerPatrimoine(d: DemandeImportPatrimoine): Promise<BilanImportDto> {
  return postMultipart<BilanImportDto>(
    `/api/import-patrimoine/${d.type}`,
    d.fichier,
    { trancheId: d.trancheId, simulation: d.simulation, feuille: d.feuille },
    d.mapping ? { mapping: JSON.stringify(d.mapping) } : undefined,
  );
}

/** Colonnes cibles de l'écran de mapping. */
export function colonnesImport(type: TypeImportGenerique): Promise<ColonneImportDto[]> {
  return request<ColonneImportDto[]>('GET', `/api/import-patrimoine/${type}/colonnes`);
}

/** Lecture du fichier et mapping proposé, sans écriture ; 400 / 413 comme l'import. */
export function analyserImport(type: TypeImportGenerique, fichier: File, feuille?: string): Promise<AnalyseImportDto> {
  return postMultipart<AnalyseImportDto>(`/api/import-patrimoine/${type}/analyse`, fichier, { feuille });
}
