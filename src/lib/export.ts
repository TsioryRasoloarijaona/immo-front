import { API_BASE_URL, buildQuery, fetchByteEndpointBlob, triggerBlobDownload, type QueryValue } from './api';

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function deuxChiffres(n: number): string {
  return String(n).padStart(2, '0');
}

/** `aaaaMMjj_HHmmss`, comme le nom de fichier posé par le serveur. */
function horodatage(d = new Date()): string {
  const jour = `${d.getFullYear()}${deuxChiffres(d.getMonth() + 1)}${deuxChiffres(d.getDate())}`;
  return `${jour}_${deuxChiffres(d.getHours())}${deuxChiffres(d.getMinutes())}${deuxChiffres(d.getSeconds())}`;
}

/**
 * Télécharge l'export `.xlsx` d'une liste : `chemin` est la route d'export (`/api/<liste>/export`), `params` les
 * filtres de la liste plus `colonnes` (visibles, dans l'ordre) et `sort`. Aucune connaissance d'un écran.
 */
export async function exporterListe(chemin: string, params: Record<string, QueryValue>, nomListe: string): Promise<void> {
  const url = `${API_BASE_URL}${chemin}${buildQuery({ ...params, format: 'xlsx' })}`;
  const blob = await fetchByteEndpointBlob(url, MIME_XLSX);
  triggerBlobDownload(blob, `${nomListe}_${horodatage()}.xlsx`);
}
