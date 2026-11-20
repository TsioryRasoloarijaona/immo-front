import { formatDate, formatNumber, formatPercentValue } from '../../../lib/format';
import { libelleIntervenants, libellePredecesseurs, type LigneTache } from '../../../lib/planification';
import { cn } from '../../../lib/utils';
import type { PlanificationDetailDto } from '../../../types/planification';
import { HAUTEUR_ENTETE, HAUTEUR_LIGNE } from './GanttSvg';

const ENTETES = ['Code', 'Description', 'Début', 'Durée', 'Fin', '% avancement', 'Prédécesseurs', 'Intervenants'];

/** Tableau des tâches (arbre indenté) ; une ligne fait la hauteur d'une ligne du Gantt, à droite. */
export default function TableTaches({ detail, lignes, selection, onSelect, onOuvrir }: Readonly<{
  detail: PlanificationDetailDto;
  lignes: LigneTache[];
  selection: string | null;
  onSelect: (id: string) => void;
  onOuvrir: (id: string) => void;
}>) {
  return (
    <table className="border-collapse text-body">
      <thead>
        <tr style={{ height: HAUTEUR_ENTETE }} className="bg-muted text-left text-micro text-muted-foreground">
          {ENTETES.map((e) => <th key={e} scope="col" className="px-1.5 font-medium whitespace-nowrap">{e}</th>)}
        </tr>
      </thead>
      <tbody>
        {lignes.map(({ tache, profondeur }) => (
          <tr key={tache.id} style={{ height: HAUTEUR_LIGNE }} aria-selected={tache.id === selection}
            className={cn('cursor-pointer border-t border-border hover:bg-muted/60', tache.id === selection && 'bg-primary/10')}
            onClick={() => onSelect(tache.id)} onDoubleClick={() => onOuvrir(tache.id)}>
            <td className="px-1.5 whitespace-nowrap" style={{ paddingLeft: 6 + profondeur * 14 }}>{tache.code}</td>
            <td className="max-w-56 truncate px-1.5">{tache.description}</td>
            <td className="px-1.5 whitespace-nowrap">{formatDate(tache.dateDebut)}</td>
            <td className="px-1.5 text-right">{formatNumber(tache.duree)}</td>
            <td className="px-1.5 whitespace-nowrap">{formatDate(tache.dateFin)}</td>
            <td className="px-1.5 text-right">{formatPercentValue(tache.avancement, 0)}</td>
            <td className="px-1.5 whitespace-nowrap">{libellePredecesseurs(detail.taches, tache)}</td>
            <td className="max-w-40 truncate px-1.5">{libelleIntervenants(detail, tache.intervenants)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
