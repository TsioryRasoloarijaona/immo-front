import type { ReactNode } from 'react';
import CadreFiche from './CadreFiche';
import FenetreFiche from './fiche/FenetreFiche';
import type { VoisinsFiche } from '../lib/fenetreFiche';

export type VarianteCoque = 'fenetre' | 'dialogue';

/** Fenêtre flottante (au-dessus de la liste) ou corps de la boîte d'aperçu `usePreview` : même contenu dans les deux. */
export default function CoqueFiche({
  variante,
  nature,
  titre,
  voisins,
  onFermer,
  enEdition,
  children,
}: Readonly<{
  variante: VarianteCoque;
  nature: string;
  titre: string;
  voisins?: VoisinsFiche;
  onFermer: () => void;
  enEdition?: boolean;
  children: ReactNode;
}>) {
  if (variante === 'dialogue') return <CadreFiche variante="dialogue" title={titre}>{children}</CadreFiche>;
  return (
    <FenetreFiche nature={nature} titre={titre} voisins={voisins} onFermer={onFermer} enEdition={enEdition}>
      {children}
    </FenetreFiche>
  );
}
