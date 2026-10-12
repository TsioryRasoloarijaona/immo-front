import { extraireSaisie, type DefChamp } from '../../lib/saisiePatrimoine';
import type { ArticleDetailDto, ArticleEcritureDto } from '../../types';

/** Formulaire commun article / sous-article : `toujoursAffecte` ne sert qu'à la création d'un sous-article. */
export type SaisieArticle = ArticleEcritureDto & { toujoursAffecte?: boolean };

type Def = DefChamp<SaisieArticle>;

export const IDENTITE: Def[] = [
  { nom: 'code', libelle: 'Code', genre: 'texte', requis: true },
  { nom: 'description', libelle: 'Description', genre: 'texte', requis: true },
];

export const SURFACES_PRIX: Def[] = [
  { nom: 'surfaceProvisoire', libelle: 'Superficie provisoire (m²)', genre: 'nombre', requis: true },
  { nom: 'prixM2ProvisoireHT', libelle: 'Prix du m² provisoire HT', genre: 'montant' },
  { nom: 'surfaceDefinitive', libelle: 'Superficie définitive (m²)', genre: 'nombre', requis: true },
  { nom: 'prixM2DefinitifHT', libelle: 'Prix du m² définitif HT', genre: 'montant' },
  { nom: 'tauxTva', libelle: 'TVA', genre: 'taux' },
];

export const REMISES: Def[] = [
  { nom: 'remiseMax1', libelle: 'Niveau de remise 1', genre: 'taux' },
  { nom: 'remiseMax2', libelle: 'Niveau de remise 2', genre: 'taux' },
];

export const FONCIER: Def[] = [
  { nom: 'titreFoncier', libelle: 'Titre foncier', genre: 'texte' },
  { nom: 'estTitre', libelle: 'Titré', genre: 'case' },
];

export const DIVERS: Def[] = [
  { nom: 'adresse', libelle: 'Adresse', genre: 'texte', large: true },
  { nom: 'notes', libelle: 'Notes', genre: 'texteLong' },
  { nom: 'surfaceInterieure', libelle: 'Superficie intérieure (m²)', genre: 'nombre' },
  { nom: 'surfaceMurs', libelle: 'Superficie des murs (m²)', genre: 'nombre' },
  { nom: 'surfacePartiesCommunes', libelle: 'Superficie des parties communes (m²)', genre: 'nombre' },
];

/** Figés sur un article occupé (FEATURE-patrimoine-ecriture.md §5.4.4) ; le serveur répond 409 sinon. */
const PROTEGES = new Set<string>([
  'code', 'vocationId', 'categorieId', 'typeId', 'surfaceProvisoire', 'surfaceDefinitive',
  'prixM2ProvisoireHT', 'prixM2DefinitifHT', 'tauxTva', 'remiseMax1', 'remiseMax2',
]);

export function estProtege(nom: string): boolean {
  return PROTEGES.has(nom);
}

export function figer(defs: Def[]): Def[] {
  return defs.map((d) => (PROTEGES.has(d.nom) ? { ...d, desactive: true } : d));
}

const SAISIS = [IDENTITE, SURFACES_PRIX, REMISES, FONCIER, DIVERS].flat();

/** Libellé du dossier qui fige l'article : le sien, sinon celui de l'article parent. */
export function dossierOccupant(a: ArticleDetailDto): string | null {
  if (!a.occupe) return null;
  if (a.dossierCode) return a.dossierCode;
  return a.lotParentCode ? `de l’article ${a.lotParentCode}` : 'de location';
}

/** Fiche relue → corps de PATCH ; la superficie définitive est `area` dans la fiche. */
export function versEcriture(a: ArticleDetailDto): SaisieArticle {
  const saisie = extraireSaisie<SaisieArticle>(a, SAISIS, {
    trancheId: a.trancheId,
    vocationId: a.vocationId,
    categorieId: a.categorieId,
    typeId: a.typeId,
    immeubleId: a.immeubleId,
    etageId: a.etageId,
  });
  return { ...saisie, surfaceDefinitive: a.area };
}
