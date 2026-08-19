import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listDossiers } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { formatCurrency, formatDate } from '../../lib/format';
import { DOSSIER_STATUS_PIPELINE, DOSSIER_EXIT_STATUSES, canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';

export default function DossiersList() {
  const navigate = useNavigate();
  const { commerciaux } = useAppData();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [commercial, setCommercial] = useState('all');
  const [page, setPage] = useState(0);

  const { data, loading, error } = useApi(
    () =>
      listDossiers(
        {
          search: search || undefined,
          statut: status !== 'all' ? status : undefined,
          commercial: commercial !== 'all' ? commercial : undefined,
        },
        // Newest-first, so a just-created dossier lands on page 0. Sorts on
        // `docDate` — the actual JPA entity column — not `dateDocument` (the
        // response DTO's field name), which 400s: Pageable's `sort` validates
        // against the entity property, and OpenAPI doesn't document it.
        { page, size: DEFAULT_PAGE_SIZE, sort: ['docDate,desc'] },
      ),
    [search, status, commercial, page],
  );
  const dossiers = data?.content ?? [];

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  const statusItems = [
    { label: 'Tous les statuts', value: 'all' },
    ...DOSSIER_STATUS_PIPELINE.map((s) => ({ label: s, value: s })),
    ...DOSSIER_EXIT_STATUSES.map((s) => ({ label: s, value: s })),
  ];
  const commercialItems = [
    { label: 'Tous les commerciaux', value: 'all' },
    ...commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id })),
  ];

  return (
    <PageShell title="Dossiers de vente" crumbs={[{ label: 'Ventes' }, { label: 'Dossiers' }]}>
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <InputGroup className="min-w-[220px] flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un client, code de dossier…"
            value={search}
            onChange={(e) => resetAndSet(setSearch, e.target.value)}
          />
        </InputGroup>
        <Select items={statusItems} value={status} onValueChange={(v) => resetAndSet(setStatus, v as string)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {statusItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select items={commercialItems} value={commercial} onValueChange={(v) => resetAndSet(setCommercial, v as string)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {commercialItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && (
        <>
          <div className="mb-2.5 text-[12.5px] text-muted-foreground">
            {(data?.totalElements ?? 0)} dossier{(data?.totalElements ?? 0) > 1 ? 's' : ''}
          </div>
          {dossiers.length === 0 ? (
            <EmptyState title="Aucun résultat" message="Ajustez vos filtres pour élargir la recherche." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Client</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Commercial</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead className="text-right">Total à payer</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiers.map((d) => (
                    <TableRow
                      key={d.id}
                      tabIndex={0}
                      role="link"
                      aria-label={`Ouvrir le dossier ${d.clientNom ?? d.code}`}
                      className="cursor-pointer"
                      onClick={() => navigate(`/dossiers/${d.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') navigate(`/dossiers/${d.id}`);
                      }}
                    >
                      <TableCell className="font-medium text-foreground">{d.clientNom ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{d.code}</TableCell>
                      <TableCell><Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{d.commercialNom ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(d.prix)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(d.totalAPayer)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(d.dateDocument)}</TableCell>
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
