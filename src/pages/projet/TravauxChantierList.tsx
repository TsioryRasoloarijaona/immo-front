import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante, { type ActionOutil } from '../../components/liste/BarreOutilsFlottante';
import StatutPastille from '../../components/projet/travaux/StatutPastille';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { listEntitesJuridiques } from '../../lib/apiEntites';
import { getReferentielsTravaux, listTravauxChantier, supprimerJourTravaille } from '../../lib/apiTravauxChantier';
import { useConfirm } from '../../lib/confirmContext';
import { voisinsDe } from '../../lib/fenetreFiche';
import { formatNumber, pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { plagePeriode } from '../../lib/periodes';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { referentielItems } from '../../lib/referentiels';
import { MESSAGE_SUPPRESSION } from '../../lib/saisieReunion';
import {
  ACCES_REFUSE_TRAVAUX, exporterTravauxCsv, lireTravaux, NOUVEAU_JOUR,
} from '../../lib/saisieTravauxChantier';
import { useToast } from '../../lib/toastContext';
import { errorMessage, refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import type { FiltresTravaux, JourTravailleLigneDto } from '../../types/travauxChantier';
import { useReferentielsProjet } from './hooks';
import JourTravailleDetail from './JourTravailleDetail';

const RACINE = '/projet/travaux-chantier';
const REFUS_CREATION = "Vous n'avez pas les droits sur les états de création de l'entité 'Jour travaillé' !";

const COLONNES: ColonneGrille<JourTravailleLigneDto>[] = [
  { nom: 'statut', libelle: 'Statut', largeur: 6, valeur: (l) => l.statut?.libelle ?? '', rendu: (l) => <StatutPastille statut={l.statut} /> },
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 5 },
  { nom: 'heureDebut', libelle: 'Heure début', largeur: 4 },
  { nom: 'heureFin', libelle: 'Heure fin', largeur: 4 },
  { nom: 'personnel', libelle: 'Personnel', largeur: 8 },
  { nom: 'niveau', libelle: 'Nivellement', largeur: 6 },
  { nom: 'type', libelle: 'Type', largeur: 8 },
  { nom: 'article', libelle: 'Article', largeur: 8 },
  { nom: 'groupe', libelle: 'Groupe', largeur: 6 },
  { nom: 'projet', libelle: 'Projet', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'niveauCode', libelle: 'Nivellement code', largeur: 6 },
  { nom: 'client', libelle: 'Client', largeur: 8 },
  { nom: 'quantite', libelle: 'Quantité', type: 'NOMBRE', largeur: 5, rendu: (l) => formatNumber(l.quantite, 2) },
  { nom: 'totalHT', libelle: 'Total HT', type: 'MONTANT', largeur: 6 },
];

export default function TravauxChantierList() {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const showToast = useToast();
  const { id: idOuvert } = useParams();
  const referentiels = useReferentielsProjet();
  const entites = useApi(() => listEntitesJuridiques('true'), [], 'projet-travaux-entites');
  const choix = useApi(() => getReferentielsTravaux(), [], 'travaux-choix');
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('projet-travaux-chantier'));
  const [societeId, setSocieteId] = useState<string | null>(null);
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [statutIds, setStatutIds] = useState<string[]>([]);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [employeId, setEmployeId] = useState<string | null>(null);
  const [periode, setPeriode] = useState(() => plagePeriode('mois'));
  const [recherche, setRecherche] = useState('');
  const q = useDebouncedValue(recherche.trim());
  const [selectionne, setSelectionne] = useState<string | null>(null);

  const projetItems = (referentiels.data?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' }));
  const entiteItems = (entites.data ?? []).map((e) => ({ value: e.id, label: e.description ?? e.code ?? '—' }));
  const statutItems = (choix.data?.statuts ?? []).map((s) => ({ value: s.id, label: s.libelle ?? '—' }));
  const typeItems = (choix.data?.types ?? []).map((t) => ({ value: t.id, label: t.libelle ?? t.code ?? '—' }));
  const personnelItems = referentielItems(choix.data?.personnel ?? []);
  const filtres: FiltresTravaux = {
    societeId: societeId ?? undefined,
    projetIds: projetIds.length > 0 ? projetIds : undefined,
    statutIds: statutIds.length > 0 ? statutIds : undefined,
    du: periode.debut || undefined,
    au: periode.fin || undefined,
    typeId: typeId ?? undefined,
    employeId: employeId ?? undefined,
    recherche: q || undefined,
  };
  const cle = JSON.stringify(filtres);
  const liste = useApi(() => lireTravaux(() => listTravauxChantier(filtres)), [cle]);
  const refuse = liste.error === ACCES_REFUSE_TRAVAUX;
  const lignes = liste.data ?? [];
  const ligne = lignes.find((r) => r.id === selectionne);
  const decompte = liste.data ? pluriel(liste.data.length, 'jour travaillé', 'jours travaillés') : undefined;
  const ouvrir = (id: string) => void navigate(`${RACINE}/${id}`);
  const voisins = voisinsDe(lignes.map((l) => l.id), idOuvert, ouvrir);
  const puces = [
    ...puceUnique(entiteItems, societeId),
    ...puceSelection('Projet', projetItems, projetIds),
    ...puceSelection('Statut', statutItems, statutIds),
    ...puceUnique(typeItems, typeId),
    ...puceUnique(personnelItems, employeId),
    ...(recherche ? [`« ${recherche} »`] : []),
  ];

  function reinitialiser() {
    setSocieteId(null);
    setProjetIds([]);
    setStatutIds([]);
    setTypeId(null);
    setEmployeId(null);
    setPeriode(plagePeriode('mois'));
    setRecherche('');
  }

  function ajouter() {
    if (choix.data?.departAutorise === false) {
      showToast({ texte: REFUS_CREATION, variante: 'erreur' });
      return;
    }
    void navigate(`${RACINE}/${NOUVEAU_JOUR}`);
  }

  async function supprimer() {
    if (!ligne || !(await confirmer({ title: 'Supprimer', message: MESSAGE_SUPPRESSION, confirmLabel: 'Supprimer' }))) return;
    try {
      await supprimerJourTravaille(ligne.id);
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
    { id: 'exporter', onClick: () => exporterTravauxCsv(lignes), disabled: lignes.length === 0 },
  ];

  return (
    <PageListe titre="Travaux chantier">
      <EnteteListe titre="Travaux chantier" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        periode={{ debut: periode.debut, fin: periode.fin, onChange: (debut, fin) => setPeriode({ debut, fin }) }}
        recherche={{ valeur: recherche, onChange: setRecherche, placeholder: 'Personnel, type, article, client…' }}
        onReinitialiser={reinitialiser}
      >
        <BoiteFiltre titre="Entité" mode="unique" items={entiteItems} valeur={societeId} onChange={setSocieteId} />
        <BoiteFiltre titre="Projet" mode="multiple" items={projetItems} valeur={projetIds} onChange={setProjetIds} />
        <BoiteFiltre titre="Statut" mode="multiple" coches items={statutItems} valeur={statutIds} onChange={setStatutIds} />
        <BoiteFiltre titre="Type" mode="unique" items={typeItems} valeur={typeId} onChange={setTypeId} />
        <BoiteFiltre titre="Personnel" mode="unique" items={personnelItems} valeur={employeId} onChange={setEmployeId} />
      </PanneauFiltresCoches>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {liste.loading && !liste.data && !liste.error && <LoadingState />}
        {refuse && <EmptyState title="Accès refusé" message={ACCES_REFUSE_TRAVAUX} />}
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
                <EmptyState title="Aucun jour travaillé" />
              ) : (
                <DataGrid
                  cleOrdre="projet-travaux-chantier"
                  rows={lignes}
                  colonnes={COLONNES}
                  onOuvrir={ouvrir}
                  libelleLigne={(r) => `Ouvrir le jour travaillé ${r.personnel ?? ''}`}
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
      <BarreEtatListe lignes={decompte ?? '—'} selection={ligne ? ligne.personnel ?? '1 ligne' : 'aucune'} />
      <BarreOutilsFlottante cle="projet-travaux-chantier" ligneSelectionnee={!!ligne} actions={actions}
        nouveau={{ libelle: 'Nouveau jour travaillé', onClick: ajouter }} />
      {idOuvert && (
        <JourTravailleDetail
          key={idOuvert}
          id={idOuvert}
          voisins={voisins}
          onFermer={() => void navigate(RACINE)}
          onCree={(id) => void navigate(`${RACINE}/${id}`)}
        />
      )}
    </PageListe>
  );
}
