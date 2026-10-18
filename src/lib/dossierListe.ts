import { canonicalStatusLabel, normalizeStatus } from './dossierStatus';
import type { ColonneDto, DossierListItemDto } from '../types';
import type { TotauxServeurGrille } from './totauxServeur';

/** Codes `StrStatus` dont la normalisation ne rejoint pas le libellé canonique (`dossierStatus.ts`). */
const ALIAS_STATUT: Record<string, string> = {
  ANNULATION: 'Annulé',
  REMISEDESCLEFS: 'Remise des clés',
  LIBRE: 'Libre',
};

/** Libellé de la colonne Statut : code serveur ou lot libre ramené au libellé canonique, jamais le code brut. */
export function libelleStatutLigne(d: DossierListItemDto): string {
  return d.libre ? 'Libre' : libelleStatut(d.statut);
}

/** Code `StrStatus` → libellé canonique, alias compris (aussi pour les clés de groupe). */
export function libelleStatut(code: string | null | undefined): string {
  return ALIAS_STATUT[normalizeStatus(code)] ?? canonicalStatusLabel(code);
}
import type {
  LignesListeDossiers,
  MontantsNatureDossier,
  StatutListeDossierDto,
  TotauxDossiersDto,
} from '../types/dossierListe';

/** Option « Libre » du filtre de statut : pas un code `StrStatus`, elle se traduit par `lignes`. */
export const OPTION_LIBRE = '__LIBRE__';

/** Σ en tête de liste : prix HT, prix TTC et total à payer, sur tout le résultat filtré. */
export const AGREGATS_TOTAUX = ['prixHt', 'prix', 'totalAPayer'] as const;

/** Montants par nature additionnés par `GET /api/dossiers/totaux` (les taux ne s'additionnent pas). */
const SOMMES_NATURE: ReadonlySet<string> = new Set<keyof MontantsNatureDossier>([
  'prixContractuel', 'prixContractuelRegle', 'prixContractuelReste', 'prixRegle', 'prixReste',
  'netAPayerRegle', 'netAPayerReste', 'avance', 'avanceReglee', 'avanceReste', 'autofinancement',
  'autofinancementRegle', 'autofinancementReste', 'credit', 'creditRegle', 'creditReste', 'frais',
  'fraisRegles', 'fraisReste', 'tropPercu', 'tropPercuRegle', 'tropPercuReste',
]);

export type TonSomme = 'regle' | 'reste' | 'neutre';

/** Réglé en vert, reste en rouge, comme les totaux de la grille OMRAN. */
export function tonSomme(nom: string): TonSomme {
  if (nom.endsWith('Reste')) return 'reste';
  if (/Regl(e|ee|es)$/.test(nom)) return 'regle';
  return 'neutre';
}

/** `/totaux` relit l'échéancier de tout le filtre : ne l'appeler que si une colonne additionnée est affichée. */
export function demandeTotauxNature(colonnes: readonly ColonneDto[]): boolean {
  return colonnes.some((c) => SOMMES_NATURE.has(c.nom));
}

/** Σ des colonnes de montants par nature affichées, dans l'ordre de la grille. */
export function sommesAffichees(
  colonnes: readonly ColonneDto[],
  totaux: TotauxDossiersDto | null | undefined,
): { nom: string; libelle: string; valeur: number; ton: TonSomme }[] {
  if (!totaux) return [];
  return colonnes
    .filter((c) => SOMMES_NATURE.has(c.nom) && typeof totaux.sommes[c.nom] === 'number')
    .map((c) => ({ nom: c.nom, libelle: c.libelle, valeur: totaux.sommes[c.nom], ton: tonSomme(c.nom) }));
}

/** Sélection du filtre → `?statut=` (codes) et `?lignes=` ; « Libre » seul = les lots libres seuls. */
export function filtreStatuts(selection: string[]): { statut?: string[]; lignes?: LignesListeDossiers } {
  const avecLibre = selection.includes(OPTION_LIBRE);
  const codes = selection.filter((s) => s !== OPTION_LIBRE);
  if (!avecLibre) return { statut: codes.length > 0 ? codes : undefined };
  return codes.length > 0 ? { statut: codes, lignes: 'DOSSIERS_ET_LIBRES' } : { lignes: 'LIBRES' };
}

/** Cases « Inclure annulés / désistés » et « Ordre OMRAN » : absentes de la requête quand décochées. */
export function optionsListe(inclureSortis: boolean, ordreOmran: boolean): { inclureSortis?: true; ordreOmran?: true } {
  return { inclureSortis: inclureSortis || undefined, ordreOmran: ordreOmran || undefined };
}

/** Dates que seuls les dossiers sortis portent : les choisir sans inclure les sortis rendrait une liste vide. */
const CHAMPS_DATE_DES_SORTIS = new Set(['ANNULATION']);

export function exigeLesSortis(champDate: string): boolean {
  return CHAMPS_DATE_DES_SORTIS.has(champDate);
}

/** Σ serveur en liste plate seulement, et rien à totaliser sur des lots libres seuls (ce ne sont pas des dossiers). */
export function totauxDossiersActifs(enGroupes: boolean, lignes: LignesListeDossiers | undefined): boolean {
  return !enGroupes && lignes !== 'LIBRES';
}

/** Σ serveur : avec des lots libres affichés, la bande dit qu'ils sont hors des totaux (seuls les dossiers comptent). */
export function totauxSurDossiers(
  totaux: TotauxServeurGrille | undefined,
  lignes: LignesListeDossiers | undefined,
): TotauxServeurGrille | undefined {
  if (!totaux || lignes !== 'DOSSIERS_ET_LIBRES') return totaux;
  return { ...totaux, libelle: (nombre) => `Totaux sur ${nombre} dossier(s) filtré(s), lots libres exclus` };
}

/** Avec des lots libres, une ligne n'est pas toujours un dossier. */
export function uniteDeLigne(lignes: LignesListeDossiers | undefined): string {
  return lignes ? 'ligne' : 'dossier';
}

/** Options du filtre : statuts du serveur (sorties signalées), puis « Libre ». */
export function optionsStatuts(statuts: StatutListeDossierDto[]): { label: string; value: string }[] {
  return [
    ...statuts.map((s) => ({ label: `${libelleStatut(s.code) || s.code}${s.sortie ? ' (sortie)' : ''}`, value: s.code })),
    { label: 'Libre', value: OPTION_LIBRE },
  ];
}

/**
 * `?colonnes=` toujours envoyé : sur la sélection par défaut, le serveur ne sert pas les champs des icônes de ligne.
 * On rejoue donc le défaut du catalogue plus `toujours`. Catalogue absent : `undefined` (rien n'est encore demandé).
 */
export function colonnesListe(
  demandees: string[] | undefined,
  catalogue: ColonneDto[],
  toujours: string[],
): string[] | undefined {
  if (demandees) return demandees;
  if (catalogue.length === 0) return undefined;
  const noms = new Set(catalogue.map((c) => c.nom));
  return [...new Set([...catalogue.filter((c) => c.parDefaut).map((c) => c.nom), ...toujours.filter((n) => noms.has(n))])];
}

/** Une ligne « Libre » s'ouvre sur la fiche de l'article, un dossier sur la sienne. */
export function routeDeLigne(ligne: DossierListItemDto | undefined, id: string): string {
  return ligne?.libre ? `/articles/${id}` : `/dossiers/${id}`;
}
