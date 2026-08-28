import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contact, Plus, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listProspects } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useTierTypes } from '../../lib/referentiels';
import { personDisplayName } from '../../lib/domain';

export default function ProspectsList() {
  const navigate = useNavigate();
  const tierTypes = useTierTypes();

  const [search, setSearch] = useState('');
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

  const { data, loading, error } = useApi(
    () => listProspects({ search: search || undefined, type: type.length > 0 ? type : undefined }, { page, size: DEFAULT_PAGE_SIZE }),
    [search, type.join(','), page],
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
        <p className="shrink-0 max-w-180 text-[12.5px] text-muted-foreground">
          Fiches contact (/api/prospects) — indépendantes des prospections, un même prospect peut être
          lié à plusieurs prospections au fil du temps.
        </p>

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

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!loading && !error && (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5">
            <div className="shrink-0 text-[12.5px] text-muted-foreground">
              {(data?.totalElements ?? 0)} prospect{(data?.totalElements ?? 0) > 1 ? 's' : ''}
            </div>
            {rows.length === 0 ? (
              <EmptyState title="Aucun résultat" message="Ajustez vos filtres pour élargir la recherche." />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
                <Table className="w-full min-w-160 table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                      <TableHead className="w-[14%]">Code</TableHead>
                      <TableHead className="w-[24%]">Nom</TableHead>
                      <TableHead className="w-[16%]">Téléphone</TableHead>
                      <TableHead className="w-[22%]">Email</TableHead>
                      <TableHead className="w-[14%]">Ville</TableHead>
                      <TableHead className="w-[10%]">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow
                        key={r.id}
                        tabIndex={0}
                        role="link"
                        aria-label={`Ouvrir la fiche de ${personDisplayName(r)}`}
                        className="cursor-pointer"
                        onClick={() => navigate(`/prospects/${r.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/prospects/${r.id}`);
                        }}
                      >
                        <TableCell className="truncate text-muted-foreground" title={r.code || undefined}>{r.code || '—'}</TableCell>
                        <TableCell className="truncate font-medium text-foreground" title={personDisplayName(r)}>{personDisplayName(r)}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={r.mobile || r.telephone || undefined}>{r.mobile || r.telephone || '—'}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={r.email || undefined}>{r.email || '—'}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={r.ville || undefined}>{r.ville || '—'}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={r.type || undefined}>{r.type || '—'}</TableCell>
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
