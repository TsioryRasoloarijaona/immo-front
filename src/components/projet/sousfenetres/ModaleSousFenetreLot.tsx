import { useState, type ComponentType } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../ui/dialog';
import { useConfirm } from '../../../lib/confirmContext';
import { TITRES_SOUS_FENETRES, type SousFenetre } from '../../../lib/sousFenetresLot';
import AvancesLot from './AvancesLot';
import AvenantsLot from './AvenantsLot';
import AvoirsLot from './AvoirsLot';
import BordereauEstimatifLot from './BordereauEstimatifLot';
import PrevisionsLot from './PrevisionsLot';
import RemboursementsLot from './RemboursementsLot';

type PropsContenu = { lotId: string; onModifie?: (modifie: boolean) => void };

const CONTENUS: Record<SousFenetre, ComponentType<PropsContenu>> = {
  previsions: PrevisionsLot,
  avances: AvancesLot,
  bordereau: BordereauEstimatifLot,
  avenants: AvenantsLot,
  remboursements: RemboursementsLot,
  avoirs: AvoirsLot,
};

/** Sous-fenêtre de la fiche lot ; la fermeture demande confirmation tant que le contenu a des changements non enregistrés. */
export default function ModaleSousFenetreLot({
  sousFenetre,
  lotId,
  description,
  onFermer,
}: Readonly<{ sousFenetre: SousFenetre; lotId: string; description: string | null; onFermer: () => void }>) {
  const confirm = useConfirm();
  const [modifie, setModifie] = useState(false);
  const Contenu = CONTENUS[sousFenetre];

  async function demanderFermeture() {
    if (!modifie || (await confirm({ title: 'Abandonner les modifications ?', message: 'Les modifications non enregistrées de cette fiche seront perdues.', confirmLabel: 'Abandonner' }))) {
      onFermer();
    }
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && void demanderFermeture()}>
      <DialogContent className="max-h-[85vh] overflow-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Lot : {description ?? '—'}</DialogTitle>
          <DialogDescription>{TITRES_SOUS_FENETRES[sousFenetre]}</DialogDescription>
        </DialogHeader>
        <Contenu lotId={lotId} onModifie={setModifie} />
      </DialogContent>
    </Dialog>
  );
}
