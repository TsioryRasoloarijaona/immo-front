// Endpoints de FEATURE-tdb-vente-previsions.md §4 : écran « Suivi des prévisions », DTO du socle des rapports.
import { request } from './api';
import type { ValeursRapport } from './apiRapports';
import type { ParametreRapportDto, ResultatRapportDto } from '../types/rapports';

const RACINE = '/api/suivi-previsions';

/** `annee`, `trancheId` (tranches visibles), `frais` (SANS / AVEC / SEULS). */
export function getParametresSuiviPrevisions(): Promise<ParametreRapportDto[]> {
  return request('GET', `${RACINE}/parametres`);
}

/** Sections `quantites` et `montants` ; 400 si un paramètre est refusé (message dans `detail`). */
export function getSuiviPrevisions(valeurs: ValeursRapport): Promise<ResultatRapportDto> {
  return request('GET', RACINE, { query: valeurs });
}

/** Sections `dossiers`, `mouvements`, `echeances` du mois `mois` (1–12). */
export function getDetailSuiviPrevisions(valeurs: ValeursRapport, mois: number): Promise<ResultatRapportDto> {
  return request('GET', `${RACINE}/detail`, { query: { ...valeurs, mois: [String(mois)] } });
}

/** Chemin de l'export `.xlsx`, à passer à `BoutonExporter` avec les mêmes valeurs que le résultat. */
export function cheminExportSuiviPrevisions(): string {
  return `${RACINE}/export`;
}
