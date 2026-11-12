import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ColumnSelector from '../../components/ColumnSelector';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreActionsLots from '../../components/projet/BarreActionsLots';
import BoiteStatutsLots from '../../components/projet/BoiteStatutsLots';
import ModaleCreationLot from '../../components/projet/ModaleCreationLot';
import ModaleTransitionLot from '../../components/projet/ModaleTransitionLot';
import { ApiError, DEFAULT_PAGE_SIZE } from '../../lib/api';
import { EXPORT_LOTS, getTotauxLots, listLots, supprimerLot } from '../../lib/apiProjet';
import { useColonnesVisibles } from '../../lib/colonnes';
import { useConfirm } from '../../lib/confirmContext';
import { formatNumber, pluriel } from '../../lib/format';
import { droitCreation, MESSAGE_SANS_DROIT, type DroitLot } from '../../lib/genresLot';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { FiltresLots, GenreLot } from '../../types/projet';
import { CorpsListe } from './commun';
import { CATALOGUE_LOTS, DISPOSITION_LOTS, grilleLots, totauxBandeLots } from './colonnesLots';
import { fournisseursItems, libelleReferentiel, useReferentielsProjet } from './hooks';

export default function LotsList() {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const referentiels = useReferentielsProjet();
  const fournisseurs = fournisseursItems(referentiels.data);
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('projet-lots'));
  const [entiteId, setEntiteId] = useState<string | null>(null);
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [statutIds, setStatutIds] = useState<string[]>([]);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [fournisseurId, setFournisseurId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const [selectionne, setSelectionne] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [refus, setRefus] = useState<ReadonlySet<DroitLot>>(new Set());
  const [creation, setCreation] = useState<GenreLot | null>(null);
  const [transition, setTransition] = useState(false);
  const colonnes = useColonnesVisibles('projet-lots', CATALOGUE_LOTS, DISPOSITION_LOTS);
  const grille = useMemo(() => grilleLots(colonnes.colonnes), [colonnes.colonnes]);

  function changer<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function changerEntite(v: string | null) {
    setPage(0);
    setEntiteId(v);
    setProjetIds([]);
  }

  function reinitialiser() {
    setPage(0);
    setEntiteId(null);
    setProjetIds([]);
    setStatutIds([]);
    setTypeId(null);
    setFournisseurId(null);
    setSearch('');
  }

  function sansDroit(droit: DroitLot) {
    setRefus((r) => new Set(r).add(droit));
    setCreation(null);
    setTransition(false);
    setMessage(MESSAGE_SANS_DROIT);
  }

  const ref = referentiels.data;
  const projetsEntite = (ref?.projets ?? []).filter((p) => !entiteId || p.entiteId === entiteId);
  const projetItems = projetsEntite.map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—', compte: p.nbLots }));
  const entiteItems = (ref?.entites ?? []).map((e) => ({ value: e.id, label: e.libelle ?? e.code ?? '—' }));
  const typeItems = (ref?.typesLot ?? []).map((t) => ({ value: t.id, label: libelleReferentiel(t) }));
  const statutItems = (ref?.statutsLot ?? []).map((s) => ({ value: s.id, label: libelleReferentiel(s) }));

  const filtres: FiltresLots = {
    entiteId: entiteId ?? undefined,
    projetIds: projetIds.length > 0 ? projetIds : undefined,
    statutIds: statutIds.length > 0 ? statutIds : undefined,
    typeId: typeId ?? undefined,
    fournisseurId: fournisseurId ?? undefined,
    search: debouncedSearch || undefined,
  };
  const cle = JSON.stringify(filtres);
  const liste = useApi(() => listLots(filtres, { page, size: DEFAULT_PAGE_SIZE }), [cle, page]);
  const totaux = useApi(() => getTotauxLots(filtres), [cle], 'projet-lots-totaux');
  const exportListe = useExportListe(EXPORT_LOTS, { ...filtres }, 'lots');

  const lignes = liste.data?.content ?? [];
  const ligne = lignes.find((l) => l.id === selectionne);
  const actifs = !!entiteId || projetIds.length > 0 || statutIds.length > 0 || !!typeId || !!fournisseurId || !!search;
  const decompte = liste.data ? pluriel(liste.data.totalElements, 'lot') : undefined;
  const titre = totaux.data ? `Lots (${formatNumber(totaux.data.nombreLots)})` : 'Lots';
  const puces = [
    ...puceUnique(entiteItems, entiteId),
    ...puceSelection('Projet', projetItems, projetIds),
    ...puceSelection('Statut', statutItems, statutIds),
    ...puceUnique(typeItems, typeId),
    ...puceUnique(fournisseurs, fournisseurId),
    ...(search ? [`« ${search} »`] : []),
  ];

  async function supprimer() {
    if (!ligne) return;
    const ok = await confirmer({ title: 'Supprimer le lot', message: 'Voulez-vous vraiment supprimer cet enregistrement ?', confirmLabel: 'Supprimer' });
    if (!ok) return;
    setMessage(null);
    try {
      await supprimerLot(ligne.id);
      setSelectionne(null);
      refetchAllApis();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) sansDroit('supprimer');
      else {
        if (err instanceof ApiError && err.status === 404) refetchAllApis();
        setMessage(err instanceof Error ? err.message : 'La suppression a échoué.');
      }
    }
  }

  function lotCree(id: string) {
    setCreation(null);
    void navigate(`/projet/lots/${id}`);
  }

  return (
    <PageListe titre="Lots">
      <EnteteListe titre={titre} lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        recherche={{ valeur: search, onChange: (v) => changer(setSearch, v), placeholder: 'Code, description, fournisseur…' }}
        onReinitialiser={reinitialiser}
      >
        <BoiteStatutsLots statuts={ref?.statutsLot ?? []} valeur={statutIds} onChange={(v) => changer(setStatutIds, v)} />
        <BoiteFiltre titre="Entité" mode="unique" items={entiteItems} valeur={entiteId} onChange={changerEntite} />
        <BoiteFiltre titre="Projet" mode="multiple" items={projetItems} valeur={projetIds} onChange={(v) => changer(setProjetIds, v)} />
        <BoiteFiltre titre="Type" mode="unique" items={typeItems} valeur={typeId} onChange={(v) => changer(setTypeId, v)} />
        <BoiteFiltre titre="Fournisseur" mode="unique" items={fournisseurs} valeur={fournisseurId} onChange={(v) => changer(setFournisseurId, v)} />
      </PanneauFiltresCoches>
      <div className="flex items-center">
        <BarreActionsLots
          refus={refus}
          ligneSelectionnee={!!ligne}
          exportEnCours={exportListe.enCours}
          exportRefuse={exportListe.refuse}
          onRafraichir={refetchAllApis}
          onVider={reinitialiser}
          onExporter={() => void exportListe.exporter('xlsx')}
          onCreer={(genre) => (refus.has(droitCreation(genre)) ? undefined : setCreation(genre))}
          onEditer={() => ligne && void navigate(`/projet/lots/${ligne.id}`)}
          onTransition={() => setTransition(true)}
          onSupprimer={() => void supprimer()}
        />
        <div className="ml-auto pt-2 pr-3">
          <ColumnSelector compact catalogue={colonnes.catalogueServi} visibles={colonnes.visibles} onBasculer={colonnes.basculer}
            onReinitialiser={colonnes.reinitialiser} estDefaut={colonnes.estDefaut} />
        </div>
      </div>
      <CorpsListe
        etat={liste}
        rows={lignes}
        colonnes={grille}
        cleOrdre="projet-lots"
        messageVide={actifs ? 'Aucun lot ne correspond aux filtres actifs' : 'Aucun lot'}
        onOuvrir={(id) => void navigate(`/projet/lots/${id}`)}
        onPage={setPage}
        totauxServeur={totauxBandeLots(totaux.data, totaux.loading, totaux.error, () => void totaux.refetch())}
        selection={{
          ids: new Set(selectionne ? [selectionne] : []),
          onToggle: (id) => setSelectionne((s) => (s === id ? null : id)),
          onToggleAll: () => setSelectionne(null),
        }}
      />
      <BarreEtatListe lignes={decompte ?? '—'} selection={ligne ? ligne.code ?? '1 ligne' : 'aucune'} alerte={message ?? exportListe.erreur} />
      {creation && (
        <ModaleCreationLot
          genre={creation}
          referentiels={ref ?? null}
          projetsVisibles={projetsEntite.map((p) => p.id)}
          onAnnuler={() => setCreation(null)}
          onCree={(lot) => lotCree(lot.id)}
          onSansDroit={() => sansDroit(droitCreation(creation))}
        />
      )}
      {transition && ligne && (
        <ModaleTransitionLot
          lot={ligne}
          onAnnuler={() => setTransition(false)}
          onFait={() => {
            setTransition(false);
            refetchAllApis();
          }}
          onSansDroit={() => sansDroit('transition')}
          onIntrouvable={() => {
            setTransition(false);
            setSelectionne(null);
            setMessage('Ce lot n\'existe plus.');
            refetchAllApis();
          }}
        />
      )}
    </PageListe>
  );
}
