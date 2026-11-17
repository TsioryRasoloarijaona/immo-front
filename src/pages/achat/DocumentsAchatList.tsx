import { useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FilePlus2, Plus, RotateCcw } from 'lucide-react';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid from '../../components/DataGrid';
import Pagination from '../../components/Pagination';
import FiltresDocumentsAchat from '../../components/achat/FiltresDocumentsAchat';
import FicheDocumentAchatFenetre from '../../components/achat/FicheDocumentAchatFenetre';
import FormulairePieceAchatFenetre from '../../components/achat/FormulairePieceAchatFenetre';
import MenuNaturesAchat from '../../components/achat/MenuNaturesAchat';
import BandeTotauxAchat from '../../components/achat/BandeTotauxAchat';
import { COLONNES_ACHAT } from '../../components/achat/colonnesAchat';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante, { type OutilPropre } from '../../components/liste/BarreOutilsFlottante';
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

  const [creation, setCreation] = useState<{ nature: string; sources?: string[] } | null>(null);
  const [menuNatures, setMenuNatures] = useState(false);
  const [cochees, setCochees] = useState<Set<string>>(new Set());
  const genereFacture = vue.natures?.length === 1 && vue.natures[0] === 'DELIVRY';
  const creables = (referentiels.data?.naturesCreables ?? []).filter((n) => !vue.natures || vue.natures.some((v) => v === n));
  const libelleNature = (n: string) => referentiels.data?.natures.find((x) => x.code === n)?.libelle ?? n;
  const nouveau = creables.length === 1 ? { libelle: `Nouveau : ${libelleNature(creables[0])}`, onClick: () => setCreation({ nature: creables[0] }) } : undefined;
  const ajouter: OutilPropre[] = creables.length > 1 ? [{ id: 'ajouter', libelle: 'Ajouter', icone: Plus, onClick: () => setMenuNatures(true) }] : [];
  if (genereFacture) {
    ajouter.push({
      id: 'generer-facture', libelle: 'Générer Facture', icone: FilePlus2, disabled: cochees.size === 0,
      onClick: () => setCreation({ nature: 'INVOICE', sources: [...cochees] }),
    });
  }
  const basculer = (id: string) => setCochees((prec) => {
    const suivant = new Set(prec);
    if (!suivant.delete(id)) suivant.add(id);
    return suivant;
  });

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
                  selection={genereFacture ? { ids: cochees, onToggle: basculer, onToggleAll: (tous) => setCochees(new Set(tous)) } : undefined}
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
        nouveau={nouveau}
        propres={ajouter}
        actions={[
          { id: 'rafraichir', onClick: () => void liste.refetch() },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
      {menuNatures && (
        <MenuNaturesAchat
          natures={creables.map((n) => ({ code: n, libelle: libelleNature(n) }))}
          onChoisir={(n) => { setMenuNatures(false); setCreation({ nature: n }); }}
          onFermer={() => setMenuNatures(false)}
        />
      )}
      {creation && (
        <FormulairePieceAchatFenetre
          key={`${creation.nature}-${creation.sources?.join(',')}`}
          nature={creation.nature}
          sources={creation.sources}
          onFermer={() => setCreation(null)}
          onEnregistre={(p, fermer) => {
            setCreation(null);
            setCochees(new Set());
            if (!fermer) void navigate(`${vue.chemin}/${p.id}${requeteUrl}`);
          }}
        />
      )}
      {idOuvert && <FicheDocumentAchatFenetre key={idOuvert} id={idOuvert} voisins={voisins} onFermer={() => void navigate(`${vue.chemin}${requeteUrl}`)} />}
    </PageListe>
  );
}
