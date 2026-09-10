import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { getTranchesReferentiel, listArticles } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import {
  useCategoriesBien,
  useEntitesReferentiel,
  useEtages,
  useNatures,
  useTypesBienReferentiel,
  useVocations,
  referentielItems,
} from '../../lib/referentiels';
import { formatCurrency, formatPercent } from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import type { ArticleListItemDto, ArticleStatut, ReferentielItemDto } from '../../types';

type StatutFilter = ArticleStatut | 'all';

const STATUT_ITEMS: { label: string; value: StatutFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Occupé', value: 'OCCUPE' },
];

/** Le libellé d'état seul, sans la pastille — ce sur quoi la grille trie et
 * filtre. Sans lui, la colonne « État » se comparerait au `statut` brut alors
 * que l'utilisateur voit « Libre », « Occupé », ou un statut de dossier. */
function articleEtatLabel(a: Pick<ArticleListItemDto, 'statut' | 'dossierId' | 'dossierStatut'>): string {
  if (a.dossierId) return canonicalStatusLabel(a.dossierStatut) || '';
  return a.statut === 'DISPONIBLE' ? 'Libre' : 'Occupé';
}

/** Colonne « État » — montre le vrai statut du dossier lié (via
 * canonicalStatusLabel/toneForStatus, les mêmes helpers que la pastille de
 * /dossiers/:id) quand l'article est réservé ou vendu ; se rabat sur
 * « Libre »/« Occupé » pour un article sans dossier. */
function articleEtatBadge(a: Pick<ArticleListItemDto, 'statut' | 'dossierId' | 'dossierStatut'>) {
  if (a.dossierId) {
    const label = canonicalStatusLabel(a.dossierStatut);
    return <Badge tone={toneForStatus(label)}>{label}</Badge>;
  }
  if (a.statut === 'DISPONIBLE') return <Badge tone="success">Libre</Badge>;
  return <Badge tone="neutral">Occupé</Badge>;
}

const M2 = (v: unknown) => (typeof v === 'number' && v ? `${v} m²` : <span className="text-muted-foreground">—</span>);

