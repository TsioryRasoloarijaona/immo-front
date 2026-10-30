import { useState } from 'react';
import { Mail } from 'lucide-react';
import PageShell from '../../components/PageShell';
import Pagination from '../../components/Pagination';
import FenetreFiche from '../../components/fiche/FenetreFiche';
import EmailDetail from '../../components/administration/EmailDetail';
import EmailTable from '../../components/administration/EmailTable';
import FiltresEmailPanneau from '../../components/administration/FiltresEmailPanneau';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { listEmails, listUtilisateursEmails } from '../../lib/apiAdministration';
import { FILTRES_EMAIL_VIDES, versFiltresEmail, type EtatFiltresEmail } from '../../lib/emailHistorique';
import { voisinsDe } from '../../lib/fenetreFiche';
import { useApi, useDebouncedValue } from '../../lib/useApi';

export default function EmailHistorique() {
  const [filtres, setFiltres] = useState<EtatFiltresEmail>(FILTRES_EMAIL_VIDES);
  const [page, setPage] = useState(0);
  const [rafraichir, setRafraichir] = useState(0);
  const [ouvert, setOuvert] = useState<string>();
  const texte = useDebouncedValue(filtres.texte);
  const effectifs = { ...filtres, texte };

  const utilisateurs = useApi(listUtilisateursEmails, [], 'admin-emails-utilisateurs');
  const { data, loading, error } = useApi(
    () => listEmails(versFiltresEmail(effectifs, page)),
    [effectifs.debut, effectifs.fin, texte, effectifs.utilisateur, effectifs.envoye, page, rafraichir],
  );

  function changer(f: EtatFiltresEmail) {
    setFiltres(f);
    setPage(0);
  }

  const ids = data?.content.map((l) => l.id) ?? [];
  const ligne = data?.content.find((l) => l.id === ouvert);

  return (
    <PageShell title="EMail Historique" icon={<Mail />} fullHeight
      crumbs={[{ label: 'Administration' }, { label: 'Sécurité' }, { label: 'EMail Historique' }]}>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <FiltresEmailPanneau
          filtres={filtres}
          utilisateurs={utilisateurs.data ?? []}
          onChange={changer}
          onRafraichir={() => setRafraichir((n) => n + 1)}
          onEffacer={() => changer(FILTRES_EMAIL_VIDES)}
        />
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && data.content.length === 0 && <EmptyState title="Aucun e-mail" />}
        {!error && data && data.content.length > 0 && (
          <>
            <EmailTable rows={data.content} onOuvrir={setOuvert} />
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
          </>
        )}
      </div>
      {ouvert && (
        <FenetreFiche nature="E-mail" titre={ligne?.objet ?? 'Sans objet'} voisins={voisinsDe(ids, ouvert, setOuvert)} onFermer={() => setOuvert(undefined)}>
          <EmailDetail key={ouvert} id={ouvert} />
        </FenetreFiche>
      )}
    </PageShell>
  );
}
