import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listDossiers, listTranches, type DossierChampDate } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { formatCurrency, formatDate } from '../../lib/format';
import { DOSSIER_STATUS_PIPELINE, DOSSIER_EXIT_STATUSES, canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';

const STATUS_ITEMS = [...DOSSIER_STATUS_PIPELINE, ...DOSSIER_EXIT_STATUSES].map((s) => ({ label: s, value: s }));

const CHAMP_DATE_ITEMS: { label: string; value: DossierChampDate }[] = [
  { label: 'Date de réservation', value: 'RESERVATION' },
  { label: 'Date de concrétisation', value: 'CONCRETISATION' },
  { label: 'Date de compromis', value: 'COMPROMIS' },
  { label: "Date d'envoi au notaire", value: 'ENVOI_NOTAIRE' },
  { label: 'Date de crédit débloqué', value: 'CREDIT_DEBLOQUE' },
  { label: 'Date de minute', value: 'MINUTE' },
  { label: 'Date de remise des clés', value: 'REMISE_DES_CLES' },
  { label: 'Date de formalisation', value: 'FORMALISATION' },
  { label: "Date d'annulation", value: 'ANNULATION' },
];

export default function DossiersList() {
  const navigate = useNavigate();
  const { commerciaux } = useAppData();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string[]>([]);
  const [trancheIds, setTrancheIds] = useState<string[]>([]);
  const [champDate, setChampDate] = useState<DossierChampDate>('RESERVATION');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [commercial, setCommercial] = useState('all');
  const [page, setPage] = useState(0);

  const { data, loading, error } = useApi(
    () =>
      listDossiers(
        {
          search: search || undefined,
          statut: status.length > 0 ? status : undefined,
          trancheId: trancheIds.length > 0 ? trancheIds : undefined,
          commercial: commercial !== 'all' ? commercial : undefined,
          champDate: dateDebut || dateFin ? champDate : undefined,
          dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
          dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
        },
        // Newest-first, so a just-created dossier lands on page 0. Sorts on
        // `docDate` — the actual JPA entity column — not `dateDocument` (the
        // response DTO's field name), which 400s: Pageable's `sort` validates
        // against the entity property, and OpenAPI doesn't document it.
        { page, size: DEFAULT_PAGE_SIZE, sort: ['docDate,desc'] },
      ),
    [search, status.join(','), trancheIds.join(','), champDate, dateDebut, dateFin, commercial, page],
  );
  const dossiers = data?.content ?? [];

  // Aggregate fetch (once, 16 tranches in the real portfolio per CLAUDE.md) —
  // populates the Tranche dropdown. Independent of the dossiers query above.
  const tranches = useApi(() => listTranches(undefined, { page: 0, size: 500 }), []);
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({
    label: t.description || t.code || t.id,
    value: t.id,
  }));

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function resetFilters() {
    setPage(0);
    setSearch('');
    setStatus([]);
    setTrancheIds([]);
    setChampDate('RESERVATION');
    setDateDebut('');
    setDateFin('');
    setCommercial('all');
  }

  const commercialItems = [
    { label: 'Tous les commerciaux', value: 'all' },
    ...commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id })),
  ];

  return (
    <PageShell title="Dossiers de vente" crumbs={[{ label: 'Ventes' }, { label: 'Dossiers' }]} fullHeight>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <Card padded={false} className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 p-3">
            <InputGroup className="min-w-[220px] flex-1">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Recherche multi-critère — client, code de dossier…"
                value={search}
                onChange={(e) => resetAndSet(setSearch, e.target.value)}
              />
            </InputGroup>
            <MultiSelectDropdown
              label="Statut"
              placeholder="Tous les statuts"
              value={status}
              onChange={(v) => resetAndSet(setStatus, v)}
              items={STATUS_ITEMS}
            />
            <MultiSelectDropdown
              label="Tranche"
              placeholder="Toutes"
              value={trancheIds}
              onChange={(v) => resetAndSet(setTrancheIds, v)}
              items={trancheItems}
            />
            <div className="flex items-center gap-1.5">
              <Select
                items={CHAMP_DATE_ITEMS}
                value={champDate}
                onValueChange={(v) => resetAndSet(setChampDate, v as DossierChampDate)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {CHAMP_DATE_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <InputGroup className="w-[130px]">
                <InputGroupInput
                  type="date"
                  aria-label="Du"
                  value={dateDebut}
                  onChange={(e) => resetAndSet(setDateDebut, e.target.value)}
                />
              </InputGroup>
              <InputGroup className="w-[130px]">
                <InputGroupInput
                  type="date"
                  aria-label="Au"
                  value={dateFin}
                  onChange={(e) => resetAndSet(setDateFin, e.target.value)}
                />
              </InputGroup>
            </div>
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
              {(data?.totalElements ?? 0)} dossier{(data?.totalElements ?? 0) > 1 ? 's' : ''}
            </div>
            {dossiers.length === 0 ? (
              <EmptyState title="Aucun résultat" message="Ajustez vos filtres pour élargir la recherche." />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
                <Table className="w-full min-w-[640px] table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                      <TableHead className="w-[20%]">Client</TableHead>
                      <TableHead className="w-[14%]">Code</TableHead>
                      <TableHead className="w-[16%]">Statut</TableHead>
                      <TableHead className="w-[16%]">Commercial</TableHead>
                      <TableHead className="w-[12%] text-right">Prix</TableHead>
                      <TableHead className="w-[12%] text-right">Total à payer</TableHead>
                      <TableHead className="w-[10%]">Date</TableHead>
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
                        <TableCell className="truncate font-medium text-foreground" title={d.clientNom ?? undefined}>{d.clientNom ?? '—'}</TableCell>
                        <TableCell className="truncate text-muted-foreground" title={d.code}>{d.code}</TableCell>
                        <TableCell className="truncate"><Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge></TableCell>
                        <TableCell className="truncate text-muted-foreground" title={d.commercialNom ?? undefined}>{d.commercialNom ?? '—'}</TableCell>
                        <TableCell className="truncate text-right tabular-nums">{formatCurrency(d.prix)}</TableCell>
                        <TableCell className="truncate text-right tabular-nums">{formatCurrency(d.totalAPayer)}</TableCell>
                        <TableCell className="truncate text-muted-foreground">{formatDate(d.dateDocument)}</TableCell>
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
