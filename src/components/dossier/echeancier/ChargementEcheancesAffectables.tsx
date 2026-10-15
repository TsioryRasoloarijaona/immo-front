import type { ReactNode } from 'react';
import { ErrorState, LoadingState } from '../../ui';
import { listEcheances } from '../../../lib/api';
import { echeancesAffectables } from '../../../lib/repartitionReglement';
import { useApi } from '../../../lib/useApi';
import type { EcheanceDto } from '../../../types';

// L'onglet pagine l'échéancier : le dialogue relit toutes les lignes, un dossier n'en a jamais 500.
const TOUTES = { size: 500 };

/** Échéances du dossier encore dues, la plus ancienne d'abord, relues à chaque ouverture du dialogue. */
export default function ChargementEcheancesAffectables({
  dossierId,
  children,
}: Readonly<{
  dossierId: string;
  children: (echeances: EcheanceDto[]) => ReactNode;
}>) {
  const echeances = useApi(() => listEcheances(dossierId, TOUTES), [dossierId]);

  if (echeances.error) return <ErrorState message={echeances.error} />;
  if (!echeances.data) return <LoadingState />;
  return <>{children(echeancesAffectables(echeances.data.content))}</>;
}
