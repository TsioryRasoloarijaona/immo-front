import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import Pagination from '../../components/Pagination';
import ProspectionFilterBar from '../../components/ProspectionFilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listProspections, listTranches } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { useOriginesProspection } from '../../lib/referentiels';
import { formatCurrency, formatDate } from '../../lib/format';
import {
  PIPELINE_STAGES,
  emptyProspectionFilters,
  etapeBadgeTone,
  prospectionDisplayName,
  type ProspectionFilterBarState,
} from '../../lib/domain';

const ETAPE_ITEMS = [
  ...PIPELINE_STAGES.map((s) => ({ label: s, value: s })),
  { label: 'À rappeler par le commercial', value: 'A RAPPELER PAR LE COMMERCIAL' },
  { label: 'Affaires à suivre', value: 'AFFAIRES A SUIVRE' },
];

export default function ProspectionsList() {
  const navigate = useNavigate();
  const { commerciaux } = useAppData();
  const origines = useOriginesProspection();

  const [filters, setFilters] = useState<ProspectionFilterBarState>(emptyProspectionFilters());
  const [page, setPage] = useState(0);

  function setFilter<K extends keyof ProspectionFilterBarState>(key: K, value: ProspectionFilterBarState[K]) {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const { data, loading, error } = useApi(
    () =>
      listProspections(
        {
          search: filters.search || undefined,
          etape: filters.etape.length > 0 ? filters.etape : undefined,
          origine: filters.origine.length > 0 ? filters.origine : undefined,
          commercial: filters.commercial.length > 0 ? filters.commercial : undefined,
          trancheId: filters.trancheId.length > 0 ? filters.trancheId : undefined,
          dateDebut: filters.dateDebut ? `${filters.dateDebut}T00:00:00` : undefined,
          dateFin: filters.dateFin ? `${filters.dateFin}T23:59:59` : undefined,
          ouvertes: filters.ouvertes === 'open' ? true : filters.ouvertes === 'closed' ? false : undefined,
        },
        { page, size: DEFAULT_PAGE_SIZE },
      ),
    [
      filters.search,
      filters.etape.join(','),
      filters.origine.join(','),
      filters.commercial.join(','),
      filters.trancheId.join(','),
      filters.dateDebut,
      filters.dateFin,
      filters.ouvertes,
      page,
    ],
  );
  const rows = data?.content ?? [];

  // Aggregate fetches for the filter dropdowns — independent of the
  // prospections query above.
  const tranches = useApi(() => listTranches(undefined, { page: 0, size: 500 }), []);
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  // `origine` on ProspectionListItemDto stores the référentiel *code*, not
  // necessarily `description` — same code/description mismatch as tier-types
  // on ProspectsList (e.g. "Bouche à Oreille" vs "BOUCHE À OREILLE"). Filter
  // on `code` for correctness even where the two happen to match today.
  const origineItems = origines.data.map((o) => ({ label: o.description || o.code || o.id, value: o.code || o.id }));
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  return (
    <PageShell
      title="Prospections"
      crumbs={[{ label: 'Ventes' }, { label: 'Prospections' }]}
      fullHeight
      icon={<Users />}
      accent="var(--sec-prospection)"
      accentBg="var(--sec-prospection-bg)"
      actions={
        <Button type="button" size="sm" onClick={() => navigate('/prospections/nouveau')}>
          <Plus data-icon="inline-start" /> Nouvelle prospection
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <ProspectionFilterBar
          state={filters}
          onChange={setFilter}
          etapeItems={ETAPE_ITEMS}
          origineItems={origineItems}
          commercialItems={commercialItems}
          trancheItems={trancheItems}
        />

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!loading && !error && (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5">
            <div className="shrink-0 text-[12.5px] text-muted-foreground">
              {data?.totalElements ?? 0} prospection{(data?.totalElements ?? 0) > 1 ? 's' : ''} au total
            </div>
            {rows.length === 0 ? (
              <EmptyState title="Aucun résultat" message="Ajustez vos filtres pour élargir la recherche." />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
                <Table className="w-full min-w-160 table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                      <TableHead className="w-[28%]">Prospect</TableHead>
                      <TableHead className="w-[16%]">Étape</TableHead>
                      <TableHead className="w-[16%]">Origine</TableHead>
                      <TableHead className="w-[18%]">Commercial</TableHead>
                      <TableHead className="w-[12%] text-right">Prix</TableHead>
                      <TableHead className="w-[10%]">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((p) => (
                      <TableRow
                        key={p.id}
                        tabIndex={0}
                        role="link"
                        aria-label={`Ouvrir la prospection ${prospectionDisplayName(p)}`}
                        className="cursor-pointer"
                        onClick={() => navigate(`/prospections/${p.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/prospections/${p.id}`);
                        }}
                      >
                        <TableCell className="truncate font-medium text-foreground" title={prospectionDisplayName(p)}>
                          {prospectionDisplayName(p)}
                        </TableCell>
                        <TableCell className="truncate">
                          <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge>
                        </TableCell>
                        <TableCell className="truncate" title={p.origine || undefined}>
                          {p.origine ? <Badge tone="info">{p.origine}</Badge> : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="truncate text-muted-foreground" title={p.commercialNom || undefined}>{p.commercialNom || '—'}</TableCell>
                        <TableCell className="truncate text-right font-semibold tabular-nums text-(--success)">
                          {p.prix ? formatCurrency(p.prix) : <span className="font-normal text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="truncate text-muted-foreground">{formatDate(p.dateDocument)}</TableCell>
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
