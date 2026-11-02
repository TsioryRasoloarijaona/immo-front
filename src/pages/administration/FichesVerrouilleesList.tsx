import { useCallback, useState } from 'react';
import { LockOpen } from 'lucide-react';
import PageShell from '../../components/PageShell';
import Pagination from '../../components/Pagination';
import FiltresFichesVerrouilleesPanneau from '../../components/administration/FiltresFichesVerrouilleesPanneau';
import FichesVerrouilleesTable from '../../components/administration/FichesVerrouilleesTable';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { deverrouillerFiche, deverrouillerToutesFiches, listFichesVerrouillees } from '../../lib/apiAdministration';
import { oublierLecturesRecentes } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { formatNumber } from '../../lib/format';
import {
  FILTRES_FICHES_VIDES,
  messageDeverrouillage,
  versFiltresFichesVerrouillees,
  type EtatFiltresFiches,
} from '../../lib/fichesVerrouillees';
import { useToast } from '../../lib/toastContext';
import { useApi, useDebouncedValue } from '../../lib/useApi';

const MESSAGE_UNE =
  "Déverrouiller cette fiche ? Si son utilisateur l'a encore ouverte dans OMRAN, un autre pourra la modifier en même temps et le dernier enregistrement gagnera.";
const MESSAGE_TOUT =
  "Déverrouiller toutes les fiches ? Les filtres ne s'appliquent pas. Si un utilisateur a encore une fiche ouverte dans OMRAN, un autre pourra la modifier en même temps.";

export default function FichesVerrouilleesList() {
  const confirmer = useConfirm();
  const toast = useToast();
  const [filtres, setFiltres] = useState<EtatFiltresFiches>(FILTRES_FICHES_VIDES);
  const [page, setPage] = useState(0);
  const [rafraichir, setRafraichir] = useState(0);
  const [choisie, setChoisie] = useState<string>();
  const [echec, setEchec] = useState<string>();
  const [enCours, setEnCours] = useState(false);
  const recherche = useDebouncedValue(filtres.recherche);
  const effectifs = { ...filtres, recherche };

  const { data, loading, error } = useApi(
    () => listFichesVerrouillees(versFiltresFichesVerrouillees(effectifs, page)),
    [effectifs.debut, effectifs.fin, effectifs.etat, recherche, page, rafraichir],
  );

  // Dernière page vidée par un déverrouillage : on recule (ajustement pendant le rendu).
  if (data && data.totalPages > 0 && data.page >= data.totalPages) setPage(data.totalPages - 1);

  function changer(f: EtatFiltresFiches) {
    setFiltres(f);
    setPage(0);
    setChoisie(undefined);
    setEchec(undefined);
  }

  function recharger() {
    oublierLecturesRecentes();
    setChoisie(undefined);
    setRafraichir((n) => n + 1);
  }

  const garderVisible = useCallback((ids: string[]) => {
    setChoisie((c) => (c !== undefined && ids.includes(c) ? c : undefined));
  }, []);

  const ligne = data?.content.find((l) => l.id === choisie);

  async function executer(message: string, confirmLabel: string, action: () => Promise<string>) {
    if (!(await confirmer({ message, confirmLabel, cancelLabel: 'Annuler' }))) return;
    setEchec(undefined);
    setEnCours(true);
    try {
      toast(await action());
    } catch (err) {
      setEchec(err instanceof Error ? err.message : 'Échec du déverrouillage.');
    } finally {
      setEnCours(false);
    }
    recharger();
  }

  function deverrouiller() {
    if (!ligne) return;
    void executer(MESSAGE_UNE, 'Déverrouiller', async () => {
      await deverrouillerFiche(ligne.id);
      return 'Fiche déverrouillée.';
    });
  }

  function deverrouillerTout() {
    void executer(MESSAGE_TOUT, 'Déverrouiller tout', async () =>
      messageDeverrouillage((await deverrouillerToutesFiches()).nombre),
    );
  }

  const titre = data ? `Fiches verrouillées (${formatNumber(data.totalElements)})` : 'Fiches verrouillées';

  return (
    <PageShell title={titre} icon={<LockOpen />} fullHeight
      crumbs={[{ label: 'Administration' }, { label: 'Sécurité' }, { label: 'Fiches verrouillées' }]}>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <FiltresFichesVerrouilleesPanneau
          filtres={filtres}
          deverrouillable={ligne?.etat === 'VERROUILLEE' && !enCours}
          toutDeverrouillable={!enCours}
          onChange={changer}
          onRafraichir={() => {
            setEchec(undefined);
            recharger();
          }}
          onEffacer={() => changer(FILTRES_FICHES_VIDES)}
          onDeverrouiller={deverrouiller}
          onDeverrouillerTout={deverrouillerTout}
        />
        {echec && (
          <div role="alert" className="mb-2 rounded-md bg-(--danger-bg) px-3 py-1.75 text-body text-(--danger)">
            {echec}
          </div>
        )}
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && data.content.length === 0 && <EmptyState title="Aucune fiche verrouillée" />}
        {!error && data && data.content.length > 0 && (
          <>
            <FichesVerrouilleesTable
              rows={data.content}
              selection={{ id: choisie, onChoisir: setChoisie }}
              onLignesVisibles={garderVisible}
            />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPageChange={(p) => {
                setPage(p);
                setChoisie(undefined);
              }}
            />
          </>
        )}
      </div>
    </PageShell>
  );
}
