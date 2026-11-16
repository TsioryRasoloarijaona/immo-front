import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import DataGrid, { type ColonneGrille } from '../DataGrid';
import { Button } from '../ui/button';
import { EmptyState } from '../ui';
import DialogueTransitionLot from './DialogueTransitionLot';
import { oublierLecturesRecentes } from '../../lib/api';
import { deleteTransitionLot } from '../../lib/apiProjetConfig';
import { useConfirm } from '../../lib/confirmContext';
import { useToast } from '../../lib/toastContext';
import { errorMessage } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { TransitionStatutLotDto } from '../../types/projetConfig';

const COLONNES: ColonneGrille<TransitionStatutLotDto>[] = [
  { nom: 'ordre', libelle: 'O.D.T.', type: 'NOMBRE', largeur: 5 },
  { nom: 'code', libelle: 'Code', largeur: 12 },
  { nom: 'description', libelle: 'Description', largeur: 22 },
  { nom: 'statutDepartCode', libelle: 'De', largeur: 12 },
  { nom: 'statutArriveeCode', libelle: 'À', largeur: 12 },
  { nom: 'avecCommentaire', libelle: 'Commentaire', type: 'BOOLEEN', largeur: 7 },
  { nom: 'avecMotDePasse', libelle: 'Mot de passe', type: 'BOOLEEN', largeur: 7 },
  { nom: 'transitionAutomatique', libelle: 'Automatique', type: 'BOOLEEN', largeur: 7 },
  { nom: 'roles', libelle: 'Rôles', largeur: 18, valeur: (t) => t.roles.map((r) => r.code).join(', ') },
];

/** Transitions de lot d'un genre : ajout, modification, suppression (droit MarketWorkFlowList, 403 / 409 affichés). */
export default function TableauxTransitionsLot({ genreId, genreLibelle, lignes, onChange }: Readonly<{
  genreId: UUID;
  genreLibelle: string;
  lignes: TransitionStatutLotDto[];
  onChange: () => void;
}>) {
  const confirm = useConfirm();
  const toast = useToast();
  const [edition, setEdition] = useState<TransitionStatutLotDto | 'ajout' | null>(null);
  const triees = [...lignes].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  async function supprimer(t: TransitionStatutLotDto) {
    const ok = await confirm({ title: 'Supprimer la transition ?', message: `« ${t.description ?? t.code ?? ''} » sera supprimée.`, confirmLabel: 'Supprimer' });
    if (!ok) return;
    try {
      await deleteTransitionLot(t.id);
      toast('Transition supprimée.');
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
    oublierLecturesRecentes();
    onChange();
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-label font-medium text-foreground">{genreLibelle}</h2>
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setEdition('ajout')}><Plus /> Ajouter une transition</Button>
        </BarreIcones>
      </div>
      {triees.length === 0 && <EmptyState title="Aucune transition" />}
      {triees.length > 0 && (
        <div className="overflow-auto rounded-xl border border-border bg-card">
          <DataGrid cleOrdre={`projet-config-transitions-lot-${genreId}`} rows={triees} colonnes={COLONNES}
            libelleLigne={(t) => t.description ?? t.code ?? ''}
            actions={(t) => (
              <BarreIcones className="flex items-center justify-center gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEdition(t)}><Pencil /> Modifier</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void supprimer(t)}><Trash2 /> Supprimer</Button>
              </BarreIcones>
            )} />
        </div>
      )}
      {edition && (
        <DialogueTransitionLot key={edition === 'ajout' ? 'ajout' : edition.id} transition={edition === 'ajout' ? null : edition}
          genreId={genreId} genreLibelle={genreLibelle} ordreDefaut={lignes.length + 1}
          onClose={() => setEdition(null)} onEnregistre={() => { setEdition(null); onChange(); }} />
      )}
    </section>
  );
}
