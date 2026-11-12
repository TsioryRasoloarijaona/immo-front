import type { ComponentType } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { TITRES_SOUS_FENETRES, type SousFenetre } from '../../../lib/sousFenetresLot';
import AvancesLot from './AvancesLot';
import AvenantsLot from './AvenantsLot';
import AvoirsLot from './AvoirsLot';
import BordereauEstimatifLot from './BordereauEstimatifLot';
import PrevisionsLot from './PrevisionsLot';
import RemboursementsLot from './RemboursementsLot';

const CONTENUS: Record<SousFenetre, ComponentType<{ lotId: string }>> = {
  previsions: PrevisionsLot,
  avances: AvancesLot,
  bordereau: BordereauEstimatifLot,
  avenants: AvenantsLot,
  remboursements: RemboursementsLot,
  avoirs: AvoirsLot,
};

/** Sous-fenêtre en lecture seule de la fiche lot. */
export default function ModaleSousFenetreLot({
  sousFenetre,
  lotId,
  description,
  onFermer,
}: Readonly<{ sousFenetre: SousFenetre; lotId: string; description: string | null; onFermer: () => void }>) {
  const Contenu = CONTENUS[sousFenetre];
  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Lot : {description ?? '—'}</DialogTitle>
          <DialogDescription>{TITRES_SOUS_FENETRES[sousFenetre]}</DialogDescription>
        </DialogHeader>
        <Contenu lotId={lotId} />
      </DialogContent>
    </Dialog>
  );
}
