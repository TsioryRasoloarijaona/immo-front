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
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ApiError } from '../../lib/api';
import { getReferentielsAchat } from '../../lib/apiAchat';
import { listStatutsAchat } from '../../lib/apiAchatConfig';
import { cheminExportDemandesAchat, getDemandesAchat, supprimerDemandeAchat } from '../../lib/apiDemandesAchat';
import { listLignesReferentiel } from '../../lib/apiReferentielsAdmin';
import { useConfirm } from '../../lib/confirmContext';
import { voisinsDe } from '../../lib/fenetreFiche';
import { pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { useToast } from '../../lib/toastContext';
import { useExportListe } from '../../lib/useExportListe';
import { errorMessage, refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import type { DemandeAchatLigne, FiltresDemandesAchat } from '../../types/demandesAchat';
import DemandeAchatFiche from './DemandeAchatFiche';

const RACINE = '/achat/demandes-achat';
const SANS_PROJET = '__sans_projet__';
const ACCES_REFUSE = "Vous n'avez pas accès aux demandes d'achat.";
const MESSAGE_SUPPRESSION = 'Voulez-vous vraiment supprimer cet enregistrement ?';

const CHAMPS_DATE = [
  { value: 'DocDate', label: 'Date du document' },
  { value: 'LaunchOfTenderDate', label: "Lancement de l'appel d'offres" },
  { value: 'WithdrawalTenderDocumentsDate', label: 'Retrait des dossiers' },
  { value: 'TenderMaturityDate', label: "Échéance de l'appel d'offres" },
  { value: 'TendersResortDate', label: 'Remise des offres' },
  { value: 'BidOpeningDate', label: 'Ouverture des plis' },
  { value: 'TendersReportDate', label: 'Rapport des offres' },
  { value: 'TenderDate', label: "Date de l'offre" },
  { value: 'ContractSignatureDate', label: 'Signature du contrat' },
  { value: 'ServiceOrderDate', label: 'Ordre de service' },
  { value: 'WorkLaunchDate', label: 'Début des travaux' },
  { value: 'WorkCompletionDate', label: 'Fin des travaux' },
  { value: 'ReattachmentDate', label: 'Rattachement' },
  { value: 'CancellationDate', label: 'Annulation' },
];

const COLONNES: ColonneGrille<DemandeAchatLigne>[] = [
  { nom: 'procedure', libelle: 'Procédure', largeur: 8 },
  {
    nom: 'statut', libelle: 'Statut', largeur: 8,
    valeur: (d) => d.statut?.libelle ?? '',
    rendu: (d) => (
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full border border-border" style={{ backgroundColor: d.statut?.couleur ?? 'transparent' }} />
        {d.statut?.libelle ?? '—'}
      </span>
    ),
  },
  { nom: 'code', libelle: 'Code', largeur: 6, classe: 'font-medium text-foreground' },
  { nom: 'date', libelle: 'Date', type: 'DATE', largeur: 5 },
  { nom: 'description', libelle: 'Description', largeur: 14 },
  { nom: 'entite', libelle: 'Entité', largeur: 8 },
  { nom: 'module', libelle: 'Module', largeur: 6 },
  { nom: 'fournisseur', libelle: 'Fournisseur', largeur: 8 },
  { nom: 'categorie', libelle: 'Catégorie', largeur: 8 },
  { nom: 'declencheur', libelle: 'Déclencheur', largeur: 8 },
  { nom: 'notes', libelle: 'Notes', largeur: 12 },
];

async function lire<T>(appel: () => Promise<T>): Promise<T> {
  try {
    return await appel();
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) throw new Error(ACCES_REFUSE, { cause: err });
    throw err;
  }
}

function nombreOuNul(texte: string): number | undefined {
  const n = Number(texte.replace(',', '.'));
  return texte.trim() === '' || Number.isNaN(n) ? undefined : n;
}

function texteLigne(valeur: unknown): string {
  return typeof valeur === 'string' || typeof valeur === 'number' ? String(valeur) : '—';
}

export default function DemandesAchatList() {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const showToast = useToast();
  const { id: idOuvert } = useParams();
  const referentiels = useApi(() => getReferentielsAchat(), [], 'achat-referentiels');
  const procedures = useApi(() => listLignesReferentiel('procedures-achat'), [], 'achat-procedures');
  const statuts = useApi(() => listStatutsAchat(), [], 'achat-statuts-config');
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('achat-demandes'));
  const [societeId, setSocieteId] = useState<string | null>(null);
  const [projets, setProjets] = useState<string[]>([]);
  const [procedureId, setProcedureId] = useState<string | null>(null);
  const [statutIds, setStatutIds] = useState<string[]>([]);
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [champDate, setChampDate] = useState('DocDate');
  const [periode, setPeriode] = useState({ debut: '', fin: '' });
  const [fournisseur, setFournisseur] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [montantMin, setMontantMin] = useState('');
  const [montantMax, setMontantMax] = useState('');
  const [recherche, setRecherche] = useState('');
  const q = useDebouncedValue(recherche.trim());
  const codeDiffere = useDebouncedValue(code.trim());
  const minDiffere = useDebouncedValue(montantMin);
  const maxDiffere = useDebouncedValue(montantMax);
  const [selectionne, setSelectionne] = useState<string | null>(null);

  const ref = referentiels.data;
  const entiteItems = (ref?.societes ?? []).map((s) => ({ value: s.id, label: s.description ?? s.code ?? '—' }));
  const projetItems = [
    { value: SANS_PROJET, label: 'Sans projet' },
    ...(ref?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—' })),
  ];
  const procedureItems = (procedures.data ?? []).flatMap((l) => (l.id ? [{ value: l.id, label: texteLigne(l.description ?? l.libelle ?? l.code) }] : []));
  const statutItems = (statuts.data ?? []).map((s) => ({ value: s.id, label: s.description ?? s.code ?? '—' }));
  const moduleItems = (ref?.modules ?? []).flatMap((m) => (m.id ? [{ value: m.id, label: m.libelle }] : []));
  const fournisseurItems = (ref?.fournisseurs ?? []).flatMap((f) => (f.nom ? [{ value: f.nom, label: f.nom }] : []));

  const projetIds = projets.filter((p) => p !== SANS_PROJET);
  const filtres: FiltresDemandesAchat = {
    societeIds: societeId ? [societeId] : undefined,
    projetIds: projetIds.length > 0 ? projetIds : undefined,
    sansProjet: projets.includes(SANS_PROJET) || undefined,
    procedureId: procedureId ?? undefined,
    statutIds: statutIds.length > 0 ? statutIds : undefined,
    moduleId: moduleId ?? undefined,
    champDate: periode.debut || periode.fin ? champDate : undefined,
    du: periode.debut || undefined,
    au: periode.fin || undefined,
    fournisseur: fournisseur ?? undefined,
    code: codeDiffere || undefined,
    montantMin: nombreOuNul(minDiffere),
    montantMax: nombreOuNul(maxDiffere),
    recherche: q || undefined,
  };
  const cle = JSON.stringify(filtres);
  const liste = useApi(() => lire(() => getDemandesAchat(filtres)), [cle]);
  const { exporter } = useExportListe(cheminExportDemandesAchat(), { ...filtres }, 'demandes-achat');
  const refuse = liste.error === ACCES_REFUSE;
  const lignes = liste.data ?? [];
  const ligne = lignes.find((d) => d.id === selectionne);
  const decompte = liste.data ? pluriel(liste.data.length, 'demande') : undefined;
  const ouvrir = (id: string) => void navigate(`${RACINE}/${id}`);
  const voisins = voisinsDe(lignes.map((l) => l.id), idOuvert, ouvrir);
  const puces = [
    ...puceUnique(entiteItems, societeId),
    ...puceSelection('Projet', projetItems, projets),
    ...puceUnique(procedureItems, procedureId),
    ...puceSelection('Statut', statutItems, statutIds),
    ...puceUnique(moduleItems, moduleId),
    ...(fournisseur ? [fournisseur] : []),
    ...(code ? [`Code : ${code}`] : []),
    ...(recherche ? [`« ${recherche} »`] : []),
  ];

  function reinitialiser() {
    setSocieteId(null);
    setProjets([]);
    setProcedureId(null);
    setStatutIds([]);
    setModuleId(null);
    setChampDate('DocDate');
    setPeriode({ debut: '', fin: '' });
    setFournisseur(null);
    setCode('');
    setMontantMin('');
    setMontantMax('');
    setRecherche('');
  }

  async function supprimer() {
    if (!ligne || !(await confirmer({ title: 'Supprimer', message: MESSAGE_SUPPRESSION, confirmLabel: 'Supprimer' }))) return;
    try {
      await supprimerDemandeAchat(ligne.id);
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
    { id: 'exporter', onClick: () => void exporter(), disabled: lignes.length === 0 },
  ];

  return (
    <PageListe titre="Demandes d'achat">
      <EnteteListe titre="Demandes d'achat" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        champDate={{ items: CHAMPS_DATE, valeur: champDate, onChange: setChampDate }}
        periode={{ debut: periode.debut, fin: periode.fin, onChange: (debut, fin) => setPeriode({ debut, fin }) }}
        recherche={{ valeur: recherche, onChange: setRecherche, placeholder: 'Description, notes…' }}
        champs={(
          <>
            <Input className="w-28" placeholder="Code" aria-label="Code" value={code} onChange={(e) => setCode(e.target.value)} />
            <Input className="w-24" inputMode="decimal" placeholder="Montant min" aria-label="Montant minimum" value={montantMin} onChange={(e) => setMontantMin(e.target.value)} />
            <Input className="w-24" inputMode="decimal" placeholder="Montant max" aria-label="Montant maximum" value={montantMax} onChange={(e) => setMontantMax(e.target.value)} />
          </>
        )}
        onReinitialiser={reinitialiser}
      >
        <BoiteFiltre titre="Entité" mode="unique" items={entiteItems} valeur={societeId} onChange={setSocieteId} />
        <BoiteFiltre titre="Projet" mode="multiple" items={projetItems} valeur={projets} onChange={setProjets} />
        <BoiteFiltre titre="Procédure" mode="unique" items={procedureItems} valeur={procedureId} onChange={setProcedureId} />
        <BoiteFiltre titre="Statuts" mode="multiple" items={statutItems} valeur={statutIds} onChange={setStatutIds} />
        <BoiteFiltre titre="Module" mode="unique" items={moduleItems} valeur={moduleId} onChange={setModuleId} />
        <BoiteFiltre titre="Fournisseur" mode="unique" items={fournisseurItems} valeur={fournisseur} onChange={setFournisseur} />
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
                <EmptyState title="Aucune demande d'achat" />
              ) : (
                <DataGrid
                  cleOrdre="achat-demandes"
                  rows={lignes}
                  colonnes={COLONNES}
                  onOuvrir={ouvrir}
                  libelleLigne={(d) => `Ouvrir la demande ${d.code ?? ''}`}
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
      <BarreOutilsFlottante cle="achat-demandes" ligneSelectionnee={!!ligne} actions={actions}
        nouveau={{ libelle: "Nouvelle demande d'achat", onClick: () => ouvrir('nouveau') }} />
      {idOuvert && (
        <DemandeAchatFiche
          key={idOuvert}
          id={idOuvert}
          voisins={voisins}
          onFermer={() => void navigate(RACINE)}
          onNaviguer={ouvrir}
        />
      )}
    </PageListe>
  );
}
