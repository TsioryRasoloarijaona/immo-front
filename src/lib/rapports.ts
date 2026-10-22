// Logique pure de la visionneuse de rapports : valeurs de filtres ⇄ URL, formats de cellule, regroupement.
import { ApiError } from './api';
import { formatCurrency, formatDate, formatNumber, formatPercentValue } from './format';
import type { ValeursRapport } from './apiRapports';
import type { ColonneRapportDto, ParametreRapportDto, ValeurRapport } from '../types/rapports';

/** Une date vide d'un paramètre qui a un défaut veut dire « sans borne » : le serveur remettrait le défaut. */
const DATE_MIN = '1900-01-01';
const DATE_MAX = '2100-12-31';

export type Issue<T> = { donnees: T } | { statut: number; message: string };

/** Transforme les refus attendus (403, 404, 400…) en valeur, pour que la page les distingue d'une panne. */
export function enIssue<T>(appel: Promise<T>, statuts: number[]): Promise<Issue<T>> {
  return appel.then(
    (donnees) => ({ donnees }),
    (err: unknown) => {
      if (err instanceof ApiError && statuts.includes(err.status)) return { statut: err.status, message: err.message };
      throw err;
    },
  );
}

/** Valeurs d'un paramètre, [] s'il est absent (l'index d'un `Record` ne le dit pas dans son type). */
export function valeursDe(valeurs: ValeursRapport, nom: string): string[] {
  return (valeurs as Partial<ValeursRapport>)[nom] ?? [];
}

export function valeursParDefaut(parametres: ParametreRapportDto[]): ValeursRapport {
  const valeurs: ValeursRapport = {};
  for (const p of parametres) {
    if (p.valeurParDefaut) valeurs[p.nom] = [p.valeurParDefaut];
    else valeurs[p.nom] = p.type === 'BOOLEEN' ? ['false'] : [];
  }
  return valeurs;
}

/** Valeur présente dans l'URL (même vide : « effacé ») sinon le défaut du descripteur. */
export function lireValeurs(parametres: ParametreRapportDto[], recherche: URLSearchParams): ValeursRapport {
  const valeurs = valeursParDefaut(parametres);
  for (const p of parametres) {
    if (recherche.has(p.nom)) valeurs[p.nom] = recherche.getAll(p.nom).filter((v) => v !== '');
  }
  return valeurs;
}

/** Une clé vide reste écrite : sans elle, le défaut reviendrait au rechargement. */
export function versRecherche(valeurs: ValeursRapport): URLSearchParams {
  const recherche = new URLSearchParams();
  for (const [nom, vals] of Object.entries(valeurs)) {
    if (vals.length === 0) recherche.append(nom, '');
    for (const v of vals) recherche.append(nom, v);
  }
  return recherche;
}

function valeurVide(p: ParametreRapportDto): string[] {
  if (p.type !== 'DATE' || !p.valeurParDefaut) return [];
  if (p.nom === 'du') return [DATE_MIN];
  return p.nom === 'au' ? [DATE_MAX] : [];
}

/** Ce qui part au serveur : valeurs non vides, plus les bornes ouvertes d'une période effacée. */
export function valeursServeur(parametres: ParametreRapportDto[], valeurs: ValeursRapport): ValeursRapport {
  const envoi: ValeursRapport = {};
  for (const p of parametres) {
    const vals = valeursDe(valeurs, p.nom).filter((v) => v !== '');
    const retenues = vals.length > 0 ? vals : valeurVide(p);
    if (retenues.length > 0) envoi[p.nom] = retenues;
  }
  return envoi;
}

export function versNombre(v: ValeurRapport | undefined): number | null {
  if (v === null || v === undefined || typeof v === 'boolean') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}

export function formatCellule(colonne: ColonneRapportDto, v: ValeurRapport | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  switch (colonne.type) {
    case 'MONTANT':
      return formatCurrency(versNombre(v));
    case 'NOMBRE':
      return formatNumber(versNombre(v), colonne.decimales);
    case 'POURCENTAGE':
      return formatPercentValue(versNombre(v), 1);
    case 'DATE':
      return formatDate(String(v));
    case 'BOOLEEN':
      return v === true || v === 'true' ? 'Oui' : 'Non';
    default:
      return String(v);
  }
}

export function estNumerique(colonne: ColonneRapportDto): boolean {
  return colonne.type === 'MONTANT' || colonne.type === 'NOMBRE' || colonne.type === 'POURCENTAGE';
}

/** Suites de colonnes contiguës de même `groupe` (en-tête sur deux niveaux) ; null si aucun groupe. */
export function groupesDeColonnes(colonnes: ColonneRapportDto[]): { titre: string; span: number }[] | null {
  if (colonnes.every((c) => !c.groupe)) return null;
  const spans: { titre: string; span: number }[] = [];
  for (const c of colonnes) {
    const titre = c.groupe ?? '';
    const dernier = spans.at(-1);
    if (dernier?.titre === titre) dernier.span += 1;
    else spans.push({ titre, span: 1 });
  }
  return spans;
}

export interface Tri {
  nom: string;
  sens: 1 | -1;
}

export function comparer(colonne: ColonneRapportDto, a: ValeurRapport | undefined, b: ValeurRapport | undefined): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (estNumerique(colonne)) return (versNombre(a) ?? 0) - (versNombre(b) ?? 0);
  return String(a).localeCompare(String(b), 'fr', { numeric: true });
}

export interface LotLignes {
  cle: string;
  lignes: Record<string, ValeurRapport>[];
}

/** Lignes triées/filtrées, puis regroupées par `groupePar` dans l'ordre de première apparition. */
export function preparerLignes(
  lignes: Record<string, ValeurRapport>[],
  colonnes: ColonneRapportDto[],
  groupePar: string | null,
  tri: Tri | null,
  filtre: string,
): LotLignes[] {
  const terme = filtre.trim().toLocaleLowerCase('fr');
  let retenues = lignes;
  if (terme) {
    retenues = lignes.filter((l) => colonnes.some((c) => formatCellule(c, l[c.nom]).toLocaleLowerCase('fr').includes(terme)));
  }
  const colonneTri = tri ? colonnes.find((c) => c.nom === tri.nom) : undefined;
  if (tri && colonneTri) {
    retenues = [...retenues].sort((a, b) => tri.sens * comparer(colonneTri, a[tri.nom], b[tri.nom]));
  }
  if (!groupePar) return [{ cle: '', lignes: retenues }];
  const lots = new Map<string, Record<string, ValeurRapport>[]>();
  for (const l of retenues) {
    const cle = String(l[groupePar] ?? '');
    const lot = lots.get(cle);
    if (lot) lot.push(l);
    else lots.set(cle, [l]);
  }
  return [...lots].map(([cle, ls]) => ({ cle, lignes: ls }));
}
