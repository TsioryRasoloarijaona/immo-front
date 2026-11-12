import { ArrowRightLeft, Copy, RefreshCw, Save, Undo2 } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import { Button } from '../ui/button';

/** Barre de la fiche d'un lot, icônes seules (le nom passe en infobulle). */
export default function BarreFicheLot({
  modifie,
  enCours,
  lectureSeule,
  onEnregistrer,
  onAnnuler,
  onCopier,
  onRafraichir,
  onTransition,
}: Readonly<{
  modifie: boolean;
  enCours: boolean;
  lectureSeule: boolean;
  onEnregistrer: () => void;
  onAnnuler: () => void;
  onCopier: () => void;
  onRafraichir: () => void;
  onTransition: () => void;
}>) {
  return (
    <BarreIcones className="flex items-center gap-1 px-4 pt-2 md:px-7">
      <Button type="button" variant="ghost" size="sm" disabled={!modifie || enCours || lectureSeule} onClick={onEnregistrer}>
        <Save /> Enregistrer
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={onAnnuler}>
        <Undo2 /> Annuler
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={onCopier}>
        <Copy /> Copier
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={onRafraichir}>
        <RefreshCw /> Rafraîchir
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={enCours} onClick={onTransition}>
        <ArrowRightLeft /> Changer de statut
      </Button>
    </BarreIcones>
  );
}
