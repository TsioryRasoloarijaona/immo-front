import ModalFiche from './ModalFiche';
import { FicheProspection } from '../pages/prospections/ProspectionDetail';

// À charger par `lazy()` : ce module tire toute la page de détail.
export default function FicheProspectionDialog({
  id,
  pre,
  onClose,
}: Readonly<{
  id: string;
  pre: boolean;
  onClose: () => void;
}>) {
  return (
    <ModalFiche title={pre ? 'Pré-prospection' : 'Prospection'} onClose={onClose}>
      <FicheProspection id={id} pre={pre} variante="dialogue" />
    </ModalFiche>
  );
}
