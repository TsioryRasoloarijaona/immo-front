import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderX, RotateCcw } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import BandeTotauxDesistements from '../../components/desistement/BandeTotauxDesistements';
import DesistementTable from '../../components/desistement/DesistementTable';
import FiltresDesistementsPanneau from '../../components/desistement/FiltresDesistementsPanneau';
import { DEFAULT_PAGE_SIZE, listDesistements } from '../../lib/api';
import {
  FILTRES_DESISTEMENTS_DEFAUT,
  filtresDesistementsActifs,
  paramsDesistements,
  type FiltresDesistements,
} from '../../lib/desistements';
import { useTranchesFiltre } from '../../lib/referentiels';
import { useApi, useDebouncedValue } from '../../lib/useApi';

export default function DesistementsList() {
  const navigate = useNavigate();
  const tranches = useTranchesFiltre();
  const [filtres, setFiltres] = useState<FiltresDesistements>(FILTRES_DESISTEMENTS_DEFAUT);
  const [page, setPage] = useState(0);
  const q = useDebouncedValue(filtres.q);

  function changer<K extends keyof FiltresDesistements>(cle: K, valeur: FiltresDesistements[K]) {
    setPage(0);
    setFiltres((f) => ({ ...f, [cle]: valeur }));
  }

  function reinitialiser() {
    setPage(0);
    setFiltres(FILTRES_DESISTEMENTS_DEFAUT);
  }

  const params = paramsDesistements({ ...filtres, q });
  const liste = useApi(
    () => listDesistements(params, { page, size: DEFAULT_PAGE_SIZE }),
    [JSON.stringify(params), page],
    'desistements',
  );
  const data = liste.data;
  const actifs = filtresDesistementsActifs(filtres);

  return (
    <PageShell
      title="Désistements"
      crumbs={[{ label: 'Ventes' }, { label: 'Désistements' }]}
      fullHeight
      icon={<FolderX />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <FiltresDesistementsPanneau
          filtres={filtres}
          changer={changer}
          reinitialiser={reinitialiser}
          tranches={tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }))}
        />

        {liste.loading && !data && <LoadingState />}
        {liste.error && (
          <div className="flex flex-col items-center gap-2">
            <ErrorState message={liste.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void liste.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!liste.error && data && (
          <ResultsRegion loading={liste.loading}>
            <BandeTotauxDesistements page={data} />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              {data.lignes.length === 0 ? (
                <EmptyState
                  title="Aucun désistement"
                  message={actifs ? 'Aucun désistement ne correspond aux filtres actifs.' : 'Les désistements se créent depuis la fiche d’un dossier de vente.'}
                  action={
                    actifs ? (
                      <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
                        <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <DesistementTable rows={data.lignes} onOuvrir={(id) => navigate(`/desistements/${id}`)} />
              )}
            </div>
            <div className="shrink-0">
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.total} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
