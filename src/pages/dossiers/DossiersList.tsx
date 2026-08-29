import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, Folder, RotateCcw, Search, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  DEFAULT_PAGE_SIZE,
  DOSSIER_BATCH_DOC_LABELS,
  downloadDossiersDocumentsEnLot,
  listDossiers,
  listTranches,
  viewDossiersDocumentsEnLot,
  type DossierBatchDocKind,
  type DossierChampDate,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { formatCurrency, formatDate } from '../../lib/format';
import { DOSSIER_STATUS_PIPELINE, DOSSIER_EXIT_STATUSES, canonicalStatusLabel, normalizeStatus, toneForStatus } from '../../lib/dossierStatus';
import type { DossierListItemDto, PageDto } from '../../types';

const BATCH_DOC_ITEMS = (Object.entries(DOSSIER_BATCH_DOC_LABELS) as [DossierBatchDocKind, string][]).map(([value, label]) => ({ label, value }));

const STATUS_ITEMS = [...DOSSIER_STATUS_PIPELINE, ...DOSSIER_EXIT_STATUSES].map((s) => ({ label: s, value: s }));

/** `GET /api/dossiers`'s `statut` query param matches the raw `StrStatus.Code`
 * stored in the DB (confirmed real example: "CONCRETISATION", see
 * instructions/from_front.md #5 — backend repo), not the accented Title
 * Case label this checklist shows ("Concrétisation", from
 * `DOSSIER_STATUS_PIPELINE`). Sending the display label straight through
 * as the filter value silently returns 0 rows for most statuses instead of
 * an error — exactly the "a lot of empty results" symptom. Until the
 * backend accepts/normalizes the display label (or exposes the exact raw
 * codes), work around it client-side: fetch a large batch with every other
 * filter still applied server-side but `statut` omitted, then match/paginate
 * the statut filter here via `normalizeStatus` — the same accent/casing-
 * insensitive comparison `canonicalStatusLabel` already uses for display,
 * so it recognizes any raw variant regardless of the backend's actual
 * casing. `size: 500` mirrors the tranches fetch below and the real
 * dataset's ~374 dossiers (per instructions/filtres-avances.md) — revisit
 * if the portfolio grows past that. */
