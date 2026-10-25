import { API_BASE_URL, fetchByteEndpointBlob } from './api';
import type { RessourceFichePdf } from '../types';

/** `GET /api/<ressource>/{id}/fiche.pdf` : mêmes droit et visibilité que le détail (404 sinon). */
export function fichePdf(ressource: RessourceFichePdf, id: string): Promise<Blob> {
  return fetchByteEndpointBlob(`${API_BASE_URL}/api/${ressource}/${encodeURIComponent(id)}/fiche.pdf`, 'application/pdf');
}

/** `GET /api/tranches/{id}/previsions-base/fiche.pdf` : visibilité des prévisions de base (404 sinon). */
export function fichePrevisionsBase(trancheId: string): Promise<Blob> {
  return fetchByteEndpointBlob(
    `${API_BASE_URL}/api/tranches/${encodeURIComponent(trancheId)}/previsions-base/fiche.pdf`,
    'application/pdf',
  );
}
