import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import Pagination from '../../components/Pagination';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listTranches } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatDate } from '../../lib/format';

export default function TranchesList() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const { data, error } = useApi(() => listTranches(undefined, { page, size: DEFAULT_PAGE_SIZE }), [page]);
  const navigate = useNavigate();

  const q = search.trim().toLowerCase();
  const tranches = (data?.content ?? []).filter(
    (t) => !q || `${t.description ?? ''} ${t.code ?? ''} ${t.ville ?? ''} ${t.projetCode ?? ''}`.toLowerCase().includes(q),
  );

  if (error) return <PageShell title="Tranches"><ErrorState message={error} /></PageShell>;
  if (!data) return <PageShell title="Tranches"><LoadingState /></PageShell>;

  return (
    <PageShell
      title="Tranches"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Tranches' }]}
      icon={<Building2 />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={<ActionAdmin to="/tranches/nouveau" libelle="Nouvelle tranche" />}
      fullHeight
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 pt-1">
        <div className="flex shrink-0 items-center gap-3">
          <InputGroup className="max-w-md">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher un programme, une ville, un code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          {search && <span className="text-micro text-muted-foreground">Recherche sur la page chargée.</span>}
        </div>

        {tranches.length === 0 ? (
          <EmptyState title="Aucun résultat" />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent [&>*:first-child]:pl-3 [&>*:last-child]:pr-3">
                  <TableHead className="text-muted-foreground">Description</TableHead>
                  <TableHead className="text-muted-foreground">Code</TableHead>
                  <TableHead className="text-muted-foreground">Programme</TableHead>
                  <TableHead className="text-muted-foreground">Ville</TableHead>
                  <TableHead className="text-muted-foreground">Octroi des T.F</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tranches.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer hover:bg-(--surface-hover) [&>*:first-child]:pl-3 [&>*:last-child]:pr-3"
                    onClick={() => navigate(`/tranches/${t.id}`)}
                  >
                    <TableCell className="max-w-[360px] truncate font-medium text-foreground" title={t.description ?? undefined}>
                      {t.description || '—'}
                    </TableCell>
                    <TableCell className="font-mono text-micro text-muted-foreground">{t.code || '—'}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">{t.projetCode || '—'}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{t.ville || '—'}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{formatDate(t.dateOctroiTitresFonciers)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
      </div>
    </PageShell>
  );
}