async function fetchDossiersWithStatusWorkaround(
  baseParams: {
    search?: string;
    trancheId?: string[];
    commercial?: string;
    champDate?: DossierChampDate;
    dateDebut?: string;
    dateFin?: string;
  },
  statuses: string[],
  page: number,
  size: number,
): Promise<PageDto<DossierListItemDto>> {
  if (statuses.length === 0) {
    return listDossiers(baseParams, { page, size, sort: ['docDate,desc'] });
  }
  const wanted = new Set(statuses.map((s) => normalizeStatus(s)));
  const all = await listDossiers(baseParams, { page: 0, size: 500, sort: ['docDate,desc'] });
  const filtered = all.content.filter((d) => wanted.has(normalizeStatus(d.statut)));
  const start = page * size;
  return {
    content: filtered.slice(start, start + size),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / size)),
  };
}

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

  // Batch document generation (POST /api/dossiers/documents/{kind}) — the
  // selection lives independently of `search`/`status`/etc. below and of
  // `page`, so switching filters or pages to pick more dossiers never wipes
  // it out. `selectedLabels` keeps a friendly code/nom per id around even
  // after the row scrolls off the current filtered/paginated page, so the
  // "selected" chips still read as something meaningful.
  const [batchDocKind, setBatchDocKind] = useState<DossierBatchDocKind | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});
  const [batchBusy, setBatchBusy] = useState<'view' | 'download' | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);

  const { data, loading, error } = useApi(
    () =>
      // Newest-first, so a just-created dossier lands on page 0. Sorts on
      // `docDate` — the actual JPA entity column — not `dateDocument` (the
      // response DTO's field name), which 400s: Pageable's `sort` validates
      // against the entity property, and OpenAPI doesn't document it.
      // `statut` itself is handled separately — see fetchDossiersWithStatusWorkaround.
      fetchDossiersWithStatusWorkaround(
        {
          search: search || undefined,
          trancheId: trancheIds.length > 0 ? trancheIds : undefined,
          commercial: commercial !== 'all' ? commercial : undefined,
          champDate: dateDebut || dateFin ? champDate : undefined,
          dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
          dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
        },
        status,
        page,
        DEFAULT_PAGE_SIZE,
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

  function toggleSelected(d: DossierListItemDto) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(d.id)) next.delete(d.id);
      else next.add(d.id);
      return next;
    });
    setSelectedLabels((prev) => ({ ...prev, [d.id]: d.code || d.clientNom || d.id }));
  }

  function removeSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectedLabels({});
    setBatchError(null);
  }

  async function handleBatchDocument(action: 'view' | 'download') {
    if (!batchDocKind || selectedIds.size === 0) return;
    setBatchBusy(action);
    setBatchError(null);
    try {
      const ids = Array.from(selectedIds);
      if (action === 'view') await viewDossiersDocumentsEnLot(batchDocKind, ids);
      else await downloadDossiersDocumentsEnLot(batchDocKind, ids, `${batchDocKind}-lot.pdf`);
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBatchBusy(null);
    }
  }

  return (
    <PageShell
      title="Dossiers de vente"
      crumbs={[{ label: 'Ventes' }, { label: 'Dossiers' }]}
      fullHeight
      icon={<Folder />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <Card padded={false} className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 p-3">
            <InputGroup className="min-w-55 flex-1">
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
              <InputGroup className="w-32.5">
                <InputGroupInput
                  type="date"
                  aria-label="Du"
                  value={dateDebut}
                  onChange={(e) => resetAndSet(setDateDebut, e.target.value)}
                />
              </InputGroup>
              <InputGroup className="w-32.5">
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

        <Card padded={false} className="shrink-0">
          <div className="flex flex-wrap items-center gap-2.5 p-3">
            <Select
              items={BATCH_DOC_ITEMS}
              value={batchDocKind}
              onValueChange={(v) => setBatchDocKind((v as DossierBatchDocKind) || null)}
            >
              <SelectTrigger className="w-65">
                <SelectValue placeholder="Générer un document…" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {BATCH_DOC_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {batchDocKind && (
              <>
                <span className="text-[12.5px] text-muted-foreground">
                  {selectedIds.size} dossier{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
                </span>
                <Button type="button" variant="outline" size="sm" disabled={selectedIds.size === 0 || !!batchBusy} onClick={() => handleBatchDocument('view')}>
                  <Eye data-icon="inline-start" /> {batchBusy === 'view' ? 'Ouverture…' : 'Voir'}
                </Button>
                <Button type="button" size="sm" disabled={selectedIds.size === 0 || !!batchBusy} onClick={() => handleBatchDocument('download')}>
                  <Download data-icon="inline-start" /> {batchBusy === 'download' ? 'Téléchargement…' : 'Télécharger'}
                </Button>
                {selectedIds.size > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                    Vider la sélection
                  </Button>
                )}
                {batchError && <span className="text-[12px] text-destructive">{batchError}</span>}
              </>
            )}
          </div>
          {batchDocKind && selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border p-3 pt-2.5">
              {Array.from(selectedIds).map((id) => (
                <Badge key={id} tone="info" className="gap-1">
                  {selectedLabels[id] || id}
                  <button type="button" aria-label="Retirer de la sélection" onClick={() => removeSelected(id)}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
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
                <Table className="w-full min-w-160 table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                      {batchDocKind && <TableHead className="w-9" />}
                      <TableHead className="w-[17%]">Client</TableHead>
                      <TableHead className="w-[11%]">Code</TableHead>
                      <TableHead className="w-[11%]">Prospection</TableHead>
                      <TableHead className="w-[13%]">Statut</TableHead>
                      <TableHead className="w-[13%]">Commercial</TableHead>
                      <TableHead className="w-[10%] text-right">Prix</TableHead>
                      <TableHead className="w-[11%] text-right">Total à payer</TableHead>
                      <TableHead className="w-[9%]">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dossiers.map((d) => (
                      <TableRow
                        key={d.id}
                        tabIndex={0}
                        role="link"
                        aria-label={`Ouvrir le dossier ${d.clientNom ?? d.code}`}
                        className={selectedIds.has(d.id) ? 'cursor-pointer bg-muted/40' : 'cursor-pointer'}
                        onClick={() => navigate(`/dossiers/${d.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/dossiers/${d.id}`);
                        }}
                      >
                        {batchDocKind && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              className="size-3.5"
                              aria-label={`Sélectionner ${d.clientNom ?? d.code}`}
                              checked={selectedIds.has(d.id)}
                              onChange={() => toggleSelected(d)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="truncate font-medium text-foreground" title={d.clientNom ?? undefined}>{d.clientNom ?? '—'}</TableCell>
                        <TableCell className="truncate" title={d.code}><Badge tone="neutral" className="font-mono">{d.code}</Badge></TableCell>
                        <TableCell className="truncate">
                          {d.prospectionId ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/prospections/${d.prospectionId}`);
                              }}
                              title="Ouvrir la prospection d'origine"
                            >
                              <Badge tone="info">{d.prospectionCode || 'Voir'}</Badge>
                            </button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="truncate"><Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge></TableCell>
                        <TableCell className="truncate text-muted-foreground" title={d.commercialNom ?? undefined}>{d.commercialNom ?? '—'}</TableCell>
                        <TableCell className="truncate text-right tabular-nums text-(--info)">{formatCurrency(d.prix)}</TableCell>
                        <TableCell className="truncate text-right font-semibold tabular-nums text-(--success)">{formatCurrency(d.totalAPayer)}</TableCell>
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
