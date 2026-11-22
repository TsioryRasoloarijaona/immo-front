import { EmptyState, ErrorState } from '../ui';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { formatCurrency, formatDate } from '../../lib/format';
import { getCelluleTresorerieProjet } from '../../lib/apiProjetTdb';
import { useApi } from '../../lib/useApi';
import type { FiltresTresorerieProjet } from '../../types/projetTdb';
import { SqueletteGrille } from '../../pages/projet/commun';
import type { CelluleChoisie } from './GrilleTresorerieProjet';

export default function PanneauCelluleTresorerie({ filtres, cellule, mois, onFermer }: Readonly<{
  filtres: FiltresTresorerieProjet;
  cellule: CelluleChoisie;
  mois: string[];
  onFermer: () => void;
}>) {
  const lignes = useApi(() => getCelluleTresorerieProjet(filtres, cellule.mois, cellule.noeud.cle), [cellule.mois, cellule.noeud.cle]);

  function corps() {
    if (lignes.error) return <ErrorState message={lignes.error} />;
    if (!lignes.data) return <SqueletteGrille />;
    if (lignes.data.length === 0) return <EmptyState title="Aucune ligne pour cette cellule" />;
    return (
      <ul className="flex flex-col divide-y divide-border overflow-auto text-body">
        {lignes.data.map((l) => (
          <li key={`${l.objetId}-${l.date}-${l.libelle}-${l.montant}`} className="flex flex-col gap-0.5 px-4 py-2">
            <span className="flex justify-between gap-3">
              <span>{l.libelle}</span>
              <span className="tabular-nums">{formatCurrency(l.montant)}</span>
            </span>
            <span className="text-muted-foreground">
              {formatDate(l.date)} · {l.type}
              {l.reporte && ` · reporté (date d'origine ${formatDate(l.dateOrigine)})`}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Sheet open onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            {cellule.noeud.libelle} — {mois[cellule.mois - 1]}
          </SheetTitle>
        </SheetHeader>
        {corps()}
      </SheetContent>
    </Sheet>
  );
}
