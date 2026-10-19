import { useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { Badge } from '../components/ui';
import type { ColonneGrille } from '../components/DataGrid';
import type { ArticleListFilters } from './api';
import { useDebouncedValue } from './useApi';
import { formatPercent, formatSurface, libellePrix } from './format';
import { canonicalStatusLabel, toneForStatus } from './dossierStatus';
import type { ArticleListItemDto, ArticleStatut } from '../types';

// Filtres et colonnes partagés par `/articles` et l'onglet Articles de la tranche (mêmes libellés).

export type StatutFilter = ArticleStatut | 'all';

export const STATUT_ITEMS: { label: string; value: StatutFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Occupé', value: 'OCCUPE' },
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
  }

  const nombre = (v: string) => (v ? Number(v) : undefined);
  const params: { statut?: ArticleStatut; categorieId?: string[]; typeId?: string[] } & ArticleListFilters = {
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
    valeurs: { statut, categorieId, typeId, entiteId, natureId, vocationId, etageId, prixDe, prixA, surfaceDe, surfaceA },
    modifier: {
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
export function colonnesArticles(navigate: NavigateFunction): ColonneGrille<ArticleListItemDto>[] {
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
              void navigate(`/dossiers/${a.dossierId}`);
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
