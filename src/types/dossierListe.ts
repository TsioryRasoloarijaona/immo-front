/** `GET /api/dossiers/statuts` : code à passer tel quel dans `?statut=`. */
export interface StatutListeDossierDto {
  code: string;
  libelle?: string | null;
  ordre?: number | null;
  /** Annulation ou résiliation : exclu de la liste sans `inclureSortis`. */
  sortie: boolean;
}

/** `GET /api/dossiers/champs-date` : les 47 dates de période d'OMRAN. */
export interface ChampDateListeDto {
  code: string;
  libelle: string;
}

/** Population de la liste : les lots libres sont la ligne « Libre » d'OMRAN. */
export type LignesListeDossiers = 'DOSSIERS' | 'DOSSIERS_ET_LIBRES' | 'LIBRES';
