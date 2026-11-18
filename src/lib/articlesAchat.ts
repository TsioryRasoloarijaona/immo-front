import { triggerBlobDownload } from './api';
import type { ArticleAchatDto, ArticleAchatEcritureDto } from '../types/articlesAchat';

export type CleMontant = 'prixUnitaireHT' | 'coutLogistiqueHT' | 'coutIndirectHT' | 'coutFinancierHT' | 'prixVenteHT';
export type CleRatio = 'fodec' | 'coutLogistiqueTva' | 'coutIndirectTva' | 'coutFinancierTva' | 'venteTva';
export type CleTexte = 'code' | 'description' | 'categorieComptableId' | 'familleId' | 'sousFamilleId' | 'unite' | 'notes';

/** Saisie de la fiche : tout en texte ; les ratios sont saisis en pourcentage (20 pour 0,2). */
export type BrouillonArticle = Record<CleTexte | CleMontant | CleRatio, string>;

export const MONTANTS: CleMontant[] = ['prixUnitaireHT', 'coutLogistiqueHT', 'coutIndirectHT', 'coutFinancierHT', 'prixVenteHT'];
export const RATIOS: CleRatio[] = ['fodec', 'coutLogistiqueTva', 'coutIndirectTva', 'coutFinancierTva', 'venteTva'];

const arrondi = (v: number) => Math.round(v * 1e6) / 1e6;

export function brouillonVide(): BrouillonArticle {
  const b = { code: '', description: '', categorieComptableId: '', familleId: '', sousFamilleId: '', unite: '', notes: '' };
  return Object.assign(b, ...MONTANTS.map((k) => ({ [k]: '' })), ...RATIOS.map((k) => ({ [k]: '' }))) as BrouillonArticle;
}

export function brouillonDepuis(a: ArticleAchatDto): BrouillonArticle {
  const b = brouillonVide();
  b.code = a.code;
  b.description = a.description;
  b.categorieComptableId = a.categorieComptableId;
  b.familleId = a.familleId ?? '';
  b.sousFamilleId = a.sousFamilleId;
  b.unite = a.unite ?? '';
  b.notes = a.notes ?? '';
  for (const k of MONTANTS) b[k] = String(a[k]);
  for (const k of RATIOS) b[k] = String(arrondi(a[k] * 100));
  return b;
}

const texte = (v: string) => (v.trim() === '' ? null : v.trim());
const nombre = (v: string) => (v.trim() === '' ? null : Number(v.replace(',', '.')));

export function corpsDepuis(b: BrouillonArticle): ArticleAchatEcritureDto {
  const corps: ArticleAchatEcritureDto = {
    code: texte(b.code),
    description: texte(b.description),
    categorieComptableId: texte(b.categorieComptableId),
    familleId: texte(b.familleId),
    sousFamilleId: texte(b.sousFamilleId),
    unite: texte(b.unite),
    notes: texte(b.notes),
  };
  for (const k of MONTANTS) corps[k] = nombre(b[k]);
  for (const k of RATIOS) {
    const n = nombre(b[k]);
    corps[k] = n === null ? null : arrondi(n / 100);
  }
  return corps;
}

const ENTETES_CSV = [
  'Code', 'Description', 'Unité', 'P.U. HT', 'FODEC (%)', 'Coût logistique HT', 'Coût logistique TVA (%)',
  'Coût indirect HT', 'Coût indirect TVA (%)', 'Coût financier HT', 'Coût financier TVA (%)', 'Vente P.U. HT',
  'Vente TVA (%)', 'Famille', 'Sous-famille', 'Catégorie', 'Notes',
];

function cellule(v: string | number | null): string {
  const brut = typeof v === 'number' ? String(v).replace('.', ',') : (v ?? '');
  return `"${brut.replaceAll('"', '""')}"`;
}

/** Export fait côté front : CSV à points-virgules, ouvert directement par Excel. */
export function exporterArticlesCsv(articles: ArticleAchatDto[]): void {
  const lignes = articles.map((a) => [
    a.code, a.description, a.unite, a.prixUnitaireHT, arrondi(a.fodec * 100), a.coutLogistiqueHT, arrondi(a.coutLogistiqueTva * 100),
    a.coutIndirectHT, arrondi(a.coutIndirectTva * 100), a.coutFinancierHT, arrondi(a.coutFinancierTva * 100), a.prixVenteHT,
    arrondi(a.venteTva * 100), a.familleCode, a.sousFamilleCode, a.categorieComptableCode, a.notes,
  ]);
  const csv = [ENTETES_CSV, ...lignes].map((l) => l.map(cellule).join(';')).join('\r\n');
  const jour = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(new Blob([String.fromCodePoint(0xfeff), csv],{ type: 'text/csv;charset=utf-8' }), `articles-achat_${jour}.csv`);
}
