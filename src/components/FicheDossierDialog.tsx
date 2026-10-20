import ModalFiche from './ModalFiche';
import { FicheDossier } from '../pages/dossiers/DossierDetail';

// À charger par `lazy()` : ce module tire toute la page de détail.
export default function FicheDossierDialog({
  id,
  onglet,
  onClose,
}: Readonly<{ id: string; onglet?: string; onClose: () => void }>) {
  return (
    <ModalFiche title="Dossier de vente" onClose={onClose}>
      <FicheDossier id={id} variante="dialogue" onglet={onglet} />
    </ModalFiche>
  );
}
