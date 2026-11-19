import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, CircleDashed, Clock, Hammer, RotateCcw, XCircle } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante, { type ActionOutil } from '../../components/liste/BarreOutilsFlottante';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { ApiError, triggerBlobDownload } from '../../lib/api';
import { getReferentielsModifications, listModificationsProjet } from '../../lib/apiTravauxChantier';
import { voisinsDe } from '../../lib/fenetreFiche';
import { formatDate, pluriel, todayISO } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { referentielItems } from '../../lib/referentiels';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { EtatModification } from '../../types/dossierSousListes';
import type { FiltresModifications, ModificationProjetLigneDto } from '../../types/travauxChantier';
import ModificationProjetDetail from './ModificationProjetDetail';

const RACINE = '/projet/modifications';
const ACCES_REFUSE = "Vous n'avez pas accès aux modifications de projet.";
const ETATS_PAR_DEFAUT: string[] = ['ENCOURS', 'ACCEPTEE'];

const GLYPHES: Record<string, { Icone: typeof Clock; classe: string }> = {
  ENCOURS: { Icone: Clock, classe: 'text-amber-600' },
  REFUSE_PAR_LE_SERVICE_TECHNIQUE: { Icone: XCircle, classe: 'text-destructive' },
  REFUSE_PAR_LE_CLIENT: { Icone: XCircle, classe: 'text-destructive' },
  ACCEPTEE: { Icone: CheckCircle2, classe: 'text-emerald-600' },
  REALISED: { Icone: Hammer, classe: 'text-sky-600' },
};

function Statut({ ligne }: Readonly<{ ligne: ModificationProjetLigneDto }>) {
  const { Icone, classe } = GLYPHES[ligne.etat?.code ?? ''] ?? { Icone: CircleDashed, classe: 'text-muted-foreground' };
  return <Icone aria-label={ligne.etat?.libelle ?? 'Sans état'} className={`size-3.5 ${classe}`} />;
}

const COLONNES: ColonneGrille<ModificationProjetLigneDto>[] = [
  { nom: 'etat', libelle: 'Statut', largeur: 3, rendu: (r) => <Statut ligne={r} />, valeur: (r) => r.etat?.libelle ?? '', titre: (r) => r.etat?.libelle },
  { nom: 'dateDemande', libelle: 'Date de la demande', type: 'DATE', largeur: 5 },
  { nom: 'projet', libelle: 'Projet', largeur: 8, classe: 'font-medium text-foreground' },
  { nom: 'code', libelle: 'Code', largeur: 6 },
  { nom: 'bloc', libelle: 'Blok', largeur: 5 },
  { nom: 'etage', libelle: 'Etage', type: 'NOMBRE', largeur: 4 },
  { nom: 'description', libelle: 'Description', largeur: 14 },
  { nom: 'acquereur', libelle: 'Acquéreur', largeur: 10 },
  { nom: 'telephone', libelle: 'Téléphone', largeur: 6 },
  { nom: 'notes', libelle: 'Notes', largeur: 12 },
];

/** `useApi` ne garde que le message : le 403 reçoit un texte fixe que la liste reconnaît. */
async function lireModifications(filtres: FiltresModifications) {
  try {
    return await listModificationsProjet(filtres);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) throw new Error(ACCES_REFUSE, { cause: err });
    throw err;
  }
}

function exporterCsv(lignes: ModificationProjetLigneDto[]): void {
  const cellule = (v: string | number | null) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const entetes = COLONNES.map((c) => c.libelle);
  const corps = lignes.map((r) => [r.etat?.libelle ?? '', formatDate(r.dateDemande), r.projet, r.code, r.bloc, r.etage, r.description, r.acquereur, r.telephone, r.notes]);
  const csv = [entetes, ...corps].map((l) => l.map(cellule).join(';')).join('\r\n');
  triggerBlobDownload(new Blob([String.fromCodePoint(0xfeff), csv], { type: 'text/csv;charset=utf-8' }), `modifications_${todayISO()}.csv`);
}

