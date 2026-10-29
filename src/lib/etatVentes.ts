import type { FiltresEtatVentes } from './api';
import { canonicalStatusLabel, toneForStatus } from './dossierStatus';
import type {
  BadgeTone,
  ComptesParStatut,
  LigneSynthese,
  StatutSynthese,
  SyntheseEtatVentesDto,
} from '../types';

export type NatureEtatVentes = NonNullable<FiltresEtatVentes['nature']>;
export type ChampDateEtatVentes = NonNullable<FiltresEtatVentes['champDate']>;

export const ONGLETS_ETAT_VENTES = [
  { id: 'synthese', libelle: 'Synthèse par statut' },
  { id: 'liste', libelle: 'Liste des articles' },
] as const;

export type OngletEtatVentes = (typeof ONGLETS_ETAT_VENTES)[number]['id'];

export const VIDE_ETAT_VENTES = 'Aucun article pour ces filtres';

/** Valeur inconnue ou absente de `?onglet=` : la synthèse. */
export function ongletEtatVentes(valeur: string | null): OngletEtatVentes {
  return valeur === 'liste' ? 'liste' : 'synthese';
}

/** État des filtres de la liste ; `search` est débouncé par la page avant l'appel. */
export type FiltresListeEtatVentes = {
  entiteId: string[];
  trancheId: string[];
  projetId: string | null;
  categorieId: string[];
  statut: string[];
  typeId: string[];
  nature: NatureEtatVentes;
  search: string;
  champDate: ChampDateEtatVentes;
  du: string;
  au: string;
};

export const FILTRES_ETAT_VENTES_DEFAUT: FiltresListeEtatVentes = {
  entiteId: [],
  trancheId: [],
  projetId: null,
  categorieId: [],
  statut: [],
  typeId: [],
  nature: 'TOUS',
  search: '',
  champDate: 'RESERVATION',
  du: '',
  au: '',
};

export const NATURE_ITEMS: { label: string; value: NatureEtatVentes }[] = [
  { label: 'Articles et sous-articles', value: 'TOUS' },
  { label: 'Articles', value: 'ARTICLES' },
  { label: 'Sous-articles', value: 'SOUS_ARTICLES' },
];

export const CHAMP_DATE_ITEMS: { label: string; value: ChampDateEtatVentes }[] = [
  { label: 'Date réservation', value: 'RESERVATION' },
  { label: 'Date concrétisation', value: 'CONCRETISATION' },
  { label: 'Date formalisation', value: 'FORMALISATION' },
];

function liste(valeurs: string[]): string[] | undefined {
  return valeurs.length > 0 ? valeurs : undefined;
}

/** Mêmes paramètres pour la liste, les groupes, les totaux et l'export. */
export function paramsEtatVentes(f: FiltresListeEtatVentes): FiltresEtatVentes {
  const periode = f.du !== '' || f.au !== '';
  return {
    entiteId: liste(f.entiteId),
    trancheId: liste(f.trancheId),
    projetId: f.projetId ?? undefined,
    categorieId: liste(f.categorieId),
    statut: liste(f.statut),
    typeId: liste(f.typeId),
    nature: f.nature === 'TOUS' ? undefined : f.nature,
    search: f.search.trim() || undefined,
    champDate: periode ? f.champDate : undefined,
    du: f.du || undefined,
    au: f.au || undefined,
  };
}

export function filtresEtatVentesActifs(f: FiltresListeEtatVentes): boolean {
  return JSON.stringify(f) !== JSON.stringify(FILTRES_ETAT_VENTES_DEFAUT);
}

function additionner(lignes: LigneSynthese[]): { total: number; parStatut: ComptesParStatut } {
  const parStatut: Record<string, number> = {};
  let total = 0;
  for (const l of lignes) {
    total += l.total;
    for (const [code, n] of Object.entries(l.parStatut)) parStatut[code] = (parStatut[code] ?? 0) + (n ?? 0);
  }
  return { total, parStatut };
}

/** Ce qu'un clic sur une cellule de la synthèse applique à la liste ; un champ absent = pas de restriction. */
export type ChoixSynthese = {
  trancheId?: string;
  categorieId?: string;
  statut?: string;
};

export type LigneSyntheseAffichee = {
  cle: string;
  tranche: string;
  categorie: string;
  niveau: 'ligne' | 'sous-total' | 'total';
  total: number;
  parStatut: ComptesParStatut;
  choix: ChoixSynthese;
};

/** Lignes tranche × catégorie, un sous-total après chaque tranche, puis les totaux par catégorie et le général. */
export function lignesSynthese(s: SyntheseEtatVentesDto): LigneSyntheseAffichee[] {
  const parTranche = new Map<string, LigneSynthese[]>();
  for (const l of s.lignes) parTranche.set(l.trancheId, [...(parTranche.get(l.trancheId) ?? []), l]);
  const sortie: LigneSyntheseAffichee[] = [];
  for (const [trancheId, lignes] of parTranche) {
    const tranche = lignes[0].trancheLibelle || lignes[0].trancheCode;
    for (const l of lignes) {
      sortie.push({
        cle: `${trancheId}|${l.categorieId}`,
        tranche,
        categorie: l.categorieLibelle || l.categorieCode,
        niveau: 'ligne',
        total: l.total,
        parStatut: l.parStatut,
        choix: { trancheId, categorieId: l.categorieId },
      });
    }
    sortie.push({ cle: trancheId, tranche, categorie: 'Sous-total', niveau: 'sous-total', ...additionner(lignes), choix: { trancheId } });
  }
  for (const c of s.totaux.parCategorie) {
    sortie.push({
      cle: `total|${c.categorieId}`,
      tranche: 'Toutes tranches',
      categorie: c.categorieLibelle || c.categorieCode,
      niveau: 'total',
      total: c.total,
      parStatut: c.parStatut,
      choix: { categorieId: c.categorieId },
    });
  }
  sortie.push({ cle: 'total', tranche: 'Total général', categorie: '', niveau: 'total', ...s.totaux.general, choix: {} });
  return sortie;
}

export type FiltresSyntheseEtatVentes = Pick<FiltresListeEtatVentes, 'entiteId' | 'trancheId' | 'projetId' | 'categorieId'>;

/** Les autres filtres de la liste sont remis à zéro : la liste compte alors exactement la cellule cliquée (R5). */
export function filtresDepuisChoix(choix: ChoixSynthese, base: FiltresSyntheseEtatVentes): FiltresListeEtatVentes {
  return {
    ...FILTRES_ETAT_VENTES_DEFAUT,
    entiteId: base.entiteId,
    projetId: base.projetId,
    trancheId: choix.trancheId ? [choix.trancheId] : base.trancheId,
    categorieId: choix.categorieId ? [choix.categorieId] : base.categorieId,
    statut: choix.statut ? [choix.statut] : [],
  };
}

export function toneStatutVente(code: string | undefined, libelle: string | null | undefined): BadgeTone {
  if (code === 'LIBRE') return 'neutral';
  if (code === 'SANS_STATUT') return 'amber';
  return toneForStatus(libelle ?? undefined);
}

export function libelleStatutVente(statuts: StatutSynthese[], code: string): string {
  return canonicalStatusLabel(statuts.find((s) => s.code === code)?.libelle ?? code);
}
