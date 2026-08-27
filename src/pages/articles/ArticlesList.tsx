import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RotateCcw } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import SearchableSelect from '../../components/SearchableSelect';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { getTranchesReferentiel, listTrancheArticles } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useCategoriesBien, useTypesBienReferentiel, referentielItems } from '../../lib/referentiels';
import { formatCurrency } from '../../lib/format';
import type { ArticleStatut, ReferentielItemDto } from '../../types';

type StatutFilter = ArticleStatut | 'all';

const STATUT_ITEMS: { label: string; value: StatutFilter }[] = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Disponible', value: 'DISPONIBLE' },
  { label: 'Occupé', value: 'OCCUPE' },
];

// GET /api/tranches/{id}/articles is the only real endpoint for browsing
// articles today (see instructions/from_front.md request #1 in the backend
// repo for a flat GET /api/articles) — a Tranche must be picked first,
// matching the actual legacy qualification cascade (Tranche → Catégorie →
// Type → Article) this domain is built around, not an arbitrary UI choice.
export default function ArticlesList() {
  const navigate = useNavigate();
  const categories = useCategoriesBien();
  const types = useTypesBienReferentiel();

  const [tranches, setTranches] = useState<ReferentielItemDto[]>([]);
  const [tranchesLoading, setTranchesLoading] = useState(true);
  const [trancheId, setTrancheId] = useState<string | null>(null);
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
    setStatut('all');
    setCategorieId([]);
    setTypeId([]);
  }

  const { data, loading, error } = useApi(
    () =>
      trancheId
        ? listTrancheArticles(
            trancheId,
            {
              statut: statut !== 'all' ? statut : undefined,
              categorieId: categorieId.length > 0 ? categorieId : undefined,
              typeId: typeId.length > 0 ? typeId : undefined,
            },
            { page, size: 20 },
          )
        : Promise.resolve(null),
    [trancheId, statut, categorieId.join(','), typeId.join(','), page],
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
          Lots d'une tranche (/api/tranches/&#123;id&#125;/articles) — choisissez une tranche pour parcourir ses
          articles et sous-articles (places de parking, caves…).
        </p>

        <Card padded={false} className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 p-3">
            <SearchableSelect
              className="min-w-55 flex-1"
              items={trancheItems}
              value={trancheId}
              onValueChange={(v) => resetAndSet(setTrancheId, v)}
              placeholder={tranchesLoading ? 'Chargement…' : 'Choisir une tranche…'}
              disabled={tranchesLoading}
              emptyMessage="Aucune tranche."
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

        {!trancheId ? (
          <EmptyState title="Choisissez une tranche" message="Sélectionnez une tranche ci-dessus pour voir la liste de ses articles." />
        ) : (
          <>
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
                    <Table className="w-full min-w-190 table-fixed">
                      <TableHeader>
                        <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                          <TableHead className="w-[16%]">Code</TableHead>
                          <TableHead className="w-[24%]">Description</TableHead>
                          <TableHead className="w-[15%]">Catégorie</TableHead>
                          <TableHead className="w-[17%]">Type</TableHead>
                          <TableHead className="w-[10%] text-right">Superficie</TableHead>
                          <TableHead className="w-[13%] text-right">Prix de vente</TableHead>
                          <TableHead className="w-[11%]">Statut</TableHead>
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
                            <TableCell className="truncate font-medium text-foreground" title={a.code || undefined}>
                              {a.code || '—'}
                              {a.sousArticle && <Badge tone="neutral" className="ml-1.5 align-middle">Sous-article</Badge>}
                            </TableCell>
                            <TableCell className="truncate text-muted-foreground" title={a.description || undefined}>{a.description || '—'}</TableCell>
                            <TableCell className="truncate text-muted-foreground" title={a.categorieLibelle || undefined}>{a.categorieLibelle || '—'}</TableCell>
                            <TableCell className="truncate text-muted-foreground" title={a.typeLibelle || undefined}>{a.typeLibelle || '—'}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{a.area ? `${a.area} m²` : '—'}</TableCell>
                            <TableCell className="text-right tabular-nums text-muted-foreground">{a.salePrice ? formatCurrency(a.salePrice) : '—'}</TableCell>
                            <TableCell>
                              <Badge tone={a.statut === 'DISPONIBLE' ? 'success' : 'neutral'}>{a.statut === 'DISPONIBLE' ? 'Disponible' : 'Occupé'}</Badge>
                            </TableCell>
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
          </>
        )}
      </div>
    </PageShell>
  );
}
