import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante, { type ActionOutil } from '../../components/liste/BarreOutilsFlottante';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { listEntitesJuridiques } from '../../lib/apiEntites';
import { getChoixReunions, listReunions, supprimerReunion } from '../../lib/apiReunions';
import { useConfirm } from '../../lib/confirmContext';
import { voisinsDe } from '../../lib/fenetreFiche';
import { pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { plagePeriode } from '../../lib/periodes';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { referentielItems } from '../../lib/referentiels';
import {
  ACCES_REFUSE_REUNIONS, exporterReunionsCsv, lireReunions, MESSAGE_SUPPRESSION, NOUVELLE_REUNION,
} from '../../lib/saisieReunion';
import { useToast } from '../../lib/toastContext';
import { errorMessage, refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import type { FiltresReunions, ReunionLigneDto } from '../../types/reunions';
import { useReferentielsProjet } from './hooks';
import ReunionDetail from './ReunionDetail';

const RACINE = '/projet/reunions';

const COLONNES: ColonneGrille<ReunionLigneDto>[] = [
  { nom: 'projet', libelle: 'Projet', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'type', libelle: 'Type', largeur: 8 },
  { nom: 'reference', libelle: 'Référence P.V.', largeur: 6 },
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 5 },
  { nom: 'prochaineDate', libelle: 'Prochaine réunion', type: 'DATE', largeur: 5 },
  { nom: 'surveillant', libelle: 'Surveillant', largeur: 8 },
  { nom: 'note', libelle: 'Note', largeur: 14 },
];

export default function ReunionsList() {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const showToast = useToast();
  const { id: idOuvert } = useParams();
  const [params] = useSearchParams();
  const referentiels = useReferentielsProjet();
  const entites = useApi(() => listEntitesJuridiques('true'), [], 'projet-reunions-entites');
  const choix = useApi(() => getChoixReunions(), [], 'reunions-choix');
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('projet-reunions'));
  const [societeId, setSocieteId] = useState<string | null>(null);
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [periode, setPeriode] = useState(() => plagePeriode('mois'));
  const [recherche, setRecherche] = useState('');
  const q = useDebouncedValue(recherche.trim());
  const [selectionne, setSelectionne] = useState<string | null>(null);

  const projetItems = (referentiels.data?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));
  const entiteItems = (entites.data ?? []).map((e) => ({ value: e.id, label: e.description ?? e.code ?? '—' }));
  const typeItems = referentielItems(choix.data?.types ?? []);
  const filtres: FiltresReunions = {
    societeId: societeId ?? undefined,
    projetIds: projetIds.length > 0 ? projetIds : undefined,
    du: periode.debut || undefined,
    au: periode.fin || undefined,
    typeId: typeId ?? undefined,
    recherche: q || undefined,
  };
  const cle = JSON.stringify(filtres);
  const liste = useApi(() => lireReunions(() => listReunions(filtres)), [cle]);
  const refuse = liste.error === ACCES_REFUSE_REUNIONS;
  const lignes = liste.data ?? [];
  const ligne = lignes.find((r) => r.id === selectionne);
  const decompte = liste.data ? pluriel(liste.data.length, 'réunion') : undefined;
  const ouvrir = (id: string) => void navigate(`${RACINE}/${id}`);
  const voisins = voisinsDe(lignes.map((l) => l.id), idOuvert, ouvrir);
  const puces = [
    ...puceUnique(entiteItems, societeId),
    ...puceSelection('Projet', projetItems, projetIds),
    ...puceUnique(typeItems, typeId),
    ...(recherche ? [`« ${recherche} »`] : []),
  ];

  function reinitialiser() {
    setSocieteId(null);
    setProjetIds([]);
    setTypeId(null);
    setPeriode(plagePeriode('mois'));
    setRecherche('');
  }

  function ajouter() {
    if (projetIds.length !== 1 || !typeId) {
      showToast({ texte: 'Vous devez d\'abord sélectionner un projet et un type !', variante: 'erreur' });
      return;
    }
    void navigate(`${RACINE}/${NOUVELLE_REUNION}?projetId=${projetIds[0]}&typeId=${typeId}`);
  }

  async function supprimer() {
    if (!ligne || !(await confirmer({ title: 'Supprimer', message: MESSAGE_SUPPRESSION, confirmLabel: 'Supprimer' }))) return;
    try {
      await supprimerReunion(ligne.id);
      setSelectionne(null);
      refetchAllApis();
    } catch (err) {
      showToast({ texte: errorMessage(err), variante: 'erreur' });
    }
  }

  const actions: ActionOutil[] = [
    { id: 'modifier', onClick: () => { if (ligne) ouvrir(ligne.id); } },
    { id: 'supprimer', onClick: () => void supprimer() },
    { id: 'rafraichir', onClick: () => void liste.refetch() },
    { id: 'exporter', onClick: () => exporterReunionsCsv(lignes), disabled: lignes.length === 0 },
  ];

  return (
    <PageListe titre="Réunions chantier">
      <EnteteListe titre="Réunions chantier" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        periode={{ debut: periode.debut, fin: periode.fin, onChange: (debut, fin) => setPeriode({ debut, fin }) }}
        recherche={{ valeur: recherche, onChange: setRecherche, placeholder: 'Référence, note, surveillant…' }}
        onReinitialiser={reinitialiser}
      >
        <BoiteFiltre titre="Entité" mode="unique" items={entiteItems} valeur={societeId} onChange={setSocieteId} />
        <BoiteFiltre titre="Projet" mode="multiple" items={projetItems} valeur={projetIds} onChange={setProjetIds} />
        <BoiteFiltre titre="Type" mode="unique" items={typeItems} valeur={typeId} onChange={setTypeId} />
      </PanneauFiltresCoches>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {liste.loading && !liste.data && !liste.error && <LoadingState />}
        {refuse && <EmptyState title="Accès refusé" message={ACCES_REFUSE_REUNIONS} />}
        {liste.error && !refuse && (
          <div className="flex flex-col items-center gap-2">
            <ErrorState message={liste.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void liste.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!liste.error && liste.data && (
          <ResultsRegion loading={liste.loading}>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              {lignes.length === 0 ? (
                <EmptyState title="Aucune réunion" />
              ) : (
                <DataGrid
                  cleOrdre="projet-reunions"
                  rows={lignes}
                  colonnes={COLONNES}
                  onOuvrir={ouvrir}
                  libelleLigne={(r) => `Ouvrir la réunion ${r.reference ?? ''}`}
                  bandeauRegroupement={false}
                  selection={{
                    ids: new Set(selectionne ? [selectionne] : []),
                    onToggle: (id) => setSelectionne((s) => (s === id ? null : id)),
                    onToggleAll: () => setSelectionne(null),
                  }}
                />
              )}
            </div>
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection={ligne ? ligne.reference ?? '1 ligne' : 'aucune'} />
      <BarreOutilsFlottante cle="projet-reunions" ligneSelectionnee={!!ligne} actions={actions}
        nouveau={{ libelle: 'Nouvelle réunion', onClick: ajouter }} />
      {idOuvert && (
        <ReunionDetail
          key={idOuvert}
          id={idOuvert}
          projetId={params.get('projetId')}
          typeId={params.get('typeId')}
          ongletInitial={params.get('onglet')}
          voisins={voisins}
          onFermer={() => void navigate(RACINE)}
          onCree={(id, onglet) => void navigate(onglet ? `${RACINE}/${id}?onglet=${onglet}` : `${RACINE}/${id}`)}
        />
      )}
    </PageListe>
  );
}
