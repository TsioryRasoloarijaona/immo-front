import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

export default function Modal({
  title,
  onClose,
  children,
  width = 480,
  pleineHauteur = false,
  titreMasque = false,
}: Readonly<{
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Un nombre est en pixels ; une chaîne est une valeur CSS. */
  width?: number | string;
  /** Le dialogue ne défile plus : le contenu reçoit une hauteur bornée et gère
   * lui-même son défilement. */
  pleineHauteur?: boolean;
  /** Le titre reste le nom accessible du dialogue mais n'est plus affiché. */
  titreMasque?: boolean;
}>) {
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
