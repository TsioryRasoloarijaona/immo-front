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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
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

/** "État" column — shows the linked Dossier's real status (via
 * canonicalStatusLabel/toneForStatus, same helpers driving /dossiers/:id's
 * badge) when the article is reserved/sold; falls back to "Libre"/"Occupé"
 * for articles with no dossier yet. */
function articleEtatBadge(a: Pick<ArticleListItemDto, 'statut' | 'dossierId' | 'dossierStatut'>) {
  if (a.dossierId) {
    const label = canonicalStatusLabel(a.dossierStatut);
    return <Badge tone={toneForStatus(label)}>{label}</Badge>;
  }
  if (a.statut === 'DISPONIBLE') return <Badge tone="success">Libre</Badge>;
  return <Badge tone="neutral">Occupé</Badge>;
}

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
  );
  const rows = data?.content ?? [];

  // Seule liste volumineuse de cette barre de filtres ; les six référentiels
  // courts qui suivent restent volontairement non mémoïsés.
  const trancheItems = useMemo(
    () => tranches.map((t) => ({ label: t.description || t.code || t.id, value: t.id })),
    [tranches],
  );
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
        <p className="shrink-0 max-w-180 text-body text-muted-foreground">
          Catalogue transverse des articles (/api/articles) — tous lots et sous-lots, toutes tranches
          confondues (entités actives uniquement).
        </p>

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
                <Table className="w-full min-w-320 table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                      <TableHead className="w-[7%]">État</TableHead>
                      <TableHead className="w-[8%]">Code</TableHead>
                      <TableHead className="w-[11%]">Description</TableHead>
                      <TableHead className="w-[8%]">Catégorie</TableHead>
                      <TableHead className="w-[9%]">Type</TableHead>
                      <TableHead className="w-[5%]">Présent.</TableHead>
                      <TableHead className="w-[6%]">Nature</TableHead>
                      <TableHead className="w-[5%]">Étage</TableHead>
                      <TableHead className="w-[6%] text-right">Superficie</TableHead>
                      <TableHead className="w-[7%] text-right">Superf. sous-art.</TableHead>
                      <TableHead className="w-[5%] text-right">TVA</TableHead>
                      <TableHead className="w-[9%] text-right">Prix de vente</TableHead>
                      <TableHead className="w-[6%]">N° Dossier</TableHead>
                      <TableHead className="w-[8%]">Client</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((a) => {
                      const prix = a.salePrice ? formatCurrency(a.salePrice) : a.salePriceFloor ? `${formatCurrency(a.salePriceFloor)} (plancher)` : '—';
                      return (
                        <TableRow
                          key={a.id}
                          tabIndex={0}
                          role="link"
                          aria-label={`Ouvrir la fiche de ${a.code}`}
                          className="cursor-pointer"
                          onClick={() => navigate(`/articles/${a.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') navigate(`/articles/${a.id}`);
                          }}
                        >
                          <TableCell>{articleEtatBadge(a)}</TableCell>
                          <TableCell className="truncate font-medium text-foreground" title={a.code || undefined}>
                            {a.code || '—'}
                            {a.sousArticle && <Badge tone="neutral" className="ml-1.5 align-middle">Sous-article</Badge>}
                          </TableCell>
                          <TableCell className="truncate text-muted-foreground" title={a.description || undefined}>{a.description || '—'}</TableCell>
                          <TableCell className="truncate text-muted-foreground" title={a.categorieLibelle || undefined}>{a.categorieLibelle || '—'}</TableCell>
                          <TableCell className="truncate text-muted-foreground" title={a.typeLibelle || undefined}>{a.typeLibelle || '—'}</TableCell>
                          <TableCell className="truncate text-muted-foreground" title={a.presentationTypeLibelle || undefined}>{a.presentationTypeCode || '—'}</TableCell>
                          <TableCell className="truncate text-muted-foreground" title={a.natureLibelle || undefined}>{a.natureCode || a.natureLibelle || '—'}</TableCell>
                          <TableCell className="truncate text-muted-foreground" title={a.etageLibelle || undefined}>{a.etageCode || a.etageLibelle || '—'}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{a.area ? `${a.area} m²` : '—'}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{a.superficieSousArticles ? `${a.superficieSousArticles} m²` : '—'}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{a.tauxTVA != null ? formatPercent(a.tauxTVA) : '—'}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{prix}</TableCell>
                          <TableCell
                            className="truncate text-muted-foreground"
                            title={a.dossierCode || undefined}
                            onClick={(e) => {
                              if (!a.dossierId) return;
                              e.stopPropagation();
                              navigate(`/dossiers/${a.dossierId}`);
                            }}
                          >
                            {a.dossierCode ? <span className="hover:text-foreground hover:underline">{a.dossierCode}</span> : '—'}
                          </TableCell>
                          <TableCell className="truncate text-muted-foreground" title={a.clientNom || undefined}>{a.clientNom || '—'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
