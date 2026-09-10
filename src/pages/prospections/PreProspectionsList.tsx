import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, UserPlus } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import ProspectionFilterBar from '../../components/ProspectionFilterBar';
import ProspectionTable from '../../components/ProspectionTable';
import { DEFAULT_PAGE_SIZE, listPreProspections, listTranches } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAppData, commercialLabel } from '../../lib/appData';
import { useColonnesProspections, useOriginesProspection } from '../../lib/referentiels';
import {
  PIPELINE_STAGES,
  emptyProspectionFilters,
  hasActiveProspectionFilters,
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
  const { commerciaux } = useAppData();
  const origines = useOriginesProspection();

  const [filters, setFilters] = useState<ProspectionFilterBarState>(emptyProspectionFilters());
  const debouncedSearch = useDebouncedValue(filters.search);
  const [page, setPage] = useState(0);
  // `GET /api/pre-prospections` **n'accepte pas `?colonnes=`** : il sert
  // toujours les colonnes historiques. Les groupes ACTIVITE et CONVERSION
  // viennent d'une vue légataire qui exclut les pré-prospections par
  // construction — les proposer ici serait offrir des colonnes vides. Le
  // catalogue est donc filtré, et rien n'est envoyé au serveur.
  const catalogue = useColonnesProspections();
  const catalogueServi = catalogue.data.filter((c) => c.groupe !== 'ACTIVITE' && c.groupe !== 'CONVERSION');
  // Clé distincte de celle des prospections : même DTO, mais les colonnes
  // utiles ne sont pas les mêmes sur un lead non qualifié.
  const colonnes = useColonnesVisibles('pre-prospections', catalogueServi);

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
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">
                {data?.totalElements ?? 0} pré-prospection{(data?.totalElements ?? 0) > 1 ? 's' : ''} au total
              </div>
              {catalogueServi.length > 0 && (
                <ColumnSelector
                  catalogue={catalogueServi}
                  visibles={colonnes.visibles}
                  onBasculer={colonnes.basculer}
                  onReinitialiser={colonnes.reinitialiser}
                  estDefaut={colonnes.estDefaut}
                />
              )}
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
              /* `min-w-0` : voir ProspectionsList — sans lui la largeur de la
                 table remonte la chaîne flex et élargit la page entière. */
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                {colonnes.colonnes.length > 0 ? (
                  <ProspectionTable
                    rows={rows}
                    colonnes={colonnes.colonnes}
                    entite="pré-prospection"
                    onOuvrir={(prospectionId) => navigate(`/pre-prospections/${prospectionId}`)}
                  />
                ) : catalogue.error ? (
                  <ErrorState message={`Colonnes indisponibles — ${catalogue.error}`} />
                ) : (
                  <LoadingState />
                )}
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
