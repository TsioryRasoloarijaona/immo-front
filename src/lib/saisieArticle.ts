import { brouillonDepuis, champsDe, corpsDepuis, type Brouillon, type ChampDef, type SectionSaisie } from './saisiePatrimoine';
import type { ArticleDetailDto } from '../types';

export type ModePrix = 'HT' | 'TTC';
export type Surface = 'Provisoire' | 'Definitif';

export function sectionsArticle(sousArticle: boolean, creation: boolean): SectionSaisie[] {
  const identite: ChampDef[] = [
    ...(sousArticle ? [] : [{ nom: 'trancheId', libelle: 'Tranche', type: 'liste', liste: 'tranches', obligatoire: true } as const]),
    { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
    { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
    ...(sousArticle ? [] : [{ nom: 'vocationId', libelle: 'Vocation', type: 'liste', liste: 'vocations' } as const]),
    { nom: 'categorieId', libelle: 'Catégorie', type: 'liste', liste: 'categories', obligatoire: true },
    { nom: 'typeId', libelle: 'Type', type: 'liste', liste: 'types', obligatoire: true },
    { nom: 'immeubleId', libelle: 'Immeuble', type: 'liste', liste: 'immeubles', obligatoire: true },
    { nom: 'etageId', libelle: 'Étage', type: 'liste', liste: 'etages', obligatoire: true },
    // `toujoursAffecte` ne s'écrit qu'à la création d'un sous-article (PATCH l'ignore) : absent en modification.
    ...(sousArticle && creation ? [{ nom: 'toujoursAffecte', libelle: 'Toujours affecté', type: 'booleen' } as const] : []),
  ];
  return [
    { titre: 'Identité', champs: identite },
    {
      titre: 'Remises',
      champs: [
        { nom: 'remiseMax1', libelle: 'Remise max 1', type: 'pourcent' },
        { nom: 'remiseMax2', libelle: 'Remise max 2', type: 'pourcent' },
      ],
    },
    {
      titre: 'Foncier',
      champs: [
        { nom: 'titreFoncier', libelle: 'Titre foncier', type: 'texte' },
        { nom: 'estTitre', libelle: 'Titré', type: 'booleen' },
      ],
    },
    {
      titre: 'Divers',
      champs: [
        { nom: 'adresse', libelle: 'Adresse', type: 'texte' },
        { nom: 'surfaceInterieure', libelle: 'Surface intérieure', type: 'montant' },
        { nom: 'surfaceMurs', libelle: 'Surface des murs', type: 'montant' },
        { nom: 'surfacePartiesCommunes', libelle: 'Surface des parties communes', type: 'montant' },
        { nom: 'notes', libelle: 'Notes', type: 'texteLong' },
      ],
    },
  ];
}

/** Champs saisis dans la carte « Surfaces et prix » ; les prix au m² y sont gérés à part (sens HT ou TTC). */
export const CHAMPS_SURFACES: ChampDef[] = [
  { nom: 'surfaceProvisoire', libelle: 'Surface provisoire', type: 'montant' },
  { nom: 'surfaceDefinitive', libelle: 'Surface définitive', type: 'montant' },
  { nom: 'tauxTva', libelle: 'TVA', type: 'pourcent' },
];

/** Un article occupé ne modifie plus ses prix, surfaces et classification (§5.4.4) : champs figés. */
export const CHAMPS_PROTEGES = ['code', 'vocationId', 'categorieId', 'typeId', 'remiseMax1', 'remiseMax2',
  ...CHAMPS_SURFACES.map((c) => c.nom)];

export function champsArticle(sousArticle: boolean): ChampDef[] {
  return [...champsDe(sectionsArticle(sousArticle, true)), ...CHAMPS_SURFACES];
}

export function brouillonArticle(sousArticle: boolean, article?: Partial<ArticleDetailDto>): Brouillon {
  // Noms historiques du détail : `area` = surface définitive, `tauxTVA` = taux de TVA.
  const source = { estTitre: !sousArticle, ...article, surfaceDefinitive: article?.area, tauxTva: article?.tauxTVA };
  return {
    ...brouillonDepuis(champsArticle(sousArticle), source),
    modeProvisoire: 'HT',
    prixM2Provisoire: article?.prixM2ProvisoireHT == null ? '' : String(article.prixM2ProvisoireHT),
    modeDefinitif: 'HT',
    prixM2Definitif: article?.prixM2DefinitifHT == null ? '' : String(article.prixM2DefinitifHT),
  };
}

/** Corps d'écriture : chaque prix au m² part sous son sens de saisie (`prixM2DefinitifHT` ou `…TTC`), jamais les deux. */
export function corpsArticle(sousArticle: boolean, brouillon: Brouillon, initial?: Brouillon): Record<string, unknown> {
  const corps = corpsDepuis(champsArticle(sousArticle), brouillon, initial);
  for (const surface of ['Provisoire', 'Definitif'] as const) {
    const prix = String(brouillon[`prixM2${surface}`]);
    const mode = String(brouillon[`mode${surface}`]);
    const change = !initial || prix !== initial[`prixM2${surface}`] || mode !== initial[`mode${surface}`];
    if (change && prix.trim() !== '') corps[`prixM2${surface}${mode}`] = Number(prix);
  }
  return corps;
}

export interface ApercuPrix {
  prixM2HT: number;
  prixM2TTC: number;
  prixHT: number;
  prixTTC: number;
}

/** Aperçu à l'écran des formules OMRAN ; le serveur recalcule en décimal exact à l'enregistrement. */
export function apercuPrix(surface: number, prixM2: number, mode: ModePrix, tauxTva: number): ApercuPrix {
  const prixM2HT = mode === 'HT' ? prixM2 : prixM2 / (1 + tauxTva);
  const prixM2TTC = mode === 'TTC' ? prixM2 : prixM2 * (1 + tauxTva);
  return { prixM2HT, prixM2TTC, prixHT: prixM2HT * surface, prixTTC: prixM2TTC * surface };
}
