import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export default function Modal({
  title,
  onClose,
  children,
  width = 480,
  pleineHauteur = false,
  titreMasque = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Largeur maximale. Un nombre est en pixels ; une chaîne est une valeur CSS,
   * pour borner un dialogue large à la fenêtre (`min(1400px, 100vw - 2rem)`). */
  width?: number | string;
  /** Hauteur fixe au lieu d'une hauteur au contenu, et plus de défilement
   * propre : le contenu reçoit une hauteur bornée et gère lui-même ce qui
   * défile. Pour une fiche (`FicheShell`) ou une liste paginée, dont l'en-tête
   * et le pied doivent rester en place. */
  pleineHauteur?: boolean;
  /** Le titre reste le nom accessible du dialogue mais n'est plus affiché :
   * pour une fiche, dont la première ligne (`CadreFiche`) tient lieu de barre
   * de titre — code, nom, statut — et laisserait sinon une ligne presque vide. */
  titreMasque?: boolean;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        style={{ maxWidth: width }}
        className={
          pleineHauteur
            ? 'flex h-[88vh] flex-col overflow-hidden sm:max-w-none'
            : 'max-h-[88vh] overflow-y-auto sm:max-w-none'
        }
      >
        <DialogHeader className={titreMasque ? 'sr-only' : undefined}>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
