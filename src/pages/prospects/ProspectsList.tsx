import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listProspects } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { personDisplayName } from '../../lib/domain';

export default function ProspectsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const { data, loading, error } = useApi(
    () => listProspects({ search: search || undefined }, { page, size: DEFAULT_PAGE_SIZE }),
    [search, page],
  );
  const rows = data?.content ?? [];

  return (
    <PageShell title="Prospects" crumbs={[{ label: 'Ventes' }, { label: 'Prospects' }]}>
      <p className="mb-3 max-w-[680px] text-[12.5px] text-muted-foreground">
        Fiches contact (/api/prospects) — indépendantes des prospections, un même prospect peut être
        lié à plusieurs prospections au fil du temps.
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <InputGroup className="min-w-[220px] flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un nom, téléphone, email…"
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
          />
        </InputGroup>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <div className="mb-2.5 text-[12.5px] text-muted-foreground">
            {(data?.totalElements ?? 0)} prospect{(data?.totalElements ?? 0) > 1 ? 's' : ''}
          </div>
          {rows.length === 0 ? (
            <EmptyState title="Aucun résultat" message="Ajustez votre recherche." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Type</TableHead>
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
                      <TableCell className="text-muted-foreground">{r.code || '—'}</TableCell>
                      <TableCell className="font-medium text-foreground">{personDisplayName(r)}</TableCell>
                      <TableCell className="text-muted-foreground">{r.mobile || r.telephone || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{r.email || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{r.ville || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{r.type || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {data && (
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          )}
        </>
      )}
    </PageShell>
  );
}
