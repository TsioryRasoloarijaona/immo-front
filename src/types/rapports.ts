// Miroir des DTO de FEATURE-tdb-vente-rapports-socle.md §4 (hub « Rapports »). Noms du fil exacts.

/** Slug du module dans l'URL `/api/rapports/{module}`. */
export type ModuleRapport = 'vente' | 'patrimoine';

export type TypeParametre = 'TRANCHES' | 'COMMERCIAUX' | 'DATE' | 'ANNEE' | 'ENTIER' | 'TEXTE' | 'CHOIX' | 'BOOLEEN';

/** `POURCENTAGE` vaut 0–100 (12,5 pour 12,5 %). */
export type TypeColonne = 'TEXTE' | 'NOMBRE' | 'MONTANT' | 'POURCENTAGE' | 'DATE' | 'BOOLEEN';

export type FonctionTotal = 'AUCUNE' | 'SOMME' | 'MOYENNE' | 'MIN' | 'MAX';

export type TypeGraphique = 'COLONNES' | 'SECTEURS' | 'LIGNES';

export interface RapportResumeDto {
  code: string;
  libelle: string;
  /** `AdmReportData.Sorting`, 0 si absent. */
  ordre: number;
  avecParametres: boolean;
}

export interface GroupeRapportsDto {
  /** « Autres rapports » si le groupe OMRAN est vide. */
  nom: string;
  ordre: number;
  rapports: RapportResumeDto[];
}

export interface OptionRapportDto {
  valeur: string;
  libelle: string;
}

export interface ParametreRapportDto {
  /** Nom du paramètre de requête (conventions : `trancheId`, `commercialId`, `du`, `au`, `annee`). */
  nom: string;
  libelle: string;
  type: TypeParametre;
  obligatoire: boolean;
  /** Vrai : le paramètre se répète dans l'URL (`trancheId=…&trancheId=…`). */
  multiple: boolean;
  /** Date `aaaa-MM-jj` pour un `DATE` ; null si aucun défaut. */
  valeurParDefaut: string | null;
  /** Remplies pour `CHOIX`, `TRANCHES` et `COMMERCIAUX`. */
  options: OptionRapportDto[];
  /** Bornes incluses d'un `ENTIER`, null si aucune. */
  min: number | null;
  max: number | null;
}

export interface DescripteurRapportDto {
  code: string;
  module: ModuleRapport;
  libelle: string;
  groupe: string;
  parametres: ParametreRapportDto[];
  formatsExport: string[];
}

export interface ColonneRapportDto {
  nom: string;
  libelle: string;
  type: TypeColonne;
  /** En-tête de groupe de colonnes. */
  groupe: string | null;
  fonctionTotal: FonctionTotal;
  /** Décimales affichées d'un `NOMBRE` (0 par défaut). */
  decimales: number;
}

export interface GraphiqueRapportDto {
  type: TypeGraphique;
  titre: string;
  colonneCategorie: string;
  /** Une série par colonne ; `SECTEURS` n'en a qu'une. */
  colonnesValeurs: string[];
}

/** Valeur d'une cellule : nombre JSON, date `aaaa-MM-jj` en texte, booléen, ou null. */
export type ValeurRapport = string | number | boolean | null;

export interface SectionRapportDto {
  id: string;
  titre: string;
  colonnes: ColonneRapportDto[];
  /** Clé = `ColonneRapportDto.nom`. */
  lignes: Record<string, ValeurRapport>[];
  groupePar: string | null;
  /** Calculés par le serveur, jamais recalculés ; null si la section est vide. */
  totaux: Record<string, ValeurRapport> | null;
  /** Clé = valeur de la colonne `groupePar` ; null sans regroupement. */
  sousTotaux: Record<string, Record<string, ValeurRapport>> | null;
  graphiques: GraphiqueRapportDto[];
}

export interface ResultatRapportDto {
  code: string;
  libelle: string;
  module: ModuleRapport;
  /** Valeurs appliquées, défauts compris. */
  parametres: Record<string, string[]>;
  genereLe: string;
  avertissements: string[];
  sections: SectionRapportDto[];
}
