import { FolderPlus, ListOrdered, Plus, Save, Tags, Trash2, Undo2 } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import { Button, buttonVariants } from '../../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import type { ReferentielItemDto } from '../../../types';

export interface ActionsBarre {
  onAjouterLigne: () => void;
  onAjouterGroupe: () => void;
  onSupprimer: () => void;
  onRegenerer: () => void;
  onCategorie: (categorieId: string) => void;
  onEnregistrer: () => void;
  onAnnuler: () => void;
}

/** Outils d'édition du bordereau : icônes seules, le libellé passe en infobulle. */
export default function BarreEditionBordereau({
  actions,
  categories,
  groupeSelectionne,
  refusSuppression,
  enCours,
}: Readonly<{
  actions: ActionsBarre;
  categories: ReferentielItemDto[];
  groupeSelectionne: boolean;
  refusSuppression: string | null;
  enCours: boolean;
}>) {
  return (
    <BarreIcones className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="sm" onClick={actions.onAjouterLigne}>
        <Plus /> Ajouter une ligne
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={actions.onAjouterGroupe}>
        <FolderPlus /> Ajouter un groupe
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={refusSuppression !== null} title={refusSuppression ?? undefined} onClick={actions.onSupprimer}>
        <Trash2 /> Supprimer
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={actions.onRegenerer}>
        <ListOrdered /> Régénérer les codes
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger disabled={!groupeSelectionne} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <Tags /> Appliquer une catégorie au groupe
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {categories.map((c) => (
            <DropdownMenuItem key={c.id} onClick={() => actions.onCategorie(c.id)}>
              {c.description ?? c.code}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={actions.onEnregistrer}>
        <Save /> Enregistrer
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={actions.onAnnuler}>
        <Undo2 /> Annuler
      </Button>
    </BarreIcones>
  );
}
