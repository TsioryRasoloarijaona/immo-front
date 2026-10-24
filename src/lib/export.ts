import { API_BASE_URL, buildQuery, fetchByteEndpointBlob, triggerBlobDownload, type QueryValue } from './api';
import type { FormatExport } from '../types';

const MIME: Record<FormatExport, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

function deuxChiffres(n: number): string {
  return String(n).padStart(2, '0');
}

/** `aaaaMMjj_HHmmss`, comme le nom de fichier posé par le serveur. */
function horodatage(d = new Date()): string {
  const jour = `${d.getFullYear()}${deuxChiffres(d.getMonth() + 1)}${deuxChiffres(d.getDate())}`;
  return `${jour}_${deuxChiffres(d.getHours())}${deuxChiffres(d.getMinutes())}${deuxChiffres(d.getSeconds())}`;
}

/** Fichier d'export d'une liste (`format` absent = xlsx) ; le PDF au-delà de 2 000 lignes répond 400. */
export function fichierListe(chemin: string, params: Record<string, QueryValue>, format: FormatExport = 'xlsx'): Promise<Blob> {
  return fetchByteEndpointBlob(`${API_BASE_URL}${chemin}${buildQuery({ ...params, format })}`, MIME[format]);
}

/**
 * Télécharge l'export d'une liste : `chemin` est la route d'export (`/api/<liste>/export`), `params` les
 * filtres de la liste plus `colonnes` (visibles, dans l'ordre) et `sort`. Aucune connaissance d'un écran.
 */
export async function exporterListe(chemin: string, params: Record<string, QueryValue>, nomListe: string,
  format: FormatExport = 'xlsx'): Promise<void> {
  const blob = await fichierListe(chemin, params, format);
  triggerBlobDownload(blob, `${nomListe}_${horodatage()}.${format}`);
}
