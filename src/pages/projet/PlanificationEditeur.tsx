import { useState } from 'react';
import {
  ArrowDown, ArrowUp, CalendarDays, ChartGantt, History, IndentDecrease, IndentIncrease, ListPlus, Pencil, Plus, Save, Trash2, Users, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import BarreIcones from '../../components/BarreIcones';
import PageShell from '../../components/PageShell';
import DialogueIntervenants from '../../components/projet/planification/DialogueIntervenants';
import { DialogueDateDebut, DialogueVersions } from '../../components/projet/planification/DialoguesPlanification';
import FicheTache from '../../components/projet/planification/FicheTache';
import GanttSvg from '../../components/projet/planification/GanttSvg';
import TableTaches from '../../components/projet/planification/TableTaches';
import { ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { ApiError, oublierLecturesRecentes } from '../../lib/api';
import {
  creerTachePlanification, getPlanification, modifierTachePlanification, ordonnerTachesPlanification,
  sauvegarderVersionPlanification, supprimerTachePlanification,
} from '../../lib/apiPlanification';
import { useConfirm } from '../../lib/confirmContext';
import { nouveauParent, ordreApresDecalage, ordreArbre } from '../../lib/planification';
import { useToast } from '../../lib/toastContext';
import { errorMessage, useApi } from '../../lib/useApi';
import type { PlanificationDetailDto } from '../../types/planification';

const ZOOMS = [2, 4, 8, 16, 32];
type Dialogue = 'tache' | 'intervenants' | 'date' | 'versions';

/** Éditeur Gantt d'une planification (modèle, projet ou version en lecture seule). */
export default function PlanificationEditeur() {
  const { id } = useParams();
  return <Editeur key={id} id={id ?? ''} />;
}

function Editeur({ id }: Readonly<{ id: string }>) {
  const api = useApi(() => getPlanification(id), [id]);
  const confirm = useConfirm();
  const toast = useToast();
  const [maj, setMaj] = useState<PlanificationDetailDto | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [zoom, setZoom] = useState(2);
  const [dialogue, setDialogue] = useState<Dialogue | null>(null);
  const [interdit, setInterdit] = useState(false);

  const detail = maj ?? api.data;
  const lectureSeule = detail?.nature === 'VERSION' || interdit;
  const lignes = detail ? ordreArbre(detail.taches) : [];
  const tache = detail?.taches.find((t) => t.id === selection) ?? null;

  async function ecrire(action: () => Promise<PlanificationDetailDto>) {
    try {
      setMaj(await action());
      oublierLecturesRecentes();
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
      if (err instanceof ApiError && err.status === 403) setInterdit(true);
    }
  }

  async function sauvegarderVersion() {
    try {
      const res = await sauvegarderVersionPlanification(id);
      oublierLecturesRecentes();
      toast(res.message);
      void api.refetch();
      setMaj(null);
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
      if (err instanceof ApiError && err.status === 403) setInterdit(true);
    }
  }

  async function supprimer() {
    if (!tache) return;
    const ok = await confirm({ title: 'Supprimer la tâche ?', message: `« ${tache.code} » et ses sous-tâches seront supprimées.`, confirmLabel: 'Supprimer' });
    if (!ok) return;
    setSelection(null);
    await ecrire(() => supprimerTachePlanification(id, tache.id));
  }

  const decalage = detail && tache ? nouveauParent(detail.taches, tache, true) : null;
  const remontee = detail && tache ? nouveauParent(detail.taches, tache, false) : null;
  const haut = detail && tache ? ordreApresDecalage(detail.taches, tache, -1) : null;
  const bas = detail && tache ? ordreApresDecalage(detail.taches, tache, 1) : null;
  const deplacer = (corps: NonNullable<typeof decalage>) => tache && ecrire(() => modifierTachePlanification(id, tache.id, corps));

  const btn = (libelle: string, icone: React.ReactNode, onClick: () => void, desactive = false) => (
    <Button type="button" variant="ghost" size="sm" disabled={desactive} onClick={onClick}>{icone} {libelle}</Button>
  );

  return (
    <PageShell title={detail ? `Planification ${detail.code}` : 'Planification'} icon={<ChartGantt />}
      crumbs={[{ label: 'Projet' }, { label: 'Planification' }, { label: detail?.code ?? '…' }]}
      actions={detail && (
        <BarreIcones className="flex flex-wrap items-center gap-1">
          {!lectureSeule && btn('Ajouter une tâche racine', <Plus />, () => void ecrire(() => creerTachePlanification(id, { racine: true })))}
          {!lectureSeule && btn('Ajouter une sous-tâche', <ListPlus />, () => tache && void ecrire(() => creerTachePlanification(id, { parentId: tache.id })), !tache)}
          {!lectureSeule && btn('Supprimer la tâche', <Trash2 />, () => void supprimer(), !tache)}
          {!lectureSeule && btn('Mettre en retrait', <IndentIncrease />, () => decalage && void deplacer(decalage), !decalage)}
          {!lectureSeule && btn('Remonter d\'un niveau', <IndentDecrease />, () => remontee && void deplacer(remontee), !remontee)}
          {!lectureSeule && btn('Monter', <ArrowUp />, () => haut && void ecrire(() => ordonnerTachesPlanification(id, haut)), !haut)}
          {!lectureSeule && btn('Descendre', <ArrowDown />, () => bas && void ecrire(() => ordonnerTachesPlanification(id, bas)), !bas)}
          {btn('Détails de la tâche', <Pencil />, () => setDialogue('tache'), !tache)}
          {btn('Intervenants', <Users />, () => setDialogue('intervenants'))}
          {!lectureSeule && btn('Modifier la date de début', <CalendarDays />, () => setDialogue('date'))}
          {!lectureSeule && detail.nature === 'PROJET' && btn('Sauvegarder une version', <Save />, () => void sauvegarderVersion())}
          {btn('Versions', <History />, () => setDialogue('versions'))}
          {btn('Zoom avant', <ZoomIn />, () => setZoom(zoom + 1), zoom >= ZOOMS.length - 1)}
          {btn('Zoom arrière', <ZoomOut />, () => setZoom(zoom - 1), zoom <= 0)}
        </BarreIcones>
      )}>
      <div className="flex flex-col gap-3 p-4 md:px-7">
        {api.loading && !detail && <LoadingState />}
        {api.error && !detail && <ErrorState message={api.error} />}
        {detail?.nature === 'VERSION' && <p className="text-body text-muted-foreground">Version sauvegardée du {detail.dateVersion ?? ''} : lecture seule.</p>}
        {detail && (
          <div className="flex overflow-auto rounded-xl border border-border bg-card">
            <div className="shrink-0">
              <TableTaches detail={detail} lignes={lignes} selection={selection} onSelect={setSelection} onOuvrir={(t) => { setSelection(t); setDialogue('tache'); }} />
            </div>
            <GanttSvg lignes={lignes} pxParJour={ZOOMS[zoom]} selection={selection} onSelect={setSelection} onOuvrir={(t) => { setSelection(t); setDialogue('tache'); }} />
          </div>
        )}
        {detail && lignes.length === 0 && <p className="text-body text-muted-foreground">Aucune tâche.</p>}
      </div>
      {detail && dialogue === 'tache' && tache && (
        <FicheTache key={tache.id} planification={detail} tache={tache} lectureSeule={lectureSeule} onClose={() => setDialogue(null)}
          onEnregistre={(d) => { setMaj(d); setDialogue(null); }} />
      )}
      {detail && dialogue === 'intervenants' && (
        <DialogueIntervenants detail={detail} lectureSeule={lectureSeule} onClose={() => setDialogue(null)} onChange={setMaj} />
      )}
      {detail && dialogue === 'date' && <DialogueDateDebut detail={detail} onClose={() => setDialogue(null)} onChange={setMaj} />}
      {detail && dialogue === 'versions' && <DialogueVersions planificationId={detail.id} onClose={() => setDialogue(null)} />}
    </PageShell>
  );
}
