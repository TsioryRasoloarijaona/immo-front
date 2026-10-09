import { useCallback, type ReactNode } from 'react';
import Modal from '../../../components/Modal';
import { useConfirmation } from './useConfirmation';

/** `children` reçoit `fermer` : à brancher sur le bouton Annuler, sinon il échappe à la garde « Quitter sans
 * enregistrer ? ». */
export default function ModaleSaisie({
  titre,
  modifie,
  onClose,
  width,
  children,
}: Readonly<{
  titre: string;
  modifie: boolean;
  onClose: () => void;
  width?: number | string;
  children: (fermer: () => void) => ReactNode;
}>) {
  const [confirmation, demander] = useConfirmation();

  const fermer = useCallback(() => {
    if (!modifie) return onClose();
    void demander({
      titre: 'Quitter sans enregistrer ?',
      message: 'Les modifications de cette fenêtre seront perdues.',
      confirmer: 'Quitter sans enregistrer',
      annuler: "Continuer l'édition",
    }).then((ok) => ok && onClose());
  }, [modifie, onClose, demander]);

  return (
    <Modal title={titre} onClose={fermer} width={width}>
      {children(fermer)}
      {confirmation}
    </Modal>
  );
}
