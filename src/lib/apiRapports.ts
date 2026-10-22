// Endpoints de FEATURE-tdb-vente-rapports-socle.md §4 : liste, descripteur, résultat et export d'un rapport.
import { request } from './api';
import type { DescripteurRapportDto, GroupeRapportsDto, ModuleRapport, ResultatRapportDto } from '../types/rapports';

/** Valeurs de filtres par nom de paramètre ; un paramètre `multiple` porte plusieurs valeurs. */
export type ValeursRapport = Record<string, string[]>;

const racine = (module: ModuleRapport) => `/api/rapports/${module}`;

/** 404 si le module est inconnu ; [] si rien n'est visible pour le profil. */
export function listRapports(module: ModuleRapport): Promise<GroupeRapportsDto[]> {
  return request('GET', racine(module));
}

/** 403 si le rapport existe mais n'est pas visible ; 404 s'il est inconnu. */
export function getDescripteurRapport(module: ModuleRapport, code: string): Promise<DescripteurRapportDto> {
  return request('GET', `${racine(module)}/${encodeURIComponent(code)}`);
}

/** 400 (paramètre refusé, message dans `detail`), 403, 404. */
export function getResultatRapport(module: ModuleRapport, code: string, valeurs: ValeursRapport): Promise<ResultatRapportDto> {
  return request('GET', `${racine(module)}/${encodeURIComponent(code)}/resultat`, { query: valeurs });
}

/** Chemin de l'export `.xlsx`, à passer à `BoutonExporter` avec les mêmes valeurs que le résultat. */
export function cheminExportRapport(module: ModuleRapport, code: string): string {
  return `${racine(module)}/${encodeURIComponent(code)}/export`;
}