export default function ModificationsProjetList() {
  const navigate = useNavigate();
  const { id: idOuvert } = useParams();
  const referentiels = useApi(() => getReferentielsModifications(), [], 'modifications-referentiels');
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('projet-modifications'));
  const [trancheId, setTrancheId] = useState<string | null>(null);
  const [etats, setEtats] = useState<string[]>(ETATS_PAR_DEFAUT);
  const [periode, setPeriode] = useState({ debut: '', fin: '' });
  const [recherche, setRecherche] = useState('');
  const q = useDebouncedValue(recherche.trim());
  const [selectionne, setSelectionne] = useState<string | null>(null);

  const trancheItems = referentielItems(referentiels.data?.tranches ?? []);
  const etatItems = (referentiels.data?.etats ?? []).map((e) => ({ value: e.code, label: e.libelle }));
  const filtres: FiltresModifications = {
    trancheId: trancheId ?? undefined,
    etats: etats.length > 0 ? (etats as EtatModification[]) : undefined,
    du: periode.debut || undefined,
    au: periode.fin || undefined,
    recherche: q || undefined,
  };
  const cle = JSON.stringify(filtres);
  const liste = useApi(() => lireModifications(filtres), [cle]);
  const refuse = liste.error === ACCES_REFUSE;
  const lignes = liste.data ?? [];
  const ligne = lignes.find((r) => r.id === selectionne);
  const decompte = liste.data ? pluriel(liste.data.length, 'modification') : undefined;
  const ouvrir = (id: string) => void navigate(`${RACINE}/${id}`);
  const voisins = voisinsDe(lignes.map((l) => l.id), idOuvert, ouvrir);
  const puces = [
    ...puceUnique(trancheItems, trancheId),
    ...puceSelection('État', etatItems, etats),
    ...(recherche ? [`« ${recherche} »`] : []),
  ];

  function reinitialiser() {
    setTrancheId(null);
    setEtats(ETATS_PAR_DEFAUT);
    setPeriode({ debut: '', fin: '' });
    setRecherche('');
  }

  const actions: ActionOutil[] = [
    { id: 'modifier', onClick: () => { if (ligne) ouvrir(ligne.id); } },
    { id: 'rafraichir', onClick: () => void liste.refetch() },
    { id: 'exporter', onClick: () => exporterCsv(lignes), disabled: lignes.length === 0 },
  ];

  return (
    <PageListe titre="Modifications">
      <EnteteListe titre="Modifications" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        periode={{ debut: periode.debut, fin: periode.fin, onChange: (debut, fin) => setPeriode({ debut, fin }) }}
        recherche={{ valeur: recherche, onChange: setRecherche, placeholder: 'Description, code, acquéreur…' }}
        onReinitialiser={reinitialiser}
      >
        <BoiteFiltre titre="Projet - Période" mode="unique" items={trancheItems} valeur={trancheId} onChange={setTrancheId} />
        <BoiteFiltre titre="État" mode="multiple" coches items={etatItems} valeur={etats} onChange={setEtats} />
      </PanneauFiltresCoches>
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {liste.loading && !liste.data && !liste.error && <LoadingState />}
        {refuse && <EmptyState title="Accès refusé" message={ACCES_REFUSE} />}
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
                <EmptyState title="Aucune modification" />
              ) : (
                <DataGrid
                  cleOrdre="projet-modifications"
                  rows={lignes}
                  colonnes={COLONNES}
                  onOuvrir={ouvrir}
                  libelleLigne={(r) => `Ouvrir la modification ${r.code ?? ''}`}
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
      <BarreEtatListe lignes={decompte ?? '—'} selection={ligne ? ligne.code ?? '1 ligne' : 'aucune'} />
      <BarreOutilsFlottante cle="projet-modifications" ligneSelectionnee={!!ligne} actions={actions} />
      {idOuvert && (
        <ModificationProjetDetail
          key={idOuvert}
          id={idOuvert}
          voisins={voisins}
          onFermer={() => void navigate(RACINE)}
        />
      )}
    </PageListe>
  );
}
