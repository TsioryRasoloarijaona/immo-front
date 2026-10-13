import LignesSelectionnables from './LignesSelectionnables';
import { Button } from '../ui/button';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { basculer, libelleChargees } from '../../lib/equipe';
import type { LeadsPagines } from '../../lib/useLeadsPagines';
import type { UUID } from '../../types';

/** Un onglet de la fenêtre « Réaffecter » : états, « Tout cocher » sur les lignes chargées, « Afficher plus ». */
export default function ListeLeadsReaffecter({
  liste,
  vide,
  selection,
  onSelection,
  onOuvrir,
}: Readonly<{
  liste: LeadsPagines;
  vide: string;
  selection: ReadonlySet<string>;
  onSelection: (s: Set<string>) => void;
  onOuvrir: (id: UUID) => void;
}>) {
  const { lignes } = liste;
  const toutesCochees = lignes.length > 0 && lignes.every((l) => selection.has(l.id));

  if (liste.error) return <ErrorState message={liste.error} />;
  if (!liste.chargee) return <LoadingState />;
  if (lignes.length === 0) return <EmptyState title={vide} message="Changez la période ou le projet en haut de l’écran." />;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-micro text-muted-foreground">
        <span>{libelleChargees(lignes.length, liste.total)}</span>
        <label className="flex cursor-pointer items-center gap-2 text-label text-foreground">
          <input
            type="checkbox"
            className="size-3.5"
            checked={toutesCochees}
            onChange={() => onSelection(toutesCochees ? new Set() : new Set(lignes.map((l) => l.id)))}
          />
          Tout cocher
        </label>
      </div>
      <LignesSelectionnables
        lignes={lignes}
        selection={selection}
        onBasculer={(id) => onSelection(basculer(selection, id))}
        onOuvrir={onOuvrir}
      />
      {liste.total > lignes.length && (
        <Button type="button" variant="outline" className="self-center" disabled={liste.loading} onClick={liste.afficherPlus}>
          {liste.loading ? 'Chargement…' : 'Afficher plus'}
        </Button>
      )}
    </div>
  );
}
