import { ArrowRightLeft, Download, Eraser, HardHat, Landmark, Pencil, Plug, RefreshCw, Ruler, Trash2, Truck, type LucideIcon } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import { Button } from '../ui/button';
import { droitCreation, GENRES_LOT, type DroitLot } from '../../lib/genresLot';
import type { GenreLot } from '../../types/projet';

const ICONES_CREATION: Record<GenreLot, LucideIcon> = {
  ENTREPRENEURS: HardHat,
  FOURNISSEURS: Truck,
  ADMINISTRATION: Landmark,
  MAITRES_OEUVRE: Ruler,
  CONCESSIONNAIRES: Plug,
};

/** Barre d'actions de la liste des lots, icônes seules (le nom passe en infobulle). */
export default function BarreActionsLots({
  refus,
  ligneSelectionnee,
  exportEnCours,
  onRafraichir,
  onVider,
  onExporter,
  onCreer,
  onEditer,
  onTransition,
  onSupprimer,
}: Readonly<{
  refus: ReadonlySet<DroitLot>;
  ligneSelectionnee: boolean;
  exportEnCours: boolean;
  onRafraichir: () => void;
  onVider: () => void;
  onExporter: () => void;
  onCreer: (genre: GenreLot) => void;
  onEditer: () => void;
  onTransition: () => void;
  onSupprimer: () => void;
}>) {
  return (
    <BarreIcones className="flex items-center gap-1 px-3 pt-2">
      <Button type="button" variant="ghost" size="sm" onClick={onRafraichir}>
        <RefreshCw /> Rafraîchir
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onVider}>
        <Eraser /> Vider les filtres
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={exportEnCours} onClick={onExporter}>
        <Download /> Exporter
      </Button>
      {GENRES_LOT.map(({ genre, creation }) => {
        const Icone = ICONES_CREATION[genre];
        return (
          <Button key={genre} type="button" variant="ghost" size="sm" disabled={refus.has(droitCreation(genre))} onClick={() => onCreer(genre)}>
            <Icone /> {creation}
          </Button>
        );
      })}
      <Button type="button" variant="ghost" size="sm" disabled={!ligneSelectionnee} onClick={onEditer}>
        <Pencil /> Éditer
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={!ligneSelectionnee || refus.has('transition')} onClick={onTransition}>
        <ArrowRightLeft /> Changer de statut
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={!ligneSelectionnee || refus.has('supprimer')} onClick={onSupprimer}>
        <Trash2 /> Supprimer
      </Button>
    </BarreIcones>
  );
}
