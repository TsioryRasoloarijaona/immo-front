import { useState } from 'react';
import { Badge } from '../components/ui';
import type { ColonneGrille } from '../components/DataGrid';
import type { ArticleListFilters } from './api';
import { useDebouncedValue } from './useApi';
import { formatPercent, formatSurface, libellePrix } from './format';
import { canonicalStatusLabel, toneForStatus } from './dossierStatus';
import { grilleDepuisCatalogue, type DispositionColonnes } from './colonnes';
import type { ArticleListItemDto, ArticleStatut, ColonneDto } from '../types';
import type { EtatArticle, FiltresListeArticles, LigneArticleDto } from '../types/sousArticles';

// Filtres et colonnes partagés par `/articles` et l'onglet Articles de la tranche (mêmes libellés).

export type StatutFilter = ArticleStatut | 'all';

export const STATUT_ITEMS: { label: string; value: StatutFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Occupé', value: 'OCCUPE' },
];

export type EtatFilter = EtatArticle | 'all';

export const ETAT_ITEMS: { label: string; value: EtatFilter }[] = [
  { label: 'Tous les états', value: 'all' },
  { label: 'Libre', value: 'LIBRE' },
  { label: 'Vendu', value: 'VENDU' },
  { label: 'Loué', value: 'LOUE' },
];

/** Filtres communs (sans recherche ni tranche) : état saisi, paramètres serveur différés, clé de dépendance. */
export function useFiltresArticles(onChange: () => void) {
  const [statut, setStatut] = useState<StatutFilter>('all');
  const [categorieId, setCategorieId] = useState<string[]>([]);
  const [typeId, setTypeId] = useState<string[]>([]);
  const [entiteId, setEntiteId] = useState<string | null>(null);
  const [natureId, setNatureId] = useState<string | null>(null);
  const [vocationId, setVocationId] = useState<string | null>(null);
  const [etageId, setEtageId] = useState<string | null>(null);
  const [prixDe, setPrixDe] = useState('');
  const [prixA, setPrixA] = useState('');
  const [surfaceDe, setSurfaceDe] = useState('');
  const [surfaceA, setSurfaceA] = useState('');
  const [etat, setEtat] = useState<EtatFilter>('all');
  const [codeParent, setCodeParent] = useState('');
  const debouncedCodeParent = useDebouncedValue(codeParent);
  const debouncedPrixDe = useDebouncedValue(prixDe);
  const debouncedPrixA = useDebouncedValue(prixA);
  const debouncedSurfaceDe = useDebouncedValue(surfaceDe);
  const debouncedSurfaceA = useDebouncedValue(surfaceA);

  function avec<T>(setter: (v: T) => void) {
    return (v: T) => {
      onChange();
      setter(v);
    };
  }

  function reinitialiser() {
    setStatut('all');
    setCategorieId([]);
    setTypeId([]);
    setEntiteId(null);
    setNatureId(null);
    setVocationId(null);
    setEtageId(null);
    setPrixDe('');
    setPrixA('');
    setSurfaceDe('');
    setSurfaceA('');
    setEtat('all');
    setCodeParent('');
  }

  const nombre = (v: string) => (v ? Number(v) : undefined);
  const params: { statut?: ArticleStatut; categorieId?: string[]; typeId?: string[] } & ArticleListFilters &
    Pick<FiltresListeArticles, 'codeParent' | 'etat'> = {
    etat: etat === 'all' ? undefined : etat,
    codeParent: debouncedCodeParent.trim() || undefined,
    statut: statut === 'all' ? undefined : statut,
    categorieId: categorieId.length > 0 ? categorieId : undefined,
    typeId: typeId.length > 0 ? typeId : undefined,
    entiteId: entiteId || undefined,
    natureId: natureId || undefined,
    vocationId: vocationId || undefined,
    etageId: etageId || undefined,
    prixDe: nombre(debouncedPrixDe),
    prixA: nombre(debouncedPrixA),
    surfaceDe: nombre(debouncedSurfaceDe),
    surfaceA: nombre(debouncedSurfaceA),
  };

  const cle = JSON.stringify(params);
  return {
    valeurs: { statut, categorieId, typeId, entiteId, natureId, vocationId, etageId, prixDe, prixA, surfaceDe, surfaceA, etat, codeParent },
    modifier: {
      etat: avec(setEtat),
      codeParent: avec(setCodeParent),
      statut: avec(setStatut),
      categorieId: avec(setCategorieId),
      typeId: avec(setTypeId),
      entiteId: avec(setEntiteId),
      natureId: avec(setNatureId),
      vocationId: avec(setVocationId),
      etageId: avec(setEtageId),
      prixDe: avec(setPrixDe),
      prixA: avec(setPrixA),
      surfaceDe: avec(setSurfaceDe),
      surfaceA: avec(setSurfaceA),
    },
    reinitialiser,
    params,
    cle,
    // JSON.stringify omet les `undefined` : « {} » = aucun filtre.
    actifs: cle !== '{}',
  };
}

