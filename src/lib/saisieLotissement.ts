import { getCategoriesBien, getTypesBienReferentiel } from './api';
import { getPresentationsTranche } from './apiPatrimoine';
import {
  referentielItems, useCategoriesCharge, useEntitesReferentiel, useOrientations, useTranchesFiltre, useVocationsArticle,
} from './referentiels';
import { ajouterPrixM2, brouillonPrixM2, CHAMPS_SURFACES, SECTIONS_FICHE } from './saisieArticle';
import { brouillonDepuis, champsDe, corpsDepuis, type Brouillon, type ChampDef, type Choix, type SectionSaisie } from './saisiePatrimoine';
import { useApi } from './useApi';
import type { LotissementDetailDto } from '../types/lotissements';

/** Natures de catégorie et de type admises pour un lot (Question 2). */
const NATURES_LOT = ['TER', 'LOT DE TERRAIN'];

// Sections de la fiche article réutilisées telles quelles : Valorisation, Identification foncière, Compteurs, Anomalie.
const [, VALORISATION, FONCIER, , COMPTEURS, ANOMALIE] = SECTIONS_FICHE;

const IDENTITE: SectionSaisie = {
  titre: 'Identité',
  champs: [
    { nom: 'trancheId', libelle: 'Tranche', type: 'liste', liste: 'tranches', obligatoire: true, champLibelle: 'trancheDescription' },
    { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
    { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
    { nom: 'vocationId', libelle: 'Vocation', type: 'liste', liste: 'vocations', obligatoire: true },
    { nom: 'categorieId', libelle: 'Catégorie', type: 'liste', liste: 'categories', obligatoire: true },
    { nom: 'typeId', libelle: 'Type', type: 'liste', liste: 'types', obligatoire: true },
    { nom: 'presentationId', libelle: 'Type de présentation', type: 'liste', liste: 'presentations', champLibelle: 'presentationTypeLibelle' },
  ],
};

const AUTRES: SectionSaisie = {
  titre: 'Autres',
  champs: [
    { nom: 'orientationId', libelle: 'Orientation', type: 'liste', liste: 'orientations' },
    { nom: 'categorieChargeId', libelle: 'Catégorie de charge', type: 'liste', liste: 'categoriesCharge' },
    { nom: 'entiteSyndicId', libelle: 'Entité syndic', type: 'liste', liste: 'entites' },
    { nom: 'adresse', libelle: 'Adresse', type: 'texte' },
    { nom: 'disponibleVenteWeb', libelle: 'Disponible pour la vente sur le web', type: 'booleen' },
    { nom: 'disponibleLocationWeb', libelle: 'Disponible pour la location sur le web', type: 'booleen' },
    { nom: 'contenanceLibre', libelle: 'Contenance (texte libre)', type: 'texteLong' },
    { nom: 'notes', libelle: 'Notes', type: 'texteLong' },
  ],
};

const URBANISME: SectionSaisie = {
  titre: 'Urbanisme',
  champs: [
    { nom: 'cos', libelle: 'COS', type: 'ratio' },
    { nom: 'cuf', libelle: 'CUF', type: 'ratio' },
    { nom: 'arreteAlignement', libelle: "Arrêté d'alignement", type: 'ratio' },
    { nom: 'retraitVoisin', libelle: 'Retrait voisin', type: 'ratio' },
    { nom: 'hauteurMax', libelle: 'Hauteur maximale', type: 'ratio' },
    { nom: 'latitude', libelle: 'Latitude', type: 'ratio' },
    { nom: 'longitude', libelle: 'Longitude', type: 'ratio' },
  ],
};

/** Sections de la fiche et du formulaire : l'identité d'abord, puis (formulaire) la carte « Surfaces et prix ». */
export const SECTIONS_LOT: SectionSaisie[] = [IDENTITE, VALORISATION, FONCIER, AUTRES, URBANISME, COMPTEURS, ANOMALIE];

/** Un lot occupé ne modifie plus son code, sa classification, ses surfaces, ses prix ni son titre foncier. */
export const CHAMPS_PROTEGES_LOT = ['trancheId', 'code', 'vocationId', 'categorieId', 'typeId', 'titreFoncier', ...CHAMPS_SURFACES.map((c) => c.nom)];

export const CHAMPS_LOT: ChampDef[] = [...champsDe(SECTIONS_LOT), ...CHAMPS_SURFACES];

export function brouillonLot(lot?: LotissementDetailDto, trancheId?: string): Brouillon {
  const source = { ...lot, presentationId: lot?.presentationTypeId, trancheId: lot?.trancheId ?? trancheId };
  return { ...brouillonDepuis(CHAMPS_LOT, source), ...brouillonPrixM2(lot) };
}

export function corpsLot(brouillon: Brouillon, initial?: Brouillon): Record<string, unknown> {
  return ajouterPrixM2(corpsDepuis(CHAMPS_LOT, brouillon, initial), brouillon, initial);
}

/** Choix du formulaire lot ; les présentations sont celles de la tranche, catégories et types ceux de la nature TER. */
export function useListesLot(trancheId: string): Record<string, Choix> {
  const presentations = useApi(() => (trancheId ? getPresentationsTranche(trancheId) : Promise.resolve([])), [trancheId]);
  const tranches = useTranchesFiltre();
  const vocations = useVocationsArticle();
  const categories = useApi(() => Promise.all(NATURES_LOT.map((n) => getCategoriesBien(undefined, n))).then((l) => l.flat()), []);
  const types = useApi(() => Promise.all(NATURES_LOT.map((n) => getTypesBienReferentiel(undefined, n))).then((l) => l.flat()), []);
  const orientations = useOrientations();
  const categoriesCharge = useCategoriesCharge();
  const entites = useEntitesReferentiel();
  return {
    tranches: referentielItems(tranches.data),
    vocations: referentielItems(vocations.data),
    categories: referentielItems(categories.data ?? []),
    types: referentielItems(types.data ?? []),
    presentations: referentielItems(presentations.data ?? []),
    orientations: referentielItems(orientations.data),
    categoriesCharge: referentielItems(categoriesCharge.data),
    entites: referentielItems(entites.data),
  };
}
