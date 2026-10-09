import type { ReactNode } from 'react';
import { ErrorState, LoadingState } from './ui';

/** La grille d'une liste attend son catalogue de colonnes : chargement, échec, ou la grille. */
export default function EtatColonnes({
  pret,
  erreur,
  children,
}: Readonly<{ pret: boolean; erreur: string | null; children: ReactNode }>) {
  if (pret) return <>{children}</>;
  if (erreur) return <ErrorState message={`Colonnes indisponibles — ${erreur}`} />;
  return <LoadingState />;
}