export type FiltresArticles = ReturnType<typeof useFiltresArticles>;

// `valeur` de la colonne « État » : sans lui, tri et filtre compareraient le `statut` brut.
function articleEtatLabel(a: Pick<ArticleListItemDto, 'statut' | 'dossierId' | 'dossierStatut'>): string {
  if (a.dossierId) return canonicalStatusLabel(a.dossierStatut) || '';
  return a.statut === 'DISPONIBLE' ? 'Libre' : 'Occupé';
}

function articleEtatBadge(a: Pick<ArticleListItemDto, 'statut' | 'dossierId' | 'dossierStatut'>) {
  if (a.dossierId) {
    const label = canonicalStatusLabel(a.dossierStatut);
    return <Badge tone={toneForStatus(label)}>{label}</Badge>;
  }
  if (a.statut === 'DISPONIBLE') return <Badge tone="success">Libre</Badge>;
  return <Badge tone="neutral">Occupé</Badge>;
}

const tiret = <span className="text-muted-foreground">—</span>;
const surfaceOuTiret = (v: unknown) => (typeof v === 'number' && v ? formatSurface(v) : tiret);

/** Colonnes de la liste des articles ; le prix est `comSalePrice` (article + sous-articles affectés). */
export function colonnesArticles(ouvrirDossier: (id: string) => void): ColonneGrille<ArticleListItemDto>[] {
  return [
    { nom: 'description', libelle: 'Description', largeur: 11, classe: 'text-muted-foreground', titre: (a) => a.description || undefined },
    { nom: 'clientNom', libelle: 'Client', largeur: 8, classe: 'text-muted-foreground', titre: (a) => a.clientNom || undefined },
    { nom: 'etat', libelle: 'État', largeur: 7, valeur: articleEtatLabel, rendu: articleEtatBadge },
    {
      nom: 'comSalePrice',
      libelle: 'Prix de vente',
      type: 'MONTANT',
      largeur: 9,
      classe: 'text-muted-foreground',
      // `valeur` suit le même repli sur le plancher que le rendu, sinon le tri le classerait mal.
      valeur: (a) => a.comSalePrice || a.comSalePriceFloor,
      rendu: (a) => libellePrix(a.comSalePrice, a.comSalePriceFloor) ?? tiret,
    },
    {
      nom: 'tauxTVA',
      libelle: 'TVA',
      type: 'NOMBRE',
      largeur: 5,
      classe: 'text-muted-foreground',
      rendu: (a) => (a.tauxTVA == null ? tiret : formatPercent(a.tauxTVA)),
      formatValeur: (v) => formatPercent(typeof v === 'number' ? v : null),
    },
    {
      nom: 'dossierCode',
      libelle: 'N° Dossier',
      largeur: 6,
      classe: 'text-muted-foreground',
      titre: (a) => a.dossierCode || undefined,
      rendu: (a) =>
        a.dossierCode ? (
          <button
            type="button"
            className="hover:text-foreground hover:underline"
            onClick={(e) => {
              if (!a.dossierId) return;
              e.stopPropagation();
              ouvrirDossier(a.dossierId);
            }}
          >
            {a.dossierCode}
          </button>
        ) : (
          tiret
        ),
    },
    { nom: 'categorieLibelle', libelle: 'Catégorie', largeur: 8, classe: 'text-muted-foreground', titre: (a) => a.categorieLibelle || undefined },
    { nom: 'typeLibelle', libelle: 'Type', largeur: 9, classe: 'text-muted-foreground', titre: (a) => a.typeLibelle || undefined },
    { nom: 'presentationTypeCode', libelle: 'Présent.', largeur: 5, classe: 'text-muted-foreground', titre: (a) => a.presentationTypeLibelle || undefined },
    {
      nom: 'natureCode',
      libelle: 'Nature',
      largeur: 6,
      classe: 'text-muted-foreground',
      valeur: (a) => a.natureCode || a.natureLibelle,
      titre: (a) => a.natureLibelle || undefined,
    },
    {
      nom: 'etageCode',
      libelle: 'Étage',
      largeur: 5,
      classe: 'text-muted-foreground',
      valeur: (a) => a.etageCode || a.etageLibelle,
      titre: (a) => a.etageLibelle || undefined,
    },
    { nom: 'area', libelle: 'Superficie', type: 'NOMBRE', largeur: 6, classe: 'text-muted-foreground', rendu: (a) => surfaceOuTiret(a.area) },
    {
      nom: 'superficieSousArticles',
      libelle: 'Superf. sous-art.',
      type: 'NOMBRE',
      largeur: 7,
      classe: 'text-muted-foreground',
      rendu: (a) => surfaceOuTiret(a.superficieSousArticles),
    },
    {
      nom: 'code',
      libelle: 'Code',
      largeur: 8,
      classe: 'font-medium text-foreground',
      titre: (a) => a.code || undefined,
      rendu: (a) => (
        <>
          {a.code || '—'}
          {a.sousArticle && (
            <Badge tone="neutral" className="ml-1.5 align-middle">
              Sous-article
            </Badge>
          )}
        </>
      ),
    },
  ];
}

