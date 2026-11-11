import { useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import FicheDocumentAchatFenetre from '../../components/achat/FicheDocumentAchatFenetre';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import EnteteListe from '../../components/liste/EnteteListe';
import PageListe from '../../components/liste/PageListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import { ErrorState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { cheminExportDocumentsAchat, getDocumentsAchat } from '../../lib/apiAchat';
import { voisinsDe } from '../../lib/fenetreFiche';
import { pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection } from '../../lib/pucesFiltres';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { FiltresDocumentsAchat } from '../../types/achat';
import { COLONNES_FACTURES } from './colonnesFacturesProjet';
import { CorpsListe } from './commun';
import { useReferentielsProjet } from './hooks';

const BASE = '/projet/depenses/factures';

export default function FacturesProjetList() {
  const navigate = useNavigate();
  const { search: requeteUrl } = useLocation();
  const { id: idOuvert } = useParams();
  const [params, setParams] = useSearchParams();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('projet-depenses-factures'));
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [nonSoldes, setNonSoldes] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(0);
  const q = useDebouncedValue(recherche.trim());

  // Projets et lot vivent dans l'URL : la synthèse y envoie ses liens.
  const projetIds = params.getAll('projetIds');
  const lotId = params.get('lotId');
  const referentiels = useReferentielsProjet();
  const projetItems = (referentiels.data?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));

  function changerProjets(ids: string[]) {
    setPage(0);
    const suivant = new URLSearchParams();
    ids.forEach((i) => suivant.append('projetIds', i));
    setParams(suivant, { replace: true });
  }

  function reinitialiser() {
    setPage(0);
    setDu('');
    setAu('');
    setNonSoldes(false);
    setRecherche('');
    setParams(new URLSearchParams(), { replace: true });
  }

  const filtres: FiltresDocumentsAchat = {
    natures: ['INVOICE'],
    moduleProjet: true,
    projetIds: projetIds.length > 0 ? projetIds : undefined,
    lotId: lotId ?? undefined,
    nonSoldes: nonSoldes || undefined,
    search: q || undefined,
    du: du || undefined,
    au: au || undefined,
  };
  const liste = useApi(() => getDocumentsAchat(filtres, { page, size: DEFAULT_PAGE_SIZE }), [JSON.stringify(filtres), page], 'projet-depenses-factures');
  const exportListe = useExportListe(cheminExportDocumentsAchat(), { ...filtres }, 'factures-projet');

  const lignes = liste.data?.content ?? [];
  const decompte = liste.data ? pluriel(liste.data.totalElements, 'facture') : undefined;
  const actifs = projetIds.length > 0 || !!lotId || nonSoldes || !!q || !!du || !!au;
  const ouvrir = (id: string) => void navigate(`${BASE}/${id}${requeteUrl}`);
  const voisins = voisinsDe(lignes.map((l) => l.id), idOuvert, ouvrir);
  const puces = [
    ...puceSelection('Projet', projetItems, projetIds),
    ...(lotId ? ['Un lot'] : []),
    ...(nonSoldes ? ['Non soldées'] : []),
    ...(recherche ? [`« ${recherche} »`] : []),
  ];

  return (
    <PageListe titre="Factures des projets">
      <EnteteListe titre="Factures des projets" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        periode={{ debut: du, fin: au, onChange: (d, f) => { setPage(0); setDu(d); setAu(f); } }}
        recherche={{ valeur: recherche, onChange: (v) => { setPage(0); setRecherche(v); }, placeholder: 'Code, référence, fournisseur…' }}
        onReinitialiser={reinitialiser}
        champs={
          <label className="flex items-center gap-1.5 text-body text-foreground">
            <input type="checkbox" checked={nonSoldes} onChange={(e) => { setPage(0); setNonSoldes(e.target.checked); }} />
            Non soldées
          </label>
        }
      >
        <BoiteFiltre titre="Projets" mode="multiple" items={projetItems} valeur={projetIds} onChange={changerProjets} />
      </PanneauFiltresCoches>

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
          cleOrdre="projet-depenses-factures"
          messageVide={actifs ? 'Aucune facture ne correspond aux filtres actifs' : 'Aucune facture dans votre périmètre'}
          onOuvrir={ouvrir}
          onPage={setPage}
        />
      )}
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle="projet-depenses-factures"
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: () => void liste.refetch() },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
      {idOuvert && <FicheDocumentAchatFenetre key={idOuvert} id={idOuvert} voisins={voisins} onFermer={() => void navigate(`${BASE}${requeteUrl}`)} />}
    </PageListe>
  );
}
