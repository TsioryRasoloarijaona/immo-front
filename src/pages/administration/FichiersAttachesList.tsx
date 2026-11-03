import { useState } from 'react';
import { Paperclip } from 'lucide-react';
import PageShell from '../../components/PageShell';
import Pagination from '../../components/Pagination';
import FichiersAttachesTable from '../../components/administration/FichiersAttachesTable';
import FiltresFichiersAttachesPanneau from '../../components/administration/FiltresFichiersAttachesPanneau';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { oublierLecturesRecentes } from '../../lib/api';
import { filtresFichiersAttaches, listFichiersAttaches, RACINE_FICHIERS_ATTACHES } from '../../lib/apiAdministration';
import { FILTRES_FICHIERS_VIDES, TAILLE_PAGE_FICHIERS, versFiltresFichiers, type EtatFiltresFichiers } from '../../lib/fichiersAttaches';
import { formatNumber } from '../../lib/format';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';

export default function FichiersAttachesList() {
  const [filtres, setFiltres] = useState<EtatFiltresFichiers>(FILTRES_FICHIERS_VIDES);
  const [page, setPage] = useState(0);
  const [rafraichir, setRafraichir] = useState(0);
  const recherche = useDebouncedValue(filtres.recherche);
  const envoi = versFiltresFichiers({ ...filtres, recherche });

  const choix = useApi(filtresFichiersAttaches, [], 'admin-fichiers-attaches-filtres');
  const { data, loading, error } = useApi(
    () => listFichiersAttaches({ ...envoi, page, taille: TAILLE_PAGE_FICHIERS }),
    [JSON.stringify(envoi), page, rafraichir],
  );
  const exportListe = useExportListe(`${RACINE_FICHIERS_ATTACHES}/export`, { ...envoi }, 'fichiers-attaches');

  function changer(f: EtatFiltresFichiers) {
    setFiltres(f);
    setPage(0);
  }

  const titre = data ? `Fichiers attachés (${formatNumber(data.totalElements)})` : 'Fichiers attachés';

  return (
    <PageShell title={titre} icon={<Paperclip />} fullHeight
      crumbs={[{ label: 'Administration' }, { label: 'Tableaux de bord' }, { label: 'Fichiers attachés' }]}>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <FiltresFichiersAttachesPanneau
          filtres={filtres}
          choix={choix.data ?? undefined}
          exportEnCours={exportListe.enCours}
          onChange={changer}
          onRafraichir={() => {
            oublierLecturesRecentes();
            setRafraichir((n) => n + 1);
          }}
          onEffacer={() => changer(FILTRES_FICHIERS_VIDES)}
          onExporter={() => void exportListe.exporter('xlsx')}
        />
        {exportListe.erreur && (
          <div role="alert" className="mb-2 rounded-md bg-(--danger-bg) px-3 py-1.75 text-body text-(--danger)">
            {exportListe.erreur}
          </div>
        )}
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && data.content.length === 0 && <EmptyState title="Aucun fichier" />}
        {!error && data && data.content.length > 0 && (
          <>
            <FichiersAttachesTable rows={data.content} />
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </div>
    </PageShell>
  );
}
