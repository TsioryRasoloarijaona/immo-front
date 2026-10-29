import type { ReactNode } from 'react';
import BarreIcones from '../BarreIcones';

/** Titre et nombre de lignes à gauche ; à droite le sélecteur de colonnes reçu en enfant. */
export default function EnteteListe({
  titre,
  lignes,
  children,
}: Readonly<{ titre: string; lignes?: string; children?: ReactNode }>) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-3 px-3">
      <h2 className="text-title font-semibold text-foreground">{titre}</h2>
      {lignes && <span className="text-body text-muted-foreground">{lignes}</span>}
      <BarreIcones className="ml-auto">{children}</BarreIcones>
    </div>
  );
}
