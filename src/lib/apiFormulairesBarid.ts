import { API_BASE_URL, buildQuery, fetchByteEndpointBlob, ouvrirBlobDansOnglet } from './api';
import type { ValeursRapport } from './apiRapports';

const CODE_RAPPORT_BARID = 'ComSaleFormulaireBaridMaroc';

/**
 * `GET /api/rapports/vente/ComSaleFormulaireBaridMaroc/formulaires` : un PDF, une page par ligne de la section
 * `destinataires` du hub, mêmes filtres `trancheId` / `statutId` (répétables). 400 plafond (600 pages) ou filtre
 * refusé, 403 rapport non visible, 404 modèle `FORMULAIRE_BARID` absent ou inactif ou aucun destinataire —
 * `ApiError.message` porte le `detail` du serveur.
 */
export function urlFormulairesBarid(valeurs: ValeursRapport): string {
  return `${API_BASE_URL}/api/rapports/vente/${CODE_RAPPORT_BARID}/formulaires${buildQuery({
    trancheId: valeurs.trancheId,
    statutId: valeurs.statutId,
  })}`;
}

export function ouvrirFormulairesBarid(valeurs: ValeursRapport): Promise<void> {
  return ouvrirBlobDansOnglet(() => fetchByteEndpointBlob(urlFormulairesBarid(valeurs), 'application/pdf'));
}
