import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Upload } from 'lucide-react';
import BoutonExporter from '../../components/BoutonExporter';
import PageShell from '../../components/PageShell';
import Pagination from '../../components/Pagination';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid from '../../components/DataGrid';
import EtatColonnes from '../../components/EtatColonnes';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { DEFAULT_PAGE_SIZE, listTranches } from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { grilleDepuisCatalogue, useColonnesVisibles, type DispositionColonnes } from '../../lib/colonnes';
import { useColonnesTranches } from '../../lib/referentiels';
import type { TrancheListItemDto } from '../../types';

/** `id` et `projetId` sont servis par défaut pour la navigation, jamais affichés. */
const DISPOSITION: DispositionColonnes = {
  ordre: ['description', 'code', 'projetCode', 'standingLibelle', 'entiteCode', 'ville', 'dateOctroiTitresFonciers', 'estEnVente'],
  poids: { description: 30, code: 12, projetCode: 16, standingLibelle: 12, entiteCode: 10, ville: 14 },
  masquees: new Set(['id', 'projetId']),
};

export default function TranchesList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const catalogue = useColonnesTranches();
  const colonnes = useColonnesVisibles('tranches', catalogue.data, DISPOSITION);
  const demandees = colonnes.demandees;
  const { data, loading, error } = useApi(
    () => listTranches({ search: debouncedSearch || undefined, colonnes: demandees }, { page, size: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, page, demandees?.join(',') ?? ''],
  );
  const grille = useMemo(
    () => grilleDepuisCatalogue<TrancheListItemDto>(colonnes.colonnes, DISPOSITION.poids, 'description'),
    [colonnes.colonnes],
  );
  const rows = data?.content ?? [];

  return (
    <PageShell
      title="Tranches"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Tranches' }]}
      icon={<Building2 />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <div className="flex gap-2">
          <BoutonExporter pdf chemin="/api/tranches/export" nomListe="tranches" disabled={colonnes.visibles.length === 0}
            params={{ search: debouncedSearch || undefined, colonnes: colonnes.visibles }} />
          <ActionAdmin to="/articles/import?type=tranches" libelle="Importer" variant="outline" icone={<Upload data-icon="inline-start" />} />
          <ActionAdmin to="/tranches/nouveau" libelle="Nouvelle tranche" />
        </div>
      }
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3 pt-1">
        <InputGroup className="max-w-md shrink-0">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un code, une description, une ville, un programme…"
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
          />
        </InputGroup>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">
                {data.totalElements} tranche{data.totalElements > 1 ? 's' : ''}
              </div>
              {colonnes.catalogueServi.length > 0 && (
                <ColumnSelector
                  catalogue={colonnes.catalogueServi}
                  visibles={colonnes.visibles}
                  onBasculer={colonnes.basculer}
                  onReinitialiser={colonnes.reinitialiser}
                  estDefaut={colonnes.estDefaut}
                />
              )}
            </div>
            {rows.length === 0 ? (
              <EmptyState title={search ? 'Aucun résultat' : 'Aucune tranche'} />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <EtatColonnes pret={grille.length > 0} erreur={catalogue.error}>
                  <DataGrid
                    cleOrdre="tranches"
                    rows={rows}
                    colonnes={grille}
                    onOuvrir={(id) => navigate(`/tranches/${id}`)}
                    libelleLigne={(t) => `Ouvrir la tranche ${t.description || t.code || ''}`.trim()}
                  />
                </EtatColonnes>
              </div>
            )}
            <div className="shrink-0">
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
