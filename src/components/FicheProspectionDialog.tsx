import { useEffect } from 'react';
import Modal from './Modal';
import { ToastProvider } from './ToastProvider';
import { FicheProspection } from '../pages/prospections/ProspectionDetail';
import { refetchAllApis } from '../lib/useApi';

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
  /* À la fermeture, tout ce qui est monté derrière relit ses données. Différé d'un
     tour : au nettoyage, les requêtes de la fiche sont encore inscrites et seraient
     relancées pour rien. */
  useEffect(
    () => () => {
      setTimeout(refetchAllApis, 0);
    },
    [],
  );

  return (
    <Modal
      title={pre ? 'Pré-prospection' : 'Prospection'}
      onClose={onClose}
      width="min(1400px, calc(100vw - 2rem))"
      pleineHauteur
      titreMasque
    >
      {/* Toasts dans l'arbre du dialogue : hors de lui, ils seraient masqués
          aux lecteurs d'écran, hors focus, et un clic fermerait le dialogue. */}
      <ToastProvider onAction={onClose}>
        <FicheProspection id={id} pre={pre} variante="dialogue" />
      </ToastProvider>
    </Modal>
  );
}