const DEFAUTS_ARTICLES = ['description', 'clientNom', 'etat', 'comSalePrice', 'tauxTVA', 'dossierCode', 'categorieLibelle',
  'typeLibelle', 'presentationTypeCode', 'natureCode', 'etageCode', 'area', 'superficieSousArticles', 'code'];
const DEFAUTS_SOUS_ARTICLES = ['description', 'clientNom', 'etat', 'parentCode', 'parentOccupe', 'comSalePrice', 'tauxTVA',
  'dossierCode', 'categorieLibelle', 'typeLibelle', 'natureCode', 'etageCode', 'area', 'code'];

/** Colonnes dont le rendu lit une colonne voisine : `?colonnes=` est une liste close, elles se demandent ensemble. */
const DEPENDANCES: Record<string, string[]> = {
  comSalePrice: ['comSalePriceFloor'],
  dossierCode: ['dossierId'],
  presentationTypeCode: ['presentationTypeLibelle'],
  natureCode: ['natureLibelle'],
  etageCode: ['etageLibelle'],
  code: ['sousArticle'],
};

/** Clés de jointure du catalogue : demandées par le serveur, jamais proposées dans le sélecteur. */
const COLONNES_TECHNIQUES = new Set(['id', 'lotParentId', 'immeubleId', 'etageId', 'natureId', 'categorieId', 'typeId',
  'presentationTypeId', 'dossierId', 'clientId', 'dossierStatut', 'prixSuggereEstPlancher']);

/** Disposition de `/articles` et `/sous-articles` ; le `parDefaut` du serveur est celui de l'ancienne liste fixe. */
export function dispositionLignesArticles(sousArticles: boolean): DispositionColonnes {
  return {
    ordre: sousArticles ? DEFAUTS_SOUS_ARTICLES : DEFAUTS_ARTICLES,
    poids: {},
    masquees: COLONNES_TECHNIQUES,
    dependances: DEPENDANCES,
  };
}

export function catalogueLignesArticles(catalogue: ColonneDto[], sousArticles: boolean): ColonneDto[] {
  const defauts = sousArticles ? DEFAUTS_SOUS_ARTICLES : DEFAUTS_ARTICLES;
  return catalogue.map((c) => ({ ...c, parDefaut: defauts.includes(c.nom) }));
}

const etatLigneBadge = (a: LigneArticleDto) => {
  if (!a.etat) return tiret;
  const label = canonicalStatusLabel(a.etat);
  return <Badge tone={a.etat === 'Libre' ? 'success' : toneForStatus(label)}>{label}</Badge>;
};

/** Grille du catalogue : libellés et types du serveur, rendus de `colonnesArticles` pour les colonnes qu'il connaît. */
export function grilleLignesArticles(colonnes: ColonneDto[], ouvrirDossier: (id: string) => void): ColonneGrille<LigneArticleDto>[] {
  const rendus = new Map<string, ColonneGrille<unknown>>(colonnesArticles(ouvrirDossier).map((c) => [c.nom, c as ColonneGrille<unknown>]));
  rendus.set('etat', { nom: 'etat', libelle: 'État', valeur: (a) => (a as LigneArticleDto).etat, rendu: (a) => etatLigneBadge(a as LigneArticleDto) });
  rendus.set('parentOccupe', {
    nom: 'parentOccupe',
    libelle: 'Parent occupé',
    rendu: (a) => ((a as LigneArticleDto).parentOccupe ? <Badge tone="warning">Parent occupé</Badge> : tiret),
  });
  return grilleDepuisCatalogue<LigneArticleDto>(colonnes, {}, 'code').map((c) => ({
    ...c,
    ...(rendus.get(c.nom) as ColonneGrille<LigneArticleDto> | undefined),
    libelle: c.libelle,
    type: c.type,
  }));
}
