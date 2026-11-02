import { useState } from 'react';
import { Zap } from 'lucide-react';
import PageShell from '../../components/PageShell';
import Pagination from '../../components/Pagination';
import ActionsTable from '../../components/administration/ActionsTable';
import FiltresActionsPanneau from '../../components/administration/FiltresActionsPanneau';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { FILTRES_ACTIONS_VIDES, versFiltresActions, type EtatFiltresActions } from '../../lib/actions';
import { oublierLecturesRecentes } from '../../lib/api';
import { listActions } from '../../lib/apiAdministration';
import { formatNumber } from '../../lib/format';
import { useApi, useDebouncedValue } from '../../lib/useApi';

export default function ActionsList() {
  const [filtres, setFiltres] = useState<EtatFiltresActions>(FILTRES_ACTIONS_VIDES);
  const [page, setPage] = useState(0);
  const [rafraichir, setRafraichir] = useState(0);
  const recherche = useDebouncedValue(filtres.recherche);
  const effectifs = { ...filtres, recherche };

  const { data, loading, error } = useApi(
    () => listActions(versFiltresActions(effectifs, page)),
    [
      effectifs.creationDebut,
      effectifs.creationFin,
      effectifs.modificationDebut,
      effectifs.modificationFin,
      recherche,
      page,
      rafraichir,
    ],
  );

  // Dernière page disparue après un filtre : on recule (ajustement pendant le rendu).
  if (data && data.totalPages > 0 && data.page >= data.totalPages) setPage(data.totalPages - 1);

  function changer(f: EtatFiltresActions) {
    setFiltres(f);
    setPage(0);
  }

  function recharger() {
    oublierLecturesRecentes();
    setRafraichir((n) => n + 1);
  }

  const titre = data ? `Actions (${formatNumber(data.totalElements)})` : 'Actions';

  return (
    <PageShell title={titre} icon={<Zap />} fullHeight
      crumbs={[{ label: 'Administration' }, { label: 'Sécurité' }, { label: 'Actions' }]}>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <FiltresActionsPanneau
          filtres={filtres}
          onChange={changer}
          onRafraichir={recharger}
          onEffacer={() => changer(FILTRES_ACTIONS_VIDES)}
        />
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && data.content.length === 0 && <EmptyState title="Aucune action" />}
        {!error && data && data.content.length > 0 && (
          <>
            <ActionsTable rows={data.content} />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </PageShell>
  );
}
