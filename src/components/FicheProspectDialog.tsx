import ModalFiche from './ModalFiche';
import { FicheProspect } from '../pages/prospects/ProspectDetail';

// À charger par `lazy()` : ce module tire toute la page de détail.
export default function FicheProspectDialog({ id, onClose }: Readonly<{ id: string; onClose: () => void }>) {
  return (
    <ModalFiche title="Prospect" onClose={onClose}>
      <FicheProspect id={id} client={false} variante="dialogue" />
    </ModalFiche>
  );
}
