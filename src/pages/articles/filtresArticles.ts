import { useState } from 'react';
import { useDebouncedValue } from '../../lib/useApi';
import type { ArticleStatut } from '../../types';

export type StatutFilter = ArticleStatut | 'all';

/** État des filtres de la liste d'articles, partagé par `/articles` et l'onglet Articles de la tranche. */
export function useFiltresArticles(onChange: () => void) {
  const [search, setSearch] = useState('');
  const [trancheId, setTrancheId] = useState<string[]>([]);
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

  const debouncedSearch = useDebouncedValue(search);
  const debouncedPrixDe = useDebouncedValue(prixDe);
  const debouncedPrixA = useDebouncedValue(prixA);
  const debouncedSurfaceDe = useDebouncedValue(surfaceDe);
  const debouncedSurfaceA = useDebouncedValue(surfaceA);

  /** Tout changement de filtre ramène à la première page. */
  function poser<T>(setter: (v: T) => void) {
    return (v: T) => {
      onChange();
      setter(v);
    };
  }

  function reinitialiser() {
    onChange();
    setSearch('');
    setTrancheId([]);
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

  const actifs =
    !!search ||
    trancheId.length > 0 ||
    statut !== 'all' ||
    categorieId.length > 0 ||
    typeId.length > 0 ||
    !!entiteId ||
    !!natureId ||
    !!vocationId ||
    !!etageId ||
    !!prixDe ||
    !!prixA ||
    !!surfaceDe ||
    !!surfaceA;

  const nombre = (v: string) => (v ? Number(v) : undefined);
  const liste = (v: string[]) => (v.length > 0 ? v : undefined);

  /** Paramètres de `listArticles` ; `trancheFixe` remplace le filtre Tranche (onglet de la fiche tranche). */
  function parametres(trancheFixe?: string) {
    return {
      search: debouncedSearch || undefined,
      trancheId: trancheFixe ? [trancheFixe] : liste(trancheId),
      statut: statut === 'all' ? undefined : statut,
      categorieId: liste(categorieId),
      typeId: liste(typeId),
      entiteId: entiteId || undefined,
      natureId: natureId || undefined,
      vocationId: vocationId || undefined,
      etageId: etageId || undefined,
      prixDe: nombre(debouncedPrixDe),
      prixA: nombre(debouncedPrixA),
      surfaceDe: nombre(debouncedSurfaceDe),
      surfaceA: nombre(debouncedSurfaceA),
    };
  }

  return {
    valeurs: { search, trancheId, statut, categorieId, typeId, entiteId, natureId, vocationId, etageId, prixDe, prixA, surfaceDe, surfaceA },
    setSearch: poser(setSearch),
    setTrancheId: poser(setTrancheId),
    setStatut: poser(setStatut),
    setCategorieId: poser(setCategorieId),
    setTypeId: poser(setTypeId),
    setEntiteId: poser(setEntiteId),
    setNatureId: poser(setNatureId),
    setVocationId: poser(setVocationId),
    setEtageId: poser(setEtageId),
    setPrixDe: poser(setPrixDe),
    setPrixA: poser(setPrixA),
    setSurfaceDe: poser(setSurfaceDe),
    setSurfaceA: poser(setSurfaceA),
    reinitialiser,
    actifs,
    parametres,
  };
}

export type FiltresArticles = ReturnType<typeof useFiltresArticles>;
