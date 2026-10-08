import { useEffect } from 'react';
import Modal from './Modal';
import { ToastProvider } from './ToastProvider';
import { FicheDossier } from '../pages/dossiers/DossierDetail';
import { refetchAllApis } from '../lib/useApi';

/**
 * La fiche d'un dossier de vente dans un dialogue, **la même que la page** —
 * `FicheDossier` en variante `dialogue`, actions comprises. Même modèle que
 * `FicheProspectionDialog` : relecture différée de tout ce qui est monté
 * derrière à la fermeture, navigations vers ailleurs qui ferment le dialogue.
 *
 * À charger par `lazy()` : ce module tire toute la page de détail.
 */
export default function FicheDossierDialog({ id, onClose }: { id: string; onClose: () => void }) {
  // Différé d'un tour : voir FicheProspectionDialog.
  useEffect(
    () => () => {
      setTimeout(refetchAllApis, 0);
    },
    [],
  );

  return (
    <Modal title="Dossier de vente" onClose={onClose} width="min(1400px, calc(100vw - 2rem))" pleineHauteur>
      <ToastProvider onAction={onClose}>
        <FicheDossier id={id} variante="dialogue" />
      </ToastProvider>
    </Modal>
  );
}
