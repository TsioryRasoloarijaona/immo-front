import { useEffect } from 'react';
import Modal from './Modal';
import { ToastProvider } from './ToastProvider';
import { FicheProspection } from '../pages/prospections/ProspectionDetail';
import { refetchAllApis } from '../lib/useApi';

/**
 * La fiche d'une prospection (ou pré-prospection) dans un dialogue, **la même
 * que la page** — `FicheProspection` en variante `dialogue`, toutes actions
 * comprises. Ouverte depuis le tableau de bord pour consulter et traiter une
 * ligne sans le quitter.
 *
 * Les actions qui mènent par nature ailleurs (« Créer un dossier », ouvrir le
 * dossier ou la fiche prospect, voir une tranche) restent des navigations :
 * elles quittent l'écran, et le dialogue avec.
 *
 * À charger par `lazy()` : ce module tire toute la page de détail.
 */
export default function FicheProspectionDialog({
  id,
  pre,
  onClose,
}: {
  id: string;
  /** Habillage « pré-prospection » — voir `FicheProspection`. */
  pre: boolean;
  onClose: () => void;
}) {
  /* À la fermeture, tout ce qui est resté monté derrière — le couloir, la
     liste complète, les compteurs — relit ses données : la fiche a pu archiver,
     changer d'étape, transformer. Sans mutation le cache répond et rien ne
     part au serveur.

     Différé d'un tour : au moment du nettoyage les requêtes de la fiche sont
     encore inscrites, et les relancer pour les jeter aussitôt serait une
     dizaine d'appels perdus. */
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
