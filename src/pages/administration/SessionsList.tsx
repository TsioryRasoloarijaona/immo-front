import { useCallback, useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import PageShell from '../../components/PageShell';
import Pagination from '../../components/Pagination';
import FiltresSessionsPanneau from '../../components/administration/FiltresSessionsPanneau';
import SessionsTable from '../../components/administration/SessionsTable';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { fermerSession, listSessions, listUtilisateursSessions } from '../../lib/apiAdministration';
import { oublierLecturesRecentes } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { formatDateTime, formatNumber } from '../../lib/format';
import { FILTRES_SESSIONS_VIDES, versFiltresSessions, type EtatFiltresSessions } from '../../lib/sessions';
import { useToast } from '../../lib/toastContext';
import { useApi, useDebouncedValue } from '../../lib/useApi';

const MESSAGE_CONFIRMATION =
  "Fermer cette session ? Le poste OMRAN n'est pas déconnecté et aucun compte Arpent n'est touché : seule la ligne passe à Fermée.";

export default function SessionsList() {
  const confirmer = useConfirm();
  const toast = useToast();
  const [filtres, setFiltres] = useState<EtatFiltresSessions>(FILTRES_SESSIONS_VIDES);
  const [page, setPage] = useState(0);
  const [rafraichir, setRafraichir] = useState(0);
  const [choisie, setChoisie] = useState<string>();
  const [echec, setEchec] = useState<string>();
  const [enCours, setEnCours] = useState(false);
  const ip = useDebouncedValue(filtres.ip);
  const effectifs = { ...filtres, ip };

  const utilisateurs = useApi(listUtilisateursSessions, [], 'admin-sessions-utilisateurs');
  const { data, loading, error } = useApi(
    () => listSessions(versFiltresSessions(effectifs, page)),
    [effectifs.debut, effectifs.fin, effectifs.utilisateur, effectifs.ouverte, ip, page, rafraichir],
  );

  // Dernière page vidée par une fermeture : on recule (ajustement pendant le rendu).
  if (data && data.totalPages > 0 && data.page >= data.totalPages) setPage(data.totalPages - 1);

  function changer(f: EtatFiltresSessions) {
    setFiltres(f);
    setPage(0);
    setChoisie(undefined);
    setEchec(undefined);
  }

  function recharger() {
    oublierLecturesRecentes();
    setRafraichir((n) => n + 1);
  }

  const garderVisible = useCallback((ids: string[]) => {
    setChoisie((c) => (c !== undefined && ids.includes(c) ? c : undefined));
  }, []);

  const ligne = data?.content.find((l) => l.id === choisie);

  async function fermer() {
    if (!ligne) return;
    const message = `${MESSAGE_CONFIRMATION} Utilisateur : ${ligne.utilisateur ?? 'inconnu'}, ouverte le ${formatDateTime(ligne.dateOuverture)}.`;
    if (!(await confirmer({ message, confirmLabel: 'Fermer la session', cancelLabel: 'Annuler' }))) return;
    setEchec(undefined);
    setEnCours(true);
    try {
      await fermerSession(ligne.id);
      setChoisie(undefined);
      toast('Session fermée.');
    } catch (err) {
      setEchec(err instanceof Error ? err.message : 'Échec de la fermeture.');
    } finally {
      setEnCours(false);
    }
    recharger();
  }

  const titre = data ? `Sessions (${formatNumber(data.totalElements)})` : 'Sessions';

  return (
    <PageShell title={titre} icon={<MonitorSmartphone />} fullHeight
      crumbs={[{ label: 'Administration' }, { label: 'Sécurité' }, { label: 'Sessions' }]}>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <FiltresSessionsPanneau
          filtres={filtres}
          utilisateurs={utilisateurs.data ?? []}
          fermable={!!ligne && ligne.etat !== 'FERMEE' && !enCours}
          onChange={changer}
          onRafraichir={() => {
            setEchec(undefined);
            recharger();
          }}
          onEffacer={() => changer(FILTRES_SESSIONS_VIDES)}
          onFermer={() => void fermer()}
        />
        {echec && (
          <div role="alert" className="mb-2 rounded-md bg-(--danger-bg) px-3 py-1.75 text-body text-(--danger)">
            {echec}
          </div>
        )}
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && data.content.length === 0 && <EmptyState title="Aucune session" />}
        {!error && data && data.content.length > 0 && (
          <>
            <SessionsTable
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
