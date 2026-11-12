import { useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid from '../../components/DataGrid';
import Pagination from '../../components/Pagination';
import FiltresDocumentsAchat from '../../components/achat/FiltresDocumentsAchat';
import FicheDocumentAchatFenetre from '../../components/achat/FicheDocumentAchatFenetre';
import BandeTotauxAchat from '../../components/achat/BandeTotauxAchat';
import { COLONNES_ACHAT } from '../../components/achat/colonnesAchat';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import EnteteListe from '../../components/liste/EnteteListe';
import PageListe from '../../components/liste/PageListe';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { cheminExportDocumentsAchat, getDocumentsAchat, getReferentielsAchat, getTotauxDocumentsAchat } from '../../lib/apiAchat';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { appliquerFiltres, etatDepuisUrl, filtresServeur, type EtatFiltresAchat } from '../../lib/documentsAchat';
import { voisinsDe } from '../../lib/fenetreFiche';
import { colonneLocale, useColonnesVisibles } from '../../lib/colonnes';
import { pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { VueAchat } from '../../lib/vuesAchat';

/** Écran de pièces d'achat piloté par une vue (natures, colonnes, filtres, totaux) ; la route `/:id` ouvre la fiche. */
export default function DocumentsAchatList({ vue }: Readonly<{ vue: VueAchat }>) {
  const navigate = useNavigate();
  const { search: requeteUrl } = useLocation();
  const { id: idOuvert } = useParams();
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes(`achat-${vue.cle}`));

  const etat = etatDepuisUrl(params, vue.natures);
  const recherche = useDebouncedValue(etat.search.trim());

  function changer(patch: Partial<EtatFiltresAchat>) {
    setPage(0);
    // Fige la période affichée : un filtre de lien (natures, nonSoldes…) ne doit pas faire basculer le défaut du mois.
    const periode = params.has('du') || params.has('au') ? {} : { du: etat.du, au: etat.au };
    const suivant = appliquerFiltres(params, { ...periode, ...patch });
    if (suivant.toString() !== params.toString()) setParams(suivant, { replace: true });
  }

  function reinitialiser() {
    setPage(0);
    const suivant = new URLSearchParams();
    params.getAll('modules').forEach((m) => suivant.append('modules', m));
    setParams(suivant, { replace: true });
  }

  const filtres = filtresServeur(etat, recherche);
  const cle = JSON.stringify(filtres);
  const toutes = vue.colonnes.map((c) => COLONNES_ACHAT[c]);
  const catalogue = toutes.map((c) => colonneLocale(c.nom, c.libelle, 'GENERAL', c.type ?? 'TEXTE'));
  const masquees = new Set((vue.masquees ?? []).map((c) => COLONNES_ACHAT[c].nom));
  const choix = useColonnesVisibles(`achat-${vue.cle}`, catalogue, {
    ordre: catalogue.map((c) => c.nom),
    poids: {},
    ouverture: catalogue.filter((c) => !masquees.has(c.nom)).map((c) => c.nom),
  });
  const colonnes = toutes.filter((c) => choix.visibles.includes(c.nom));

  const referentiels = useApi(() => getReferentielsAchat(), [], 'achat-referentiels');
  const liste = useApi(() => getDocumentsAchat(filtres, { page, size: DEFAULT_PAGE_SIZE }), [cle, page], `achat-${vue.cle}`);
  const totaux = useApi(() => getTotauxDocumentsAchat(filtres), [cle], `achat-${vue.cle}-totaux`);
  const exportListe = useExportListe(cheminExportDocumentsAchat(), { ...filtres }, 'pieces-achat');

  const lignes = liste.data?.content ?? [];
  const decompte = liste.data ? pluriel(liste.data.totalElements, 'pièce') : undefined;
  const ouvrir = (id: string) => void navigate(`${vue.chemin}/${id}${requeteUrl}`);
  const voisins = voisinsDe(lignes.map((l) => l.id), idOuvert, ouvrir);

  return (
    <PageListe titre={vue.titre}>
      <EnteteListe titre={vue.titre} lignes={decompte}>
        <ColumnSelector compact catalogue={choix.catalogueServi} visibles={choix.visibles} onBasculer={choix.basculer} onReinitialiser={choix.reinitialiser} estDefaut={choix.estDefaut} />
      </EnteteListe>
      <FiltresDocumentsAchat
        vue={vue}
        etat={etat}
        referentiels={referentiels.data ?? undefined}
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        onChange={changer}
        onReinitialiser={reinitialiser}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {liste.loading && !liste.data && !liste.error && <LoadingState />}
        {liste.error && (
          <div className="flex flex-col items-center gap-2">
            <ErrorState message={liste.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void liste.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!liste.error && !totaux.error && totaux.data && <BandeTotauxAchat totaux={totaux.data} mode={etat.nonSoldes ? 'depenses' : vue.totaux} />}
        {!liste.error && liste.data && (
          <ResultsRegion loading={liste.loading}>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              {lignes.length === 0 ? (
                <EmptyState title="Aucune pièce dans votre périmètre" />
              ) : (
                <DataGrid
                  cleOrdre={`achat-${vue.cle}`}
                  rows={lignes}
                  colonnes={colonnes}
                  onOuvrir={ouvrir}
                  libelleLigne={(d) => `Ouvrir la pièce ${d.code ?? d.id}`}
                  bandeauRegroupement={false}
                />
              )}
            </div>
            <div className="shrink-0">
              <Pagination page={liste.data.page} totalPages={liste.data.totalPages} totalElements={liste.data.totalElements} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle={`achat-${vue.cle}`}
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: () => void liste.refetch() },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
      {idOuvert && <FicheDocumentAchatFenetre key={idOuvert} id={idOuvert} voisins={voisins} onFermer={() => void navigate(`${vue.chemin}${requeteUrl}`)} />}
    </PageListe>
  );
}
