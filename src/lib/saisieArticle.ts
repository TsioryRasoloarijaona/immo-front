import { referentielItems, useCategoriesCharge, useEntitesReferentiel, useFacades, useOrientations, useVues } from './referentiels';
import { brouillonDepuis, champsDe, corpsDepuis, type Brouillon, type ChampDef, type Choix, type SectionSaisie } from './saisiePatrimoine';
import type { ArticleDetailDto } from '../types';

/** Choix des champs de la fiche (section Autres) : le détail n'en porte que les ids. */
export function useListesFicheArticle(): Record<string, Choix> {
  const orientations = useOrientations();
  const categoriesCharge = useCategoriesCharge();
  const facades = useFacades();
  const entites = useEntitesReferentiel();
  const vues = useVues();
  return {
    orientations: referentielItems(orientations.data),
    categoriesCharge: referentielItems(categoriesCharge.data),
    facades: referentielItems(facades.data),
    entites: referentielItems(entites.data),
    vues: referentielItems(vues.data),
  };
}

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
    // Lu en `presentationTypeId` ; un changement remplace les contenances de l'article.
    { nom: 'presentationId', libelle: 'Type de présentation', type: 'liste', liste: 'presentations', champLibelle: 'presentationTypeLibelle' },
    // `toujoursAffecte` ne s'écrit qu'à la création d'un sous-article (PATCH l'ignore) : absent en modification.
    ...(sousArticle && creation ? [{ nom: 'toujoursAffecte', libelle: 'Toujours affecté', type: 'booleen' } as const] : []),
  ];
  return [{ titre: 'Identité', champs: identite }, ...SECTIONS_FICHE];
}

const compteurs = ([fil, nom]: readonly [string, string]): ChampDef[] => [
  { nom: `reference${fil}`, libelle: `Référence ${nom}`, type: 'texte' },
  { nom: `police${fil}`, libelle: `Police ${nom}`, type: 'texte' },
  { nom: `compteur${fil}`, libelle: `Compteur ${nom}`, type: 'texte' },
  { nom: `releve${fil}`, libelle: `Relevé ${nom}`, type: 'texte' },
];

