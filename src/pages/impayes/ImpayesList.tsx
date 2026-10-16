import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleAlert, RotateCcw } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import ColumnSelector from '../../components/ColumnSelector';
import BoutonExporter from '../../components/BoutonExporter';
import EtatColonnes from '../../components/EtatColonnes';
import ImpayeTable, { type LigneImpaye } from '../../components/ImpayeTable';
import BandeTotauxImpayes from '../../components/impayes/BandeTotauxImpayes';
import FiltresImpayesPanneau from '../../components/impayes/FiltresImpayesPanneau';
import { DEFAULT_PAGE_SIZE, listImpayes } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_IMPAYES } from '../../lib/dispositions';
import { FILTRES_IMPAYES_DEFAUT, filtresImpayesActifs, paramsImpayes, type FiltresImpayes } from '../../lib/impayes';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { commercialLabel, useAppData } from '../../lib/appData';
import {
  referentielItems,
  useCategoriesEcheance,
  useColonnesImpayes,
  useProjetsReferentiel,
  useTranchesFiltre,
} from '../../lib/referentiels';

export default function ImpayesList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const { commerciaux } = useAppData();
  const projets = useProjetsReferentiel();
  const tranches = useTranchesFiltre();
  const categories = useCategoriesEcheance();

  const [filtres, setFiltres] = useState<FiltresImpayes>(FILTRES_IMPAYES_DEFAUT);
  const [page, setPage] = useState(0);
  const q = useDebouncedValue(filtres.q);
  const client = useDebouncedValue(filtres.client);
  const article = useDebouncedValue(filtres.article);

  function changer<K extends keyof FiltresImpayes>(cle: K, valeur: FiltresImpayes[K]) {
    setPage(0);
    setFiltres((f) => ({ ...f, [cle]: valeur }));
  }

  function reinitialiser() {
    setPage(0);
    setFiltres(FILTRES_IMPAYES_DEFAUT);
  }

  const catalogue = useColonnesImpayes();
  const colonnes = useColonnesVisibles('impayes', catalogue.data, DISPOSITION_IMPAYES);

  // Textes débouncés : une frappe ne relance pas la liste à chaque caractère.
  const params = paramsImpayes({ ...filtres, q, client, article });
  const liste = useApi(
    () => listImpayes(params, { page, size: DEFAULT_PAGE_SIZE }),
    [JSON.stringify(params), page],
    'impayes',
  );

  const data = liste.data;
  const lignes: LigneImpaye[] = (data?.lignes ?? []).map((l) => ({ ...l, id: l.echeanceId }));
  const actifs = filtresImpayesActifs(filtres);

  return (
    <PageShell
      title="Impayés"
      crumbs={[{ label: 'Ventes' }, { label: 'Impayés' }]}
      fullHeight
      icon={<CircleAlert />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
      actions={
        <BoutonExporter chemin="/api/impayes/export" params={{ ...params, colonnes: colonnes.visibles }} nomListe="impayes" />
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />

        <FiltresImpayesPanneau
          filtres={filtres}
          changer={changer}
          reinitialiser={reinitialiser}
          projets={referentielItems(projets.data)}
          tranches={tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }))}
          commerciaux={commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }))}
          categories={referentielItems(categories.data)}
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
            <BandeTotauxImpayes page={data} />
            <div className="flex shrink-0 justify-end">
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
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              {lignes.length === 0 ? (
                <EmptyState
                  title="Aucun impayé pour ces filtres"
                  message={actifs ? 'Aucune échéance échue et non soldée ne correspond aux filtres actifs.' : undefined}
                  action={
                    actifs ? (
                      <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
                        <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                  <ImpayeTable
                    rows={lignes}
                    colonnes={colonnes.colonnes}
                    onOuvrir={(l) => navigate(`/dossiers/${l.dossierId}?onglet=financier`)}
                  />
                </EtatColonnes>
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
