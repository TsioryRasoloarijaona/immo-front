import { FilePlus, Plus, Trash2 } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import { Button } from '../ui/button';

/** Ajouter / supprimer les lignes cochées d'une grille éditable du décompte, icônes seules. */
export default function BarreExtrasDecompte({
  nbCochees,
  onAjouter,
  onAjouterBdp,
  onSupprimer,
}: Readonly<{ nbCochees: number; onAjouter: () => void; onAjouterBdp?: () => void; onSupprimer: () => void }>) {
  return (
    <BarreIcones className="flex items-center gap-1 px-3 pt-2">
      <Button type="button" variant="ghost" size="sm" onClick={onAjouter}>
        <Plus /> Ajouter une ligne
      </Button>
      {onAjouterBdp && (
        <Button type="button" variant="ghost" size="sm" onClick={onAjouterBdp}>
          <FilePlus /> Ajouter basée sur le BDP
        </Button>
      )}
      <Button type="button" variant="ghost" size="sm" disabled={nbCochees === 0} onClick={onSupprimer}>
        <Trash2 /> Supprimer
      </Button>
    </BarreIcones>
  );
}
