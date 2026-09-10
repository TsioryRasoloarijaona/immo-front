import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, Folder, RotateCcw, Search, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
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
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
// Formatage monétaire et de date : porté par DataGrid via le `type` de
// colonne, plus par cet écran.
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
  const debouncedSearch = useDebouncedValue(search);
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
          search: debouncedSearch || undefined,
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
    [debouncedSearch, status.join(','), trancheIds.join(','), champDate, dateDebut, dateFin, commercial, page],
    'dossiers',
  );
  const dossiers = data?.content ?? [];

  // Aggregate fetch (once, 16 tranches in the real portfolio per CLAUDE.md) —
  // populates the Tranche dropdown. Independent of the dossiers query above.
  const tranches = useApi(() => listTranches(undefined, { page: 0, size: 500 }), [], 'tranches-filtre');
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

  // Drives the empty state's wording and its escape hatch — see ArticlesList.
  const hasActiveFilters =
    !!search || status.length > 0 || trancheIds.length > 0 || champDate !== 'RESERVATION' || !!dateDebut || !!dateFin || commercial !== 'all';

  const commercialItems = [
    { label: 'Tous les commerciaux', value: 'all' },
    ...commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id })),
  ];

  /* Les colonnes vivent dans le composant et non au module : la colonne
     « Prospection » a besoin de `navigate`, et le statut de `toneForStatus`.
     `useMemo` sur `navigate` seul — le reste est stable. */
  const colonnes = useMemo<ColonneGrille<DossierListItemDto>[]>(
    () => [
      { nom: 'clientNom', libelle: 'Client', largeur: 17, classe: 'font-medium text-foreground', titre: (d) => d.clientNom ?? undefined },
      {
        nom: 'code',
        libelle: 'Code',
        largeur: 11,
        rendu: (d) => (
          <Badge tone="neutral" className="font-mono">
            {d.code}
          </Badge>
        ),
        titre: (d) => d.code,
      },
      {
        nom: 'prospectionCode',
        libelle: 'Prospection',
        largeur: 11,
        rendu: (d) =>
          d.prospectionId ? (
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
          ),
      },
      {
        nom: 'statut',
        libelle: 'Statut',
        largeur: 13,
        // Tri et filtre sur le libellé canonique, pas sur le statut brut :
        // c'est le libellé qui est affiché et donc tapé.
        valeur: (d) => canonicalStatusLabel(d.statut),
        rendu: (d) => <Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge>,
      },
      { nom: 'commercialNom', libelle: 'Commercial', largeur: 13, classe: 'text-muted-foreground', titre: (d) => d.commercialNom ?? undefined },
      { nom: 'prix', libelle: 'Prix', type: 'MONTANT', largeur: 10, classe: 'text-(--info)' },
      { nom: 'totalAPayer', libelle: 'Total à payer', type: 'MONTANT', largeur: 11, classe: 'font-semibold text-(--success)' },
      { nom: 'dateDocument', libelle: 'Date', type: 'DATE', largeur: 9, classe: 'text-muted-foreground' },
    ],
    [navigate],
  );

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
                {/* Picking a document kind leaves both action buttons
                    disabled until rows are ticked, with nothing saying why —
                    so say it, rather than showing "0 dossier sélectionné"
                    next to two dead buttons. */}
                <span className="text-body text-muted-foreground">
                  {selectedIds.size === 0 ? (
                    <>Cochez les dossiers à inclure dans le document.</>
                  ) : (
                    <>
                      {selectedIds.size} dossier{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
                    </>
                  )}
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
                {batchError && <span className="text-body text-destructive">{batchError}</span>}
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

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">
              {(data?.totalElements ?? 0)} dossier{(data?.totalElements ?? 0) > 1 ? 's' : ''}
            </div>
            {dossiers.length === 0 ? (
              <EmptyState
                title={hasActiveFilters ? 'Aucun résultat' : 'Rien à afficher'}
                message={
                  hasActiveFilters
                    ? 'Aucun dossier de vente ne correspond aux filtres actifs.'
                    : "Aucun dossier de vente n'est encore enregistré."
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
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
                <DataGrid
                  rows={dossiers}
                  colonnes={colonnes}
                  minWidth="58rem"
                  onOuvrir={(id) => navigate(`/dossiers/${id}`)}
                  libelleLigne={(d) => `Ouvrir le dossier ${d.clientNom ?? d.code}`}
                  // La gouttiere *est* le selecteur de lot quand un type de
                  // document est choisi : sans ca l'ecran aurait deux colonnes
                  // de cases, dont une decorative.
                  selection={
                    batchDocKind
                      ? {
                          ids: selectedIds,
                          onToggle: (id) => {
                            const d = dossiers.find((x) => x.id === id);
                            if (d) toggleSelected(d);
                          },
                          onToggleAll: (ids) => {
                            setSelectedIds(new Set(ids));
                            setSelectedLabels((prev) => {
                              const next = { ...prev };
                              for (const id of ids) {
                                const d = dossiers.find((x) => x.id === id);
                                if (d) next[id] = d.code || d.clientNom || d.id;
                              }
                              return next;
                            });
                          },
                        }
                      : undefined
                  }
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
