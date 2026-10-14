import { canonicalStatusLabel, normalizeStatus } from './dossierStatus';
import type { ColonneDto, DossierListItemDto } from '../types';

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
import type { LignesListeDossiers, StatutListeDossierDto } from '../types/dossierListe';

/** Option « Libre » du filtre de statut : pas un code `StrStatus`, elle se traduit par `lignes`. */
export const OPTION_LIBRE = '__LIBRE__';

/** Σ en tête de liste : prix HT, prix TTC et total à payer, sur tout le résultat filtré. */
export const AGREGATS_TOTAUX = ['prixHt', 'prix', 'totalAPayer'] as const;

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