/** Sections de la fiche après l'identité (onglets OMRAN Superficies / Valorisation, foncier, Autres, Anomalie). */
const SECTIONS_FICHE: SectionSaisie[] = [
  {
    titre: 'Superficies',
    champs: [
      { nom: 'superficieNette', libelle: 'Superficie nette', type: 'surface', lectureSeule: true },
      { nom: 'superficieTitree', libelle: 'Superficie titrée', type: 'surface', lectureSeule: true },
      { nom: 'surfaceInterieure', libelle: 'Surface intérieure', type: 'surface' },
      { nom: 'surfaceMurs', libelle: 'Surface des murs', type: 'surface' },
      { nom: 'surfacePartiesCommunes', libelle: 'Surface des parties communes', type: 'surface' },
    ],
  },
  {
    titre: 'Valorisation',
    champs: [
      { nom: 'remiseMax1', libelle: 'Remise max 1', type: 'pourcent' },
      { nom: 'remiseMax2', libelle: 'Remise max 2', type: 'pourcent' },
      { nom: 'avanceMinimum', libelle: 'Avance minimum', type: 'montant' },
      { nom: 'loyerMensuelHT', libelle: 'Loyer mensuel HT', type: 'montant' },
      { nom: 'nombreCautions', libelle: 'Nombre de cautions', type: 'entier' },
    ],
  },
  {
    titre: 'Identification foncière',
    champs: [
      { nom: 'estTitre', libelle: 'Titré', type: 'booleen' },
      { nom: 'titreFoncier', libelle: 'Titre foncier', type: 'texte' },
      { nom: 'titreFoncierMere', libelle: 'Titre foncier mère', type: 'texte' },
      { nom: 'intituleTitreFoncier', libelle: 'Intitulé du titre foncier', type: 'texte' },
      { nom: 'dateTitreFoncier', libelle: 'Date du titre foncier', type: 'date' },
      { nom: 'proprieteDite', libelle: 'Propriété dite', type: 'texte' },
      { nom: 'numeroEnregistrement', libelle: "Numéro d'enregistrement", type: 'texte' },
      { nom: 'dateEnregistrement', libelle: "Date d'enregistrement", type: 'date' },
      { nom: 'lieuEnregistrement', libelle: "Lieu d'enregistrement", type: 'texte' },
      { nom: 'cpfImmatriculation', libelle: 'Immatriculation CPF', type: 'texte' },
      { nom: 'dateImmatriculation', libelle: "Date d'immatriculation", type: 'date' },
      { nom: 'fractionDivise', libelle: 'Fraction divise', type: 'texte' },
      { nom: 'fractionDiviseTerrain', libelle: 'Fraction divise du terrain', type: 'texte' },
      { nom: 'partiesDivises', libelle: 'Parties divises', type: 'entier' },
      { nom: 'partiesIndivises', libelle: 'Parties indivises', type: 'entier' },
      { nom: 'quotaTerrainGroupe', libelle: 'Quote-part du terrain du groupe', type: 'texte' },
      { nom: 'notesTitreFoncier', libelle: 'Notes du titre foncier', type: 'texteLong' },
    ],
  },
  {
    titre: 'Autres',
    champs: [
      { nom: 'orientationId', libelle: 'Orientation', type: 'liste', liste: 'orientations' },
      { nom: 'categorieChargeId', libelle: 'Catégorie de charge', type: 'liste', liste: 'categoriesCharge' },
      { nom: 'facadeId', libelle: 'Façade', type: 'liste', liste: 'facades' },
      { nom: 'entiteSyndicId', libelle: 'Entité syndic', type: 'liste', liste: 'entites' },
      { nom: 'adresse', libelle: 'Adresse', type: 'texte' },
      { nom: 'disponibleVenteWeb', libelle: 'Disponible pour la vente sur le web', type: 'booleen' },
      { nom: 'disponibleLocationWeb', libelle: 'Disponible pour la location sur le web', type: 'booleen' },
      { nom: 'vueIds', libelle: 'Vues', type: 'multi', liste: 'vues' },
      { nom: 'contenanceLibre', libelle: 'Contenance (texte libre)', type: 'texteLong' },
      { nom: 'notes', libelle: 'Notes', type: 'texteLong' },
    ],
  },
  { titre: 'Compteurs', champs: ([['Electricite', 'électricité'], ['Eau', 'eau'], ['Gaz', 'gaz']] as const).flatMap(compteurs) },
  { titre: 'Anomalie', champs: [{ nom: 'anomalies', libelle: 'Anomalies', type: 'texteLong' }] },
];

/** Champs saisis dans la carte « Surfaces et prix » ; les prix au m² y sont gérés à part (sens HT ou TTC). */
export const CHAMPS_SURFACES: ChampDef[] = [
  { nom: 'surfaceProvisoire', libelle: 'Surface provisoire', type: 'montant' },
  { nom: 'surfaceDefinitive', libelle: 'Surface définitive', type: 'montant' },
  { nom: 'tauxTva', libelle: 'TVA', type: 'pourcent' },
];

/** Un article occupé ne modifie plus ses prix, surfaces, classification ni son titre foncier : champs figés. */
export const CHAMPS_PROTEGES = ['code', 'vocationId', 'categorieId', 'typeId', 'remiseMax1', 'remiseMax2', 'titreFoncier',
  ...CHAMPS_SURFACES.map((c) => c.nom)];

export function champsArticle(sousArticle: boolean): ChampDef[] {
  return [...champsDe(sectionsArticle(sousArticle, true)), ...CHAMPS_SURFACES];
}

export function brouillonArticle(sousArticle: boolean, article?: Partial<ArticleDetailDto>): Brouillon {
  // Noms du détail : `area` = surface définitive, `tauxTVA` = taux de TVA, `presentationTypeId` = présentation.
  const source = {
    estTitre: !sousArticle, ...article,
    surfaceDefinitive: article?.area, tauxTva: article?.tauxTVA, presentationId: article?.presentationTypeId,
  };
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
