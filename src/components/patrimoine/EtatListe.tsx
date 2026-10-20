import type { ReactNode } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import type { ApiState } from '../../lib/useApi';

/** Chargement, erreur et vide d'une liste en lecture ; `children` ne reçoit que des lignes. */
export default function EtatListe<T>({ etat, vide, children }: Readonly<{
  etat: ApiState<T[]>;
  vide: { titre: string; message: string };
  children: (lignes: T[]) => ReactNode;
}>) {
  if (etat.error) return <ErrorState message={etat.error} />;
  if (!etat.data) return <LoadingState />;
  if (etat.data.length === 0) return <EmptyState title={vide.titre} message={vide.message} />;
  return <>{children(etat.data)}</>;
}
