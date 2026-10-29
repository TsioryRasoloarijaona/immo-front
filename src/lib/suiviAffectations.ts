import type { FiltresSuiviAffectations } from './api';
import { ENCAISSEMENT_ETAT_LABELS } from './domain';
import { canonicalStatusLabel } from './dossierStatus';
import { CASCADE_VIDE, type SelectionCascade } from './cascadeTranches';

type Item = { label: string; value: string };

export type SensAffectation = NonNullable<FiltresSuiviAffectations['sens']>;

/** État des filtres de la liste ; `search` est débouncé par la page avant l'appel. */
export type FiltresListeAffectations = SelectionCascade & {
  categorieId: string[];
  typeId: string[];
  statut: string[];
  etatPiece: string[];
  sens: SensAffectation;
  search: string;
  du: string;
  au: string;
};

/** Période par défaut : l'année en cours, comme l'écran OMRAN. */
export function filtresAffectationsDefaut(): FiltresListeAffectations {
  const annee = new Date().getFullYear();
  return {
    ...CASCADE_VIDE,
    categorieId: [],
    typeId: [],
    statut: [],
    etatPiece: [],
    sens: 'TOUS',
    search: '',
    du: `${annee}-01-01`,
    au: `${annee}-12-31`,
  };
}

export const SANS_CATEGORIE: Item = { label: 'Sans catégorie', value: 'SANS_CATEGORIE' };
export const SANS_STATUT: Item = { label: 'Sans statut', value: 'SANS_STATUT' };

export const SENS_ITEMS: { label: string; value: SensAffectation }[] = [
  { label: 'Crédits et débits', value: 'TOUS' },
  { label: 'Crédits', value: 'CREDIT' },
  { label: 'Débits', value: 'DEBIT' },
];

export const LIBELLES_ETAT_PIECE: Record<string, string> = { ...ENCAISSEMENT_ETAT_LABELS, SANS_ETAT: 'Sans état' };

export const ETAT_PIECE_ITEMS: Item[] = Object.entries(LIBELLES_ETAT_PIECE).map(([value, label]) => ({ label, value }));

export function libelleSens(sens: string | undefined): string {
  if (!sens) return '—';
  return sens === 'DEBIT' ? 'Débit' : 'Crédit';
}

/** Traduction d'affichage des groupes : la clé envoyée au serveur reste le code brut. */
export const LIBELLES_GROUPE_AFFECTATIONS: Partial<Record<string, (brut: string) => string>> = {
  sens: libelleSens,
  etatPiece: (brut) => LIBELLES_ETAT_PIECE[brut] ?? brut,
  statutDossierLibelle: canonicalStatusLabel,
};

function liste(valeurs: string[]): string[] | undefined {
  return valeurs.length > 0 ? valeurs : undefined;
}

/** Mêmes paramètres pour la liste, les groupes, les totaux et l'export ; `cascade` = `useCascadeTranches(f).params(true)`. */
export function paramsAffectations(
  f: FiltresListeAffectations,
  cascade: Pick<FiltresSuiviAffectations, 'entiteId' | 'trancheId'>,
): FiltresSuiviAffectations {
  return {
    ...cascade,
    categorieId: liste(f.categorieId),
    typeId: liste(f.typeId),
    statut: liste(f.statut),
    etatPiece: liste(f.etatPiece) as FiltresSuiviAffectations['etatPiece'],
    sens: f.sens === 'TOUS' ? undefined : f.sens,
    search: f.search.trim() || undefined,
    du: f.du || undefined,
    au: f.au || undefined,
  };
}

export function filtresAffectationsActifs(f: FiltresListeAffectations): boolean {
  return JSON.stringify(f) !== JSON.stringify(filtresAffectationsDefaut());
}
