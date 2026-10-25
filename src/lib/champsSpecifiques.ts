// Conversions des champs spécifiques : fil (date aaaa-mm-jj, décimale au point, pourcentage en fraction, true/false) ↔ saisie.
import { formatCurrency, formatDate, formatNumber, formatPercent } from './format';
import type { ChampSpecifiqueDto } from '../types/champsSpecifiques';

export const TYPE_BIT = 'Bit';
export const TYPE_LISTE = 'Drop down';
const TYPE_POURCENTAGE = 'Percentage';
const TYPES_NOMBRE = new Set(['Decimal', 'Money', 'Int', TYPE_POURCENTAGE]);

/** Libellés français des types de donnée (Code de `AdmSpecificFieldDataType`). */
export const LIBELLES_TYPES: Readonly<Record<string, string>> = {
  String: 'Texte',
  Date: 'Date',
  Decimal: 'Décimal',
  Money: 'Montant',
  Int: 'Entier',
  Percentage: 'Pourcentage',
  Bit: 'Oui / Non',
  [TYPE_LISTE]: 'Liste déroulante',
};

export function typeSaisie(type: string | null): 'date' | 'number' | 'text' {
  if (type === 'Date') return 'date';
  return type !== null && TYPES_NOMBRE.has(type) ? 'number' : 'text';
}

/** Valeur du fil → texte du champ de saisie (le pourcentage se saisit en %, il voyage en fraction). */
export function valeurEnSaisie(type: string | null, valeur: string | null): string {
  if (valeur === null) return '';
  return type === TYPE_POURCENTAGE ? String(Math.round(Number(valeur) * 1e6) / 1e4) : valeur;
}

export function saisieEnValeur(type: string | null, saisie: string): string | null {
  if (saisie.trim() === '') return null;
  return type === TYPE_POURCENTAGE ? String(Math.round(Number(saisie) * 1e4) / 1e6) : saisie;
}

/** Texte affiché en lecture seule. */
export function valeurAffichee(champ: ChampSpecifiqueDto): string {
  const v = champ.valeur;
  if (v === null || v === '') return '—';
  switch (champ.typeDonnee) {
    case 'Date': return formatDate(v);
    case 'Money': return formatCurrency(Number(v));
    case 'Percentage': return formatPercent(Number(v));
    case 'Decimal': return formatNumber(Number(v), 2);
    case 'Int': return formatNumber(Number(v));
    case TYPE_BIT: return v === 'true' ? 'Oui' : 'Non';
    default: return v;
  }
}

export interface GroupeChamps {
  categorie: string;
  champs: ChampSpecifiqueDto[];
}

const ordre = (n: number | null) => n ?? Number.MAX_SAFE_INTEGER;

/** Champs regroupés par catégorie, catégories puis champs dans l'ordre défini. */
export function grouperParCategorie(champs: readonly ChampSpecifiqueDto[]): GroupeChamps[] {
  const tries = [...champs].sort(
    (a, b) => ordre(a.ordreCategorie) - ordre(b.ordreCategorie) || ordre(a.ordre) - ordre(b.ordre),
  );
  const groupes = new Map<string, ChampSpecifiqueDto[]>();
  for (const champ of tries) {
    const categorie = champ.categorie ?? 'Général';
    groupes.set(categorie, [...(groupes.get(categorie) ?? []), champ]);
  }
  return [...groupes].map(([categorie, liste]) => ({ categorie, champs: liste }));
}
