import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contact, Plus, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Card, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import { DEFAULT_PAGE_SIZE, listProspects } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useTierTypes } from '../../lib/referentiels';
import { personDisplayName } from '../../lib/domain';
import type { ProspectListItemDto } from '../../types';

/* Les `largeur` reprennent les pourcentages en dur d'avant la migration vers
   DataGrid — elles sont normalisées, donc les colonnes gardent exactement les
   mêmes proportions qu'avant. */
const COLONNES: ColonneGrille<ProspectListItemDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 14, classe: 'text-muted-foreground', titre: (r) => r.code || undefined },
  {
    nom: 'nom',
    libelle: 'Nom',
    largeur: 24,
    classe: 'font-medium text-foreground',
    valeur: (r) => personDisplayName(r),
    rendu: (r) => personDisplayName(r),
    titre: (r) => personDisplayName(r),
  },
  {
    nom: 'telephone',
    libelle: 'Téléphone',
    largeur: 16,
    classe: 'tabular-nums text-muted-foreground',
    // Même repli qu'avant : le mobile prime, le fixe sert de secours.
    valeur: (r) => r.mobile || r.telephone,
    titre: (r) => r.mobile || r.telephone || undefined,
  },
  { nom: 'email', libelle: 'Email', largeur: 22, classe: 'text-muted-foreground', titre: (r) => r.email || undefined },
  { nom: 'ville', libelle: 'Ville', largeur: 14, classe: 'text-muted-foreground', titre: (r) => r.ville || undefined },
  { nom: 'type', libelle: 'Type', largeur: 10, classe: 'text-muted-foreground', titre: (r) => r.type || undefined },
];

export default function ProspectsList() {
  const navigate = useNavigate();
  const tierTypes = useTierTypes();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [type, setType] = useState<string[]>([]);
  const [page, setPage] = useState(0);

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
    () => listProspects({ search: debouncedSearch || undefined, type: type.length > 0 ? type : undefined }, { page, size: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, type.join(','), page],
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
            <div className="shrink-0 text-body text-muted-foreground">
              {(data?.totalElements ?? 0)} prospect{(data?.totalElements ?? 0) > 1 ? 's' : ''}
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
              <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  rows={rows}
                  colonnes={COLONNES}
                  minWidth="40rem"
                  onOuvrir={(id) => navigate(`/prospects/${id}`)}
                  libelleLigne={(r) => `Ouvrir la fiche de ${personDisplayName(r)}`}
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
