import { useCallback, type ReactNode } from 'react';
import Modal from '../../../components/Modal';
import { useConfirmation } from './useConfirmation';

/** Modale de saisie du module (§3) : fermer — Échap, clic hors fenêtre,
 * Annuler, croix — une fenêtre dont un champ a changé demande d'abord
 * « Quitter sans enregistrer ? ».
 *
 * `children` reçoit `fermer`, à brancher sur le bouton Annuler pour qu'il
 * passe par la même garde. */
export default function ModaleSaisie({
  titre,
  modifie,
  onClose,
  width,
  children,
}: Readonly<{
  titre: string;
  /** Un champ a changé depuis l'ouverture (ou depuis le dernier enregistrement). */
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
