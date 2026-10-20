import { getVillesReferentiel } from './api';
import { useTiersParType } from './editionDossier';
import { choixDepuisLignes } from './fraisTerrain';
import { libelleChoix } from './ongletsTranche';
import {
  referentielItems, useCategoriesTerrain, useCategoriesCharge, useEntitesReferentiel, useNiveauxTerrain, useOrientations, usePays,
  useTypesTerrain, useVocations,
} from './referentiels';
import { listLignesReferentiel } from './apiReferentielsAdmin';
import { ajouterPrixM2, brouillonPrixM2, CHAMPS_SURFACES } from './saisieArticle';
import { brouillonDepuis, champsDe, corpsDepuis, type Brouillon, type ChampDef, type Choix, type SectionSaisie } from './saisiePatrimoine';
import { useApi } from './useApi';
import type { TerrainDetailDto } from '../types/terrains';

/** Références du détail (`{id, code, description}`) : lues en `xxxId` / `xxxLibelle` par le catalogue de champs. */
const REFERENCES = ['entite', 'pays', 'ville', 'nature', 'vocation', 'categorie', 'type', 'niveau', 'vocationTerrain', 'orientation',
  'categorieCharge', 'fournisseur', 'statut'] as const;

export function aplatir(t: TerrainDetailDto): Record<string, unknown> {
  const plat: Record<string, unknown> = { ...t };
  for (const nom of REFERENCES) {
    const reference = t[nom];
    plat[`${nom}Id`] = reference?.id ?? '';
    plat[`${nom}Libelle`] = reference ? libelleChoix(reference) : undefined;
  }
  return plat;
}

const IDENTITE: ChampDef[] = [
  { nom: 'code', libelle: 'Code', type: 'texte', obligatoire: true },
  { nom: 'description', libelle: 'Description', type: 'texte', obligatoire: true },
];

/** Fiche et formulaire d'un terrain, dans l'ordre des onglets OMRAN ; `creation` : pas encore de statut. */
export function sectionsTerrain(creation: boolean): SectionSaisie[] {
  return [
    {
      titre: 'Général',
      champs: [
        ...IDENTITE,
        { nom: 'entiteId', libelle: 'Société', type: 'liste', liste: 'entites', obligatoire: true },
        { nom: 'paysId', libelle: 'Pays', type: 'liste', liste: 'pays', obligatoire: true },
        { nom: 'villeId', libelle: 'Ville', type: 'liste', liste: 'villes', obligatoire: true },
        { nom: 'vocationId', libelle: 'Vocation', type: 'liste', liste: 'vocations', obligatoire: true },
        { nom: 'categorieId', libelle: 'Catégorie', type: 'liste', liste: 'categories', obligatoire: true },
        { nom: 'typeId', libelle: 'Type', type: 'liste', liste: 'types', obligatoire: true },
        ...(creation ? [] : [{ nom: 'statutLibelle', libelle: 'Statut', type: 'texte', lectureSeule: true } as const]),
        { nom: 'niveauId', libelle: 'Niveau', type: 'liste', liste: 'niveaux' },
        { nom: 'vocationTerrainId', libelle: 'Vocation foncière', type: 'liste', liste: 'vocationsTerrain' },
        { nom: 'orientationId', libelle: 'Orientation', type: 'liste', liste: 'orientations' },
        { nom: 'categorieChargeId', libelle: 'Catégorie de charge', type: 'liste', liste: 'categoriesCharge' },
        { nom: 'estTermine', libelle: 'Terrain terminé (non lotissement)', type: 'booleen' },
        { nom: 'adresse', libelle: 'Adresse', type: 'texte' },
        { nom: 'lienGoogle', libelle: 'Lien Google Maps', type: 'texte' },
        { nom: 'notes', libelle: 'Notes', type: 'texteLong' },
      ],
    },
    {
      titre: 'Coûts',
      champs: [
        { nom: 'prixAchatM2', libelle: "Prix d'achat au m²", type: 'montant' },
        { nom: 'prixAchat', libelle: "Prix d'achat", type: 'montant' },
        { nom: 'fournisseurId', libelle: 'Propriétaire (fournisseur par défaut des frais)', type: 'liste', liste: 'fournisseurs' },
        { nom: 'dateAchat', libelle: "Date d'achat", type: 'date' },
        { nom: 'datePermisConstruire', libelle: 'Date du permis de construire', type: 'date' },
        ...(creation ? [] : [
          { nom: 'coutTotal', libelle: 'Coût total (Σ des frais)', type: 'montant', lectureSeule: true } as const,
          { nom: 'coutUnitaireFinal', libelle: 'Coût unitaire final au m²', type: 'montant', lectureSeule: true } as const,
        ]),
      ],
    },
    {
      titre: 'Identification foncière',
      champs: [
        { nom: 'titreFoncier', libelle: 'Titre foncier', type: 'texte' },
        { nom: 'intituleTitreFoncier', libelle: 'Intitulé du titre foncier', type: 'texte' },
        { nom: 'dateTitreFoncier', libelle: 'Date du titre foncier', type: 'date' },
      ],
    },
    { titre: 'Anomalie', champs: [{ nom: 'anomalies', libelle: 'Anomalies', type: 'texteLong' }] },
  ];
}

