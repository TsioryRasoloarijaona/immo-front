import { useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import FicheDocumentAchatFenetre from '../../components/achat/FicheDocumentAchatFenetre';
import FiltresDocumentsAchat from '../../components/achat/FiltresDocumentsAchat';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import EnteteListe from '../../components/liste/EnteteListe';
import PageListe from '../../components/liste/PageListe';
import { ErrorState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { cheminExportDocumentsAchat, getDocumentsAchat, getReferentielsAchat } from '../../lib/apiAchat';
import { appliquerFiltres, etatDepuisUrl, filtresServeur, type EtatFiltresAchat } from '../../lib/documentsAchat';
import { voisinsDe } from '../../lib/fenetreFiche';
import { pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { VueAchat } from '../../lib/vuesAchat';
import type { NatureDocumentAchat } from '../../types/achat';
import { COLONNES_FACTURES } from './colonnesFacturesProjet';
import { CorpsListe } from './commun';

export type NatureDepenses = 'factures' | 'documents-a-regler' | 'avoirs' | 'impayes';

interface Configuration {
  titre: string;
  unite: string;
  natures: NatureDocumentAchat[];
  nonSoldes: boolean;
}

const CONFIGURATIONS: Record<NatureDepenses, Configuration> = {
  factures: { titre: 'Factures des projets', unite: 'facture', natures: ['INVOICE'], nonSoldes: false },
  'documents-a-regler': { titre: 'Documents à régler des projets', unite: 'document', natures: ['DOCUMENT_TO_PAY'], nonSoldes: false },
  avoirs: { titre: 'Avoirs des projets', unite: 'avoir', natures: ['REFUND'], nonSoldes: false },
  impayes: { titre: 'Impayés des projets', unite: 'pièce', natures: ['INVOICE', 'DOCUMENT_TO_PAY'], nonSoldes: true },
};

/** Pièces d'achat des projets (module Projet) d'une nature ; la route `/:id` ouvre la fiche. */
export default function DepensesProjetListe({ nature }: Readonly<{ nature: NatureDepenses }>) {
  const { titre, unite, natures, nonSoldes } = CONFIGURATIONS[nature];
  const base = `/projet/depenses/${nature}`;
  const cle = `projet-depenses-${nature}`;
  const vue: VueAchat = {
    cle: nature, titre, chemin: base, natures, totaux: 'depenses', colonnes: [],
    filtres: { statut: true, nature: false, projet: true, lot: false },
  };
  const navigate = useNavigate();
  const { search: requeteUrl } = useLocation();
  const { id: idOuvert } = useParams();
  const [params, setParams] = useSearchParams();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes(cle));
  const [page, setPage] = useState(0);

  // Sans période dans l'URL : toutes les dates (les liens de la synthèse n'en portent pas).
  const lu = etatDepuisUrl(params, natures);
  const sansPeriode = !params.has('du') && !params.has('au');
  const etat: EtatFiltresAchat = { ...lu, ...(sansPeriode && { du: '', au: '' }), nonSoldes: nonSoldes || lu.nonSoldes };
  const recherche = useDebouncedValue(etat.search.trim());
  const lotId = params.get('lotId');

  function changer(patch: Partial<EtatFiltresAchat>) {
    setPage(0);
    const periode = sansPeriode ? { du: etat.du, au: etat.au } : {};
    const suivant = appliquerFiltres(params, { ...periode, ...patch });
    if (suivant.toString() !== params.toString()) setParams(suivant, { replace: true });
  }

  function reinitialiser() {
    setPage(0);
    setParams(new URLSearchParams(), { replace: true });
  }

  const filtres = { ...filtresServeur(etat, recherche), moduleProjet: true, lotId: lotId ?? undefined };
  const referentiels = useApi(() => getReferentielsAchat(), [], 'achat-referentiels');
  const liste = useApi(() => getDocumentsAchat(filtres, { page, size: DEFAULT_PAGE_SIZE }), [JSON.stringify(filtres), page], cle);
  const exportListe = useExportListe(cheminExportDocumentsAchat(), { ...filtres }, `${cle}`);

  const lignes = liste.data?.content ?? [];
  const decompte = liste.data ? pluriel(liste.data.totalElements, unite) : undefined;
  const ouvrir = (id: string) => void navigate(`${base}/${id}${requeteUrl}`);
  const voisins = voisinsDe(lignes.map((l) => l.id), idOuvert, ouvrir);

  return (
    <PageListe titre={titre}>
      <EnteteListe titre={titre} lignes={decompte} />
      <FiltresDocumentsAchat
        vue={vue}
        etat={etat}
        referentiels={referentiels.data ?? undefined}
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        onChange={changer}
        onReinitialiser={reinitialiser}
      />

      {liste.error && (
        <div className="flex flex-col items-center gap-2 px-3 pt-2">
          <ErrorState message={liste.error} />
          <Button type="button" variant="outline" size="sm" onClick={() => void liste.refetch()}>
            <RotateCcw data-icon="inline-start" /> Réessayer
          </Button>
        </div>
      )}
      {!liste.error && (
        <CorpsListe
          etat={liste}
          rows={lignes}
          colonnes={COLONNES_FACTURES}
          cleOrdre={cle}
          messageVide="Aucune pièce dans votre périmètre"
          onOuvrir={ouvrir}
          onPage={setPage}
        />
      )}
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle={cle}
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: () => void liste.refetch() },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
      {idOuvert && <FicheDocumentAchatFenetre key={idOuvert} id={idOuvert} voisins={voisins} onFermer={() => void navigate(`${base}${requeteUrl}`)} />}
    </PageListe>
  );
}
