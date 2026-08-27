import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { getTranchesReferentiel, listArticles } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useCategoriesBien, useTypesBienReferentiel, referentielItems } from '../../lib/referentiels';
import { formatCurrency } from '../../lib/format';
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

  const [tranches, setTranches] = useState<ReferentielItemDto[]>([]);
  const [tranchesLoading, setTranchesLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [trancheId, setTrancheId] = useState<string[]>([]);
  const [statut, setStatut] = useState<StatutFilter>('all');
  const [categorieId, setCategorieId] = useState<string[]>([]);
  const [typeId, setTypeId] = useState<string[]>([]);
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
  }

  const { data, loading, error } = useApi(
    () =>
      listArticles(
        {
          search: search || undefined,
          trancheId: trancheId.length > 0 ? trancheId : undefined,
          statut: statut !== 'all' ? statut : undefined,
          categorieId: categorieId.length > 0 ? categorieId : undefined,
          typeId: typeId.length > 0 ? typeId : undefined,
        },
        { page, size: 20 },
      ),
    [search, trancheId.join(','), statut, categorieId.join(','), typeId.join(','), page],
  );
  const rows = data?.content ?? [];

  const trancheItems = tranches.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const categorieItems = referentielItems(categories.data);
  const typeItems = referentielItems(types.data);

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
        <p className="shrink-0 max-w-180 text-[12.5px] text-muted-foreground">
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
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw data-icon="inline-start" /> Réinitialiser
            </Button>
          </div>
        </Card>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!loading && !error && (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5">
            <div className="shrink-0 text-[12.5px] text-muted-foreground">
              {(data?.totalElements ?? 0)} article{(data?.totalElements ?? 0) > 1 ? 's' : ''}
            </div>
            {rows.length === 0 ? (
              <EmptyState title="Aucun résultat" message="Ajustez vos filtres pour élargir la recherche." />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
                <Table className="w-full min-w-240 table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                      <TableHead className="w-[10%]">État</TableHead>
                      <TableHead className="w-[10%]">Code</TableHead>
                      <TableHead className="w-[16%]">Description</TableHead>
                      <TableHead className="w-[12%]">Catégorie</TableHead>
                      <TableHead className="w-[13%]">Type</TableHead>
                      <TableHead className="w-[8%] text-right">Superficie</TableHead>
                      <TableHead className="w-[11%] text-right">Prix de vente</TableHead>
                      <TableHead className="w-[9%]">N° Dossier</TableHead>
                      <TableHead className="w-[11%]">Client</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((a) => (
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
                        <TableCell className="text-right tabular-nums text-muted-foreground">{a.area ? `${a.area} m²` : '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{a.salePrice ? formatCurrency(a.salePrice) : '—'}</TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="shrink-0">
              {data && (
                <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
