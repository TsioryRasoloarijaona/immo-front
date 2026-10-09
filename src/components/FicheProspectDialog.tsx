import { useEffect } from 'react';
import Modal from './Modal';
import { ToastProvider } from './ToastProvider';
import { FicheProspect } from '../pages/prospects/ProspectDetail';
import { refetchAllApis } from '../lib/useApi';

// À charger par `lazy()` : ce module tire toute la page de détail.
export default function FicheProspectDialog({ id, onClose }: { id: string; onClose: () => void }) {
  // Différé d'un tour : voir FicheProspectionDialog.
  useEffect(
    () => () => {
      setTimeout(refetchAllApis, 0);
    },
    [],
  );

  return (
    <Modal title="Prospect" onClose={onClose} width="min(1400px, calc(100vw - 2rem))" pleineHauteur titreMasque>
      <ToastProvider onAction={onClose}>
        <FicheProspect id={id} client={false} variante="dialogue" />
      </ToastProvider>
    </Modal>
  );
}
