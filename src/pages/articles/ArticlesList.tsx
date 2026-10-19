import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import BarreFiltresArticles from '../../components/patrimoine/BarreFiltresArticles';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import DataGrid from '../../components/DataGrid';
import { listArticles } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useTranchesReferentiel } from '../../lib/referentiels';
import { formatNumber } from '../../lib/format';
import { colonnesArticles, useFiltresArticles } from '../../lib/articlesListe';

export default function ArticlesList() {
  const navigate = useNavigate();
  const tranches = useTranchesReferentiel();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [trancheId, setTrancheId] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const filtres = useFiltresArticles(() => setPage(0));

  function resetFilters() {
    setPage(0);
    setSearch('');
    setTrancheId([]);
    filtres.reinitialiser();
  }

  const hasActiveFilters = !!search || trancheId.length > 0 || filtres.actifs;

  const { data, loading, error } = useApi(
    () =>
      listArticles(
        {
          search: debouncedSearch || undefined,
          trancheId: trancheId.length > 0 ? trancheId : undefined,
          ...filtres.params,
        },
        { page, size: 20 },
      ),
    [debouncedSearch, trancheId.join(','), filtres.cle, page],
    'articles',
  );
  const rows = data?.content ?? [];
  const colonnes = useMemo(() => colonnesArticles(navigate), [navigate]);
  const trancheItems = tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));

  return (
    <PageShell
      title="Articles"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Articles' }]}
      fullHeight
      icon={<Home />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={<ActionAdmin to="/articles/nouveau" libelle="Nouvel article" />}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <BarreFiltresArticles
          filtres={filtres}
          onReinitialiser={resetFilters}
          avant={
            <>
              <InputGroup className="min-w-55 flex-1">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Recherche — code, description…"
                  value={search}
                  onChange={(e) => {
                    setPage(0);
                    setSearch(e.target.value);
                  }}
                />
              </InputGroup>
              <MultiSelectDropdown
                label="Tranche"
                placeholder={tranches.loading ? 'Chargement…' : 'Toutes'}
                value={trancheId}
                onChange={(v) => {
                  setPage(0);
                  setTrancheId(v);
                }}
                items={trancheItems}
              />
            </>
          }
        />

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">
              {formatNumber(data.totalElements)} article{data.totalElements > 1 ? 's' : ''}
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
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  cleOrdre="articles"
                  rows={rows}
                  colonnes={colonnes}
                  onOuvrir={(id) => navigate(`/articles/${id}`)}
                  libelleLigne={(a) => `Ouvrir la fiche de ${a.code}`}
                />
              </div>
            )}
            <div className="shrink-0">
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
