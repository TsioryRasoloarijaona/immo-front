import { useEffect, type ReactNode } from 'react';
import Modal from './Modal';
import { ToastProvider } from './ToastProvider';
import { refetchAllApis } from '../lib/useApi';

/** Cadre commun des fiches ouvertes en dialogue (`PreviewProvider`). */
export default function ModalFiche({
  title,
  onClose,
  pleineHauteur = true,
  children,
}: Readonly<{ title: string; onClose: () => void; pleineHauteur?: boolean; children: ReactNode }>) {
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
    <Modal title={title} onClose={onClose} width="min(1400px, calc(100vw - 2rem))" pleineHauteur={pleineHauteur} titreMasque>
      {/* Toasts dans l'arbre du dialogue : hors de lui, ils seraient masqués
          aux lecteurs d'écran, hors focus, et un clic fermerait le dialogue. */}
      <ToastProvider onAction={onClose}>{children}</ToastProvider>
    </Modal>
  );
}