export default function ArticlesList() {
  const navigate = useNavigate();
  const categories = useCategoriesBien();
  const types = useTypesBienReferentiel();
  const entites = useEntitesReferentiel();
  const natures = useNatures();
  const vocations = useVocations();
  const etages = useEtages();

  const [tranches, setTranches] = useState<ReferentielItemDto[]>([]);
  const [tranchesLoading, setTranchesLoading] = useState(true);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
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
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getTranchesReferentiel()
      .then((items) => { if (!cancelled) setTranches(items); })
      .finally(() => { if (!cancelled) setTranchesLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function resetFilters() {
    setPage(0);
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

  // Drives the empty state's wording and its escape hatch: "no rows because
  // your filters excluded them" (offer a reset) is a different situation from
  // "this list is genuinely empty" (nothing to undo).
  const hasActiveFilters =
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

  const { data, loading, error } = useApi(
    () =>
      listArticles(
        {
          search: debouncedSearch || undefined,
          trancheId: trancheId.length > 0 ? trancheId : undefined,
          statut: statut !== 'all' ? statut : undefined,
          categorieId: categorieId.length > 0 ? categorieId : undefined,
          typeId: typeId.length > 0 ? typeId : undefined,
          entiteId: entiteId || undefined,
          natureId: natureId || undefined,
          vocationId: vocationId || undefined,
          etageId: etageId || undefined,
          prixDe: prixDe ? Number(prixDe) : undefined,
          prixA: prixA ? Number(prixA) : undefined,
          surfaceDe: surfaceDe ? Number(surfaceDe) : undefined,
          surfaceA: surfaceA ? Number(surfaceA) : undefined,
        },
        { page, size: 20 },
      ),
    [
      debouncedSearch,
      trancheId.join(','),
      statut,
      categorieId.join(','),
      typeId.join(','),
      entiteId,
      natureId,
      vocationId,
      etageId,
      prixDe,
      prixA,
      surfaceDe,
      surfaceA,
      page,
    ],
    'articles',
  );
  const rows = data?.content ?? [];

  /* Dans le composant : la colonne « N° Dossier » a besoin de `navigate`. */
  const colonnes = useMemo<ColonneGrille<ArticleListItemDto>[]>(
    () => [
      { nom: 'etat', libelle: 'État', largeur: 7, valeur: articleEtatLabel, rendu: articleEtatBadge },
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
      { nom: 'description', libelle: 'Description', largeur: 11, classe: 'text-muted-foreground', titre: (a) => a.description || undefined },
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
      { nom: 'area', libelle: 'Superficie', type: 'NOMBRE', largeur: 6, classe: 'text-muted-foreground', rendu: (a) => M2(a.area) },
      {
        nom: 'superficieSousArticles',
        libelle: 'Superf. sous-art.',
        type: 'NOMBRE',
        largeur: 7,
        classe: 'text-muted-foreground',
        rendu: (a) => M2(a.superficieSousArticles),
      },
      {
        nom: 'tauxTVA',
        libelle: 'TVA',
        type: 'NOMBRE',
        largeur: 5,
        classe: 'text-muted-foreground',
        rendu: (a) => (a.tauxTVA != null ? formatPercent(a.tauxTVA) : <span className="text-muted-foreground">—</span>),
      },
      {
        nom: 'salePrice',
        libelle: 'Prix de vente',
        type: 'MONTANT',
        largeur: 9,
        classe: 'text-muted-foreground',
        // Le repli sur le prix plancher est conservé, et `valeur` suit le même
        // repli pour que le tri classe un article au plancher à sa vraie place.
        valeur: (a) => a.salePrice || a.salePriceFloor,
        rendu: (a) =>
          a.salePrice
            ? formatCurrency(a.salePrice)
            : a.salePriceFloor
              ? `${formatCurrency(a.salePriceFloor)} (plancher)`
              : <span className="text-muted-foreground">—</span>,
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
                navigate(`/dossiers/${a.dossierId}`);
              }}
            >
              {a.dossierCode}
            </button>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      { nom: 'clientNom', libelle: 'Client', largeur: 8, classe: 'text-muted-foreground', titre: (a) => a.clientNom || undefined },
    ],
    [navigate],
  );

  const trancheItems = tranches.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const categorieItems = referentielItems(categories.data);
  const typeItems = referentielItems(types.data);
  const entiteItems = referentielItems(entites.data);
  const natureItems = referentielItems(natures.data);
  const vocationItems = referentielItems(vocations.data);
  const etageItems = referentielItems(etages.data);

  return (
    <PageShell
      title="Articles"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Articles' }]}
      fullHeight
      icon={<Home />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <Card padded={false} className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 p-3">
            <InputGroup className="min-w-55 flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Recherche — code, description…"
                value={search}
                onChange={(e) => resetAndSet(setSearch, e.target.value)}
              />
            </InputGroup>
            <MultiSelectDropdown
              label="Tranche"
              placeholder={tranchesLoading ? 'Chargement…' : 'Toutes'}
              value={trancheId}
              onChange={(v) => resetAndSet(setTrancheId, v)}
              items={trancheItems}
            />
            <Select items={STATUT_ITEMS} value={statut} onValueChange={(v) => resetAndSet(setStatut, v as StatutFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUT_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <MultiSelectDropdown label="Catégorie" placeholder="Toutes" value={categorieId} onChange={(v) => resetAndSet(setCategorieId, v)} items={categorieItems} />
            <MultiSelectDropdown label="Type" placeholder="Tous" value={typeId} onChange={(v) => resetAndSet(setTypeId, v)} items={typeItems} />
            <Select items={entiteItems} value={entiteId} onValueChange={(v) => resetAndSet(setEntiteId, v as string | null)}>
              <SelectTrigger className="w-38">
                <SelectValue placeholder={entites.loading ? 'Chargement…' : 'Entité…'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {entiteItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select items={natureItems} value={natureId} onValueChange={(v) => resetAndSet(setNatureId, v as string | null)}>
              <SelectTrigger className="w-34">
                <SelectValue placeholder={natures.loading ? 'Chargement…' : 'Nature…'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {natureItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select items={vocationItems} value={vocationId} onValueChange={(v) => resetAndSet(setVocationId, v as string | null)}>
              <SelectTrigger className="w-38">
                <SelectValue placeholder={vocations.loading ? 'Chargement…' : 'Vocation…'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {vocationItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select items={etageItems} value={etageId} onValueChange={(v) => resetAndSet(setEtageId, v as string | null)}>
              <SelectTrigger className="w-34">
                <SelectValue placeholder={etages.loading ? 'Chargement…' : 'Étage…'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {etageItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <Input type="number" placeholder="Prix de" className="w-27.5" value={prixDe} onChange={(e) => resetAndSet(setPrixDe, e.target.value)} />
              <Input type="number" placeholder="à" className="w-22" value={prixA} onChange={(e) => resetAndSet(setPrixA, e.target.value)} />
            </div>
            <div className="flex items-center gap-1.5">
              <Input type="number" placeholder="Surface de" className="w-27.5" value={surfaceDe} onChange={(e) => resetAndSet(setSurfaceDe, e.target.value)} />
              <Input type="number" placeholder="à" className="w-22" value={surfaceA} onChange={(e) => resetAndSet(setSurfaceA, e.target.value)} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw data-icon="inline-start" /> Réinitialiser
            </Button>
          </div>
        </Card>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">
              {(data?.totalElements ?? 0)} article{(data?.totalElements ?? 0) > 1 ? 's' : ''}
            </div>
            {rows.length === 0 ? (
              <EmptyState
                title={hasActiveFilters ? 'Aucun résultat' : 'Rien à afficher'}
                message={
                  hasActiveFilters
                    ? 'Aucun article ne correspond aux filtres actifs.'
                    : "Aucun article n'est encore enregistré."
                }
                action={
                  hasActiveFilters ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => resetFilters()}>
                      <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
                <DataGrid
                  rows={rows}
                  colonnes={colonnes}
                  minWidth="112rem"
                  onOuvrir={(id) => navigate(`/articles/${id}`)}
                  libelleLigne={(a) => `Ouvrir la fiche de ${a.code}`}
                />
              </div>
            )}
            <div className="shrink-0">
              {data && (
                <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
              )}
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
