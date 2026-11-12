import type { ReactNode } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../ui';
import { useApi } from '../../../lib/useApi';

/** Chargement, erreur, vide puis le contenu d'une sous-fenêtre du lot. */
export default function DonneesLot<T>({
  lotId,
  charger,
  estVide,
  texteVide,
  children,
}: Readonly<{
  lotId: string;
  charger: (id: string) => Promise<T>;
  estVide: (data: T) => boolean;
  texteVide: string;
  children: (data: T) => ReactNode;
}>) {
  const { data, loading, error } = useApi(() => charger(lotId), [charger, lotId]);
  if (error) return <ErrorState message={error} />;
  if (!data) return loading ? <LoadingState /> : null;
  if (estVide(data)) return <EmptyState title={texteVide} />;
  return <>{children(data)}</>;
}
