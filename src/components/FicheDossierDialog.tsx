import { useEffect } from 'react';
import Modal from './Modal';
import { ToastProvider } from './ToastProvider';
import { FicheDossier } from '../pages/dossiers/DossierDetail';
import { refetchAllApis } from '../lib/useApi';

// À charger par `lazy()` : ce module tire toute la page de détail.
export default function FicheDossierDialog({ id, onClose }: { id: string; onClose: () => void }) {
  // Différé d'un tour : voir FicheProspectionDialog.
  useEffect(
    () => () => {
      setTimeout(refetchAllApis, 0);
    },
    [],
  );

  return (
    <Modal title="Dossier de vente" onClose={onClose} width="min(1400px, calc(100vw - 2rem))" pleineHauteur titreMasque>
      <ToastProvider onAction={onClose}>
        <FicheDossier id={id} variante="dialogue" />
      </ToastProvider>
    </Modal>
  );
}
