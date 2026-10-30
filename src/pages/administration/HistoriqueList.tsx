import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import Pagination from '../../components/Pagination';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ApiError } from '../../lib/api';
import { listHistorique, listUtilisateursHistorique } from '../../lib/apiHistorique';
import { formatDateTime, jourISO, pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { ActionHistorique, LigneHistoriqueDto } from '../../types/historique';

const CHEMIN_EXPORT = '/api/administration/historique/export';
const TAILLE_PAGE = 50;
const JOURS_PAR_DEFAUT = 30;
const TOUS = 'tous';
const MESSAGE_ACCES_REFUSE = "Vous n'avez pas accès à l'historique.";

const LIBELLES_ACTION: Record<ActionHistorique, string> = { Added: 'Ajout', Modified: 'Modification', Deleted: 'Suppression' };
const libelleAction = (action: ActionHistorique) => LIBELLES_ACTION[action];
const ITEMS_ACTION = [
  { label: 'Toutes', value: TOUS },
  ...Object.entries(LIBELLES_ACTION).map(([value, label]) => ({ label, value })),
];

const COLONNES: ColonneGrille<LigneHistoriqueDto>[] = [
  { nom: 'dateAction', libelle: "Date d'action", largeur: 8, valeur: (l) => formatDateTime(l.dateAction), rendu: (l) => formatDateTime(l.dateAction) },
  { nom: 'utilisateur', libelle: 'Utilisateur', largeur: 10 },
  { nom: 'entite', libelle: 'Entité', largeur: 12 },
  { nom: 'libelleEntite', libelle: 'Libellé entité', largeur: 16 },
  { nom: 'action', libelle: 'Action', largeur: 7, valeur: (l) => libelleAction(l.action), rendu: (l) => libelleAction(l.action) },
  { nom: 'objetId', libelle: "Id de l'objet", largeur: 14, classe: 'font-mono' },
];

function periodeParDefaut() {
  const aujourdhui = new Date();
  const debut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() - JOURS_PAR_DEFAUT);
  return { debut: jourISO(debut), fin: jourISO(aujourdhui) };
}

/** `useApi` perd le statut : le 403 reçoit un texte fixe que l'écran reconnaît. */
async function lire<T>(appel: () => Promise<T>): Promise<T> {
  try {
    return await appel();
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) throw new Error(MESSAGE_ACCES_REFUSE, { cause: err });
    throw err;
  }
}

function ChoixFiltre({ libelle, items, valeur, onChange, className }: Readonly<{
  libelle: string;
  items: { label: string; value: string }[];
  valeur: string;
  onChange: (valeur: string) => void;
  className?: string;
}>) {
  return (
    <span className="flex items-center gap-1.5 text-body text-muted-foreground">
      {libelle}
      <Select items={items} value={valeur} onValueChange={(v) => onChange(v as string)}>
        <SelectTrigger aria-label={libelle} className={className}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </span>
  );
}

export default function HistoriqueList() {
  const [defaut] = useState(periodeParDefaut);
  const [debut, setDebut] = useState(defaut.debut);
  const [fin, setFin] = useState(defaut.fin);
  const [recherche, setRecherche] = useState('');
  const [utilisateur, setUtilisateur] = useState(TOUS);
  const [action, setAction] = useState(TOUS);
  const [page, setPage] = useState(0);
  const texte = useDebouncedValue(recherche.trim());

  const filtres = useMemo(
    () => ({
      dateDebut: debut || undefined,
      dateFin: fin || undefined,
      texte: texte || undefined,
      utilisateur: utilisateur === TOUS ? undefined : utilisateur,
      action: action === TOUS ? undefined : (action as ActionHistorique),
    }),
    [debut, fin, texte, utilisateur, action],
  );
  const liste = useApi(() => lire(() => listHistorique({ ...filtres, page, size: TAILLE_PAGE })), [filtres, page], 'admin-historique');
  const utilisateurs = useApi(() => listUtilisateursHistorique(filtres.dateDebut, filtres.dateFin), [debut, fin], 'admin-historique-utilisateurs');
  const itemsUtilisateur = [{ label: 'Tous', value: TOUS }, ...(utilisateurs.data ?? []).map((u) => ({ label: u, value: u }))];

  const refuse = liste.error === MESSAGE_ACCES_REFUSE;
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('admin-historique'));
  const exportListe = useExportListe(CHEMIN_EXPORT, filtres, 'historique');
  const decompte = liste.data ? pluriel(liste.data.totalElements, 'action') : undefined;

  function filtrer(modifier: () => void) {
    modifier();
    setPage(0);
  }
  function changerDebut(valeur: string) {
    if (fin && valeur > fin) return;
    filtrer(() => setDebut(valeur));
  }
  function changerFin(valeur: string) {
    if (debut && valeur < debut) return;
    filtrer(() => setFin(valeur));
  }
  function reinitialiser() {
    filtrer(() => {
      setDebut(defaut.debut);
      setFin(defaut.fin);
      setRecherche('');
      setUtilisateur(TOUS);
      setAction(TOUS);
    });
  }

  const puces = [
    ...(recherche ? [`« ${recherche} »`] : []),
    ...(utilisateur === TOUS ? [] : [utilisateur]),
    ...(action === TOUS ? [] : [libelleAction(action as ActionHistorique)]),
  ];

  return (
    <PageListe titre="Historique">
      <EnteteListe titre="Historique" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        recherche={{ valeur: recherche, onChange: (v) => filtrer(() => setRecherche(v)), placeholder: 'Entité ou libellé' }}
        onReinitialiser={reinitialiser}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-body text-muted-foreground">
            du
            <Input type="date" aria-label="Du" className="w-32.5" value={debut} max={fin || undefined} onChange={(e) => changerDebut(e.target.value)} />
          </span>
          <span className="flex items-center gap-1.5 text-body text-muted-foreground">
            au
            <Input type="date" aria-label="Au" className="w-32.5" value={fin} min={debut || undefined} onChange={(e) => changerFin(e.target.value)} />
          </span>
          <ChoixFiltre libelle="Utilisateur" items={itemsUtilisateur} valeur={utilisateur} onChange={(v) => filtrer(() => setUtilisateur(v))} className="w-48" />
          <ChoixFiltre libelle="Action" items={ITEMS_ACTION} valeur={action} onChange={(v) => filtrer(() => setAction(v))} className="w-40" />
        </div>
      </PanneauFiltresCoches>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {liste.loading && !liste.data && !liste.error && <LoadingState />}
        {liste.error && refuse && <EmptyState title="Accès refusé" message={MESSAGE_ACCES_REFUSE} />}
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
              {liste.data.content.length === 0 ? (
                <EmptyState title="Aucune action sur la période." />
              ) : (
                <DataGrid cleOrdre="admin-historique" rows={liste.data.content} colonnes={COLONNES} bandeauRegroupement={false} />
              )}
            </div>
            <Pagination page={liste.data.page} totalPages={liste.data.totalPages} totalElements={liste.data.totalElements} onPageChange={setPage} />
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle="admin-historique"
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: () => void liste.refetch() },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: refuse || exportListe.enCours },
        ]}
      />
    </PageListe>
  );
}