/** Sous-terrain : le serveur copie le reste du parent. */
export const SECTIONS_SOUS_TERRAIN: SectionSaisie[] = [{ titre: 'Identité', champs: IDENTITE }];

/** Un terrain occupé ne modifie plus ses surfaces, ses prix ni son titre foncier. */
export const CHAMPS_PROTEGES_TERRAIN = ['titreFoncier', ...CHAMPS_SURFACES.map((c) => c.nom)];

export function champsTerrain(sections: SectionSaisie[]): ChampDef[] {
  return [...champsDe(sections), ...CHAMPS_SURFACES];
}

export function brouillonTerrain(sections: SectionSaisie[], terrain?: TerrainDetailDto): Brouillon {
  const source = { estTermine: true, ...(terrain ? aplatir(terrain) : {}) };
  return { ...brouillonDepuis(champsTerrain(sections), source), ...brouillonPrixM2(terrain) };
}

export function corpsTerrain(sections: SectionSaisie[], brouillon: Brouillon, initial?: Brouillon): Record<string, unknown> {
  return ajouterPrixM2(corpsDepuis(champsTerrain(sections), brouillon, initial), brouillon, initial);
}

/** Choix du formulaire terrain ; les villes sont celles du pays choisi. */
export function useListesTerrain(paysId: string): Record<string, Choix> {
  const entites = useEntitesReferentiel();
  const pays = usePays();
  const vocations = useVocations();
  const categories = useCategoriesTerrain();
  const types = useTypesTerrain();
  const niveaux = useNiveauxTerrain();
  const orientations = useOrientations();
  const categoriesCharge = useCategoriesCharge();
  const fournisseurs = useTiersParType('FOU', true);
  const vocationsTerrain = useApi(() => listLignesReferentiel('vocations-terrain'), []);
  const villes = useApi(
    () => (paysId ? getVillesReferentiel({ paysId }, { page: 0, size: 1000 }) : Promise.resolve(null)),
    [paysId],
  );
  return {
    entites: referentielItems(entites.data),
    pays: referentielItems(pays.data),
    villes: referentielItems(villes.data?.content ?? []),
    vocations: referentielItems(vocations.data),
    categories: referentielItems(categories.data),
    types: referentielItems(types.data),
    niveaux: referentielItems(niveaux.data),
    vocationsTerrain: referentielItems(choixDepuisLignes(vocationsTerrain.data ?? undefined)),
    orientations: referentielItems(orientations.data),
    categoriesCharge: referentielItems(categoriesCharge.data),
    fournisseurs: fournisseurs.items,
  };
}
