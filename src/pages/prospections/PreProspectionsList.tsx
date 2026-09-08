import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, UserPlus } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import ProspectionFilterBar from '../../components/ProspectionFilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { DEFAULT_PAGE_SIZE, listPreProspections, listTranches } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { useAppData, commercialLabel } from '../../lib/appData';
import { useOriginesProspection } from '../../lib/referentiels';
import { formatCurrency, formatDate, isPastOrToday } from '../../lib/format';
import {
  PIPELINE_STAGES,
  emptyProspectionFilters,
  etapeBadgeTone,
  hasActiveProspectionFilters,
  prospectionDisplayName,
  type ProspectionFilterBarState,
} from '../../lib/domain';

const ETAPE_ITEMS = [
  ...PIPELINE_STAGES.map((s) => ({ label: s, value: s })),
  { label: 'À rappeler par le commercial', value: 'A RAPPELER PAR LE COMMERCIAL' },
  { label: 'Affaires à suivre', value: 'AFFAIRES A SUIVRE' },
];

// Pré-prospections are raw, not-yet-qualified leads — Omran stores them in
// the same table as qualified Prospections (see CLAUDE.md) but this app
// treats the two as fully separate sections/routes, not tabs on one page,
// since they're different workflows (a pré-prospection has to go through
// "créer la fiche prospect" before it becomes a real Prospection). Same
// filter bar and real server-side filtering as ProspectionsList/DossiersList
// — GET /api/pre-prospections accepts the same param set as
// /api/prospections as of the docs/api-docsV4.json 88-route revision.
export default function PreProspectionsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const { commerciaux } = useAppData();
  const origines = useOriginesProspection();

  const [filters, setFilters] = useState<ProspectionFilterBarState>(emptyProspectionFilters());
  const debouncedSearch = useDebouncedValue(filters.search);
  const [page, setPage] = useState(0);

  function setFilter<K extends keyof ProspectionFilterBarState>(key: K, value: ProspectionFilterBarState[K]) {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  }

  const { data, loading, error } = useApi(
    () =>
      listPreProspections(
        {
          search: debouncedSearch || undefined,
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
      debouncedSearch,
      filters.etape.join(','),
      filters.origine.join(','),
      filters.commercial.join(','),
      filters.trancheId.join(','),
      filters.dateDebut,
      filters.dateFin,
      filters.ouvertes,
      page,
    ],
    'pre-prospections',
  );
  const rows = data?.content ?? [];

  const tranches = useApi(() => listTranches(undefined, { page: 0, size: 500 }), [], 'tranches-filtre');
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  // See ProspectionsList.tsx — filter on `code`, not `description`.
  const origineItems = origines.data.map((o) => ({ label: o.description || o.code || o.id, value: o.code || o.id }));
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  return (
    <PageShell
      title="Pré-prospections"
      crumbs={[{ label: 'Ventes' }, { label: 'Pré-prospections' }]}
      fullHeight
      icon={<UserPlus />}
      accent="var(--sec-preprospection)"
      accentBg="var(--sec-preprospection-bg)"
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <p className="shrink-0 max-w-180 text-body text-muted-foreground">
          Leads bruts pas encore qualifiés. Ouvrez-en un pour créer sa fiche prospect puis le transformer en prospection.
        </p>

        <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />

        <ProspectionFilterBar
          state={filters}
          onChange={setFilter}
          etapeItems={ETAPE_ITEMS}
          origineItems={origineItems}
          commercialItems={commercialItems}
          trancheItems={trancheItems}
        />

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">
              {data?.totalElements ?? 0} pré-prospection{(data?.totalElements ?? 0) > 1 ? 's' : ''} au total
            </div>
            {rows.length === 0 ? (
              <EmptyState
                title={hasActiveProspectionFilters(filters) ? 'Aucun résultat' : 'Rien à afficher'}
                message={
                  hasActiveProspectionFilters(filters)
                    ? 'Aucune pré-prospection ne correspond aux filtres actifs.'
                    : "Aucune pré-prospection n'est encore enregistrée."
                }
                action={
                  hasActiveProspectionFilters(filters) ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setFilters(emptyProspectionFilters())}>
                      <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-card">
                <Table className="w-full min-w-320 table-fixed">
                  <TableHeader>
                    <TableRow className="sticky top-0 z-10 bg-card hover:bg-card">
                      <TableHead className="w-[17%]">Prospect</TableHead>
                      <TableHead className="w-[10%]">Étape</TableHead>
                      <TableHead className="w-[10%]">Origine</TableHead>
                      <TableHead className="w-[11%]">Commercial</TableHead>
                      <TableHead className="w-[11%] text-right">Prix</TableHead>
                      <TableHead className="w-[9%]">Date</TableHead>
                      <TableHead className="w-[10%]">Téléphone</TableHead>
                      <TableHead className="w-[12%]">Email</TableHead>
                      <TableHead className="w-[10%]">Relance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((p) => (
                      <TableRow
                        key={p.id}
                        tabIndex={0}
                        role="link"
                        aria-label={`Ouvrir la pré-prospection ${prospectionDisplayName(p)}`}
                        className="cursor-pointer"
                        onClick={() => navigate(`/pre-prospections/${p.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/pre-prospections/${p.id}`);
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
                        {/* Le numéro retombe sur celui du premier contact quand la fiche
                            n'en porte pas : 8 591 des 8 613 prospections ouvertes sont
                            joignables ainsi, contre 5 034 par la seule fiche. */}
                        <TableCell className="truncate tabular-nums text-muted-foreground" title={p.telephone || undefined}>
                          {p.telephone || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        {/* Absent dans 45 % des cas : un tiret neutre, pas un signal d'alerte. */}
                        <TableCell className="truncate text-muted-foreground" title={p.email || undefined}>
                          {p.email || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        {/* Le message de l'alerte passe en infobulle plutôt qu'en colonne :
                            c'est une note libre, de longueur imprévisible, qui ferait éclater
                            la largeur du tableau. La date, elle, se compare d'un coup d'œil. */}
                        <TableCell
                          className="truncate text-muted-foreground"
                          title={p.derniereAlerteMessage || undefined}
                        >
                          {p.derniereAlerteDate ? (
                            <Badge tone={isPastOrToday(p.derniereAlerteDate) ? 'warning' : 'neutral'}>
                              {formatDate(p.derniereAlerteDate)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
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
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
