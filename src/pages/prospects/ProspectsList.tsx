import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contact, Plus, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Card, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import ProspectTable from '../../components/ProspectTable';
import { DEFAULT_PAGE_SIZE, listProspects } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_PROSPECTS } from '../../lib/dispositions';
import { useColonnesProspects, useTierTypes } from '../../lib/referentiels';

export default function ProspectsList() {
  const navigate = useNavigate();
  const tierTypes = useTierTypes();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [type, setType] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const catalogue = useColonnesProspects();
  const colonnes = useColonnesVisibles('prospects', catalogue.data, DISPOSITION_PROSPECTS);
  // `undefined` tant que la sélection ne s'écarte pas des défauts — le hook
  // porte cette règle et la raison qui la rend portante.
  const colonnesDemandees = colonnes.demandees;

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function resetFilters() {
    setPage(0);
    setSearch('');
    setType([]);
  }

  // Drives the empty state's wording and its escape hatch — see ArticlesList.
  const hasActiveFilters =
    !!search || type.length > 0;

  const { data, loading, error } = useApi(
    () =>
      listProspects(
        { search: debouncedSearch || undefined, type: type.length > 0 ? type : undefined },
        { page, size: DEFAULT_PAGE_SIZE },
        { colonnes: colonnesDemandees },
      ),
    [debouncedSearch, type.join(','), page, colonnesDemandees?.join(',') ?? ''],
    'prospects',
  );
  const rows = data?.content ?? [];

  // `type` on ProspectListItemDto stores the tier-type *code* (e.g. "PRO"),
  // not its `description` ("PROSPECT") — confirmed live against
  // /api/referentiels/tier-types, whose `code` values are exactly what
  // shows up in the table's Type column. Filter must match on `code`.
  const typeItems = tierTypes.data.map((t) => ({ label: t.description || t.code || t.id, value: t.code || t.id }));

  return (
    <PageShell
      title="Prospects"
      crumbs={[{ label: 'Ventes' }, { label: 'Prospects' }]}
      fullHeight
      icon={<Contact />}
      accent="var(--sec-prospect)"
      accentBg="var(--sec-prospect-bg)"
      actions={
        <Button type="button" size="sm" onClick={() => navigate('/prospects/nouveau')}>
          <Plus data-icon="inline-start" /> Nouveau prospect
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <Card padded={false} className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 p-3">
            <InputGroup className="min-w-55 flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Recherche multi-critère — nom, téléphone, email…"
                value={search}
                onChange={(e) => resetAndSet(setSearch, e.target.value)}
              />
            </InputGroup>
            <MultiSelectDropdown label="Type" placeholder="Tous" value={type} onChange={(v) => resetAndSet(setType, v)} items={typeItems} />
            <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
              <RotateCcw data-icon="inline-start" /> Réinitialiser
            </Button>
          </div>
        </Card>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">
                {(data?.totalElements ?? 0)} prospect{(data?.totalElements ?? 0) > 1 ? 's' : ''}
              </div>
              {colonnes.catalogueServi.length > 0 && (
                <ColumnSelector
                  catalogue={colonnes.catalogueServi}
                  visibles={colonnes.visibles}
                  onBasculer={colonnes.basculer}
                  onReinitialiser={colonnes.reinitialiser}
                  estDefaut={colonnes.estDefaut}
                />
              )}
            </div>
            {rows.length === 0 ? (
              <EmptyState
                title={hasActiveFilters ? 'Aucun résultat' : 'Rien à afficher'}
                message={
                  hasActiveFilters
                    ? 'Aucun prospect ne correspond aux filtres actifs.'
                    : "Aucun prospect n'est encore enregistré."
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
              /* `min-w-0` : voir ProspectionsList — sans lui la largeur de la
                 table remonte la chaîne flex et élargit la page entière au lieu
                 de faire défiler. Le nombre de colonnes n'est plus fixe, et
                 `minWidth` en dur a cédé au défaut de DataGrid, qui le suit. */
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                {/* Le catalogue porte les libellés d'en-tête : sans lui il n'y
                    a pas de tableau à dessiner, seulement des lignes sans
                    colonnes. */}
                {colonnes.colonnes.length > 0 ? (
                  <ProspectTable
                    rows={rows}
                    colonnes={colonnes.colonnes}
                    cleOrdre="prospects"
                    onOuvrir={(id) => navigate(`/prospects/${id}`)}
                  />
                ) : catalogue.error ? (
                  <ErrorState message={`Colonnes indisponibles — ${catalogue.error}`} />
                ) : (
                  <LoadingState />
                )}
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
