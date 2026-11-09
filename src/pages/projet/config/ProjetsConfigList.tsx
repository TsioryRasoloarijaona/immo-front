import { useMemo, useState } from 'react';
import { HardHat, Pencil, Plus, Trash2 } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../../components/DataGrid';
import PageShell from '../../../components/PageShell';
import BadgeExercice from '../../../components/projet/BadgeExercice';
import DialogueProjetConfig from '../../../components/projet/DialogueProjetConfig';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { oublierLecturesRecentes } from '../../../lib/api';
import { deleteProjetConfig, listProjetsConfig } from '../../../lib/apiProjetConfig';
import { useConfirm } from '../../../lib/confirmContext';
import { pluriel } from '../../../lib/format';
import { useToast } from '../../../lib/toastContext';
import { useApi } from '../../../lib/useApi';
import type { ProjetConfigDto } from '../../../types/projetConfig';

/** Liste des projets, Administrateur seul : le serveur répond 403 aux autres (message affiché). */
export default function ProjetsConfigList() {
  const confirm = useConfirm();
  const toast = useToast();
  const [dialogue, setDialogue] = useState<ProjetConfigDto | 'creation' | null>(null);
  const { data, loading, error, refetch } = useApi(listProjetsConfig, []);

  async function supprimer(p: ProjetConfigDto) {
    const ok = await confirm({
      title: 'Supprimer le projet ?',
      message: `Le projet « ${p.code ?? ''} » sera supprimé. Le serveur refuse s'il est utilisé ailleurs.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    try {
      await deleteProjetConfig(p.id);
      toast('Projet supprimé.');
    } catch (err) {
      oublierLecturesRecentes();
      toast({ texte: err instanceof Error ? err.message : 'Échec de la suppression.', variante: 'erreur' });
    }
    await refetch();
  }

  const colonnes = useMemo<ColonneGrille<ProjetConfigDto>[]>(() => [
    { nom: 'code', libelle: 'Code', largeur: 8 },
    {
      nom: 'description', libelle: 'Description', largeur: 18,
      valeur: (p) => `${p.description ?? ''}${p.anneeSociete ? ' Exercice' : ''}`,
      rendu: (p) => <span className="flex items-center gap-2">{p.description}{p.anneeSociete && <BadgeExercice />}</span>,
    },
    { nom: 'societeCode', libelle: 'Société', largeur: 10 },
    { nom: 'statutCode', libelle: 'Statut', largeur: 8 },
    { nom: 'gestionnaireNom', libelle: 'Gestionnaire', largeur: 12 },
    { nom: 'nbLots', libelle: 'Lots', type: 'NOMBRE', largeur: 6 },
    { nom: 'nbPiecesAchat', libelle: "Pièces d'achat", type: 'NOMBRE', largeur: 8 },
    {
      nom: 'actions', libelle: 'Actions', largeur: 8, sansSomme: true,
      rendu: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Modifier le projet" title="Modifier" onClick={() => setDialogue(p)}><Pencil /></Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Supprimer le projet" title="Supprimer" onClick={() => void supprimer(p)}><Trash2 /></Button>
        </div>
      ),
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- supprimer ne dépend que de confirm/toast/refetch stables
  ], []);

  const creer = (
    <Button type="button" size="sm" onClick={() => setDialogue('creation')}><Plus data-icon="inline-start" /> Créer un projet</Button>
  );

  return (
    <PageShell title="Projets" icon={<HardHat />} fullHeight actions={creer}
      crumbs={[{ label: 'Projet' }, { label: 'Configuration' }, { label: 'Projets' }]}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (
        <ResultsRegion loading={loading}>
          <div className="shrink-0 text-body text-muted-foreground">{pluriel(data.length, 'projet')}</div>
          {data.length === 0 ? (
            <EmptyState title="Aucun projet" message="Aucun projet n'est configuré." />
          ) : (
            <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
              <DataGrid cleOrdre="projet-config-projets" rows={data} colonnes={colonnes} />
            </div>
          )}
        </ResultsRegion>
      )}
      {dialogue && (
        <DialogueProjetConfig projet={dialogue === 'creation' ? undefined : dialogue} onClose={() => setDialogue(null)}
          onSaved={() => { setDialogue(null); toast('Enregistré.'); oublierLecturesRecentes(); void refetch(); }} />
      )}
    </PageShell>
  );
}
