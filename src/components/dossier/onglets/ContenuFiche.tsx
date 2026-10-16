import type { ReactNode } from 'react';
import { ErrorState, LoadingState } from '../../ui';
import type { ApiState } from '../../../lib/useApi';
import type { DossierFicheDto } from '../../../types';

/** États chargement / erreur communs aux onglets lus dans `GET /api/dossiers/{id}/fiche`. */
export default function ContenuFiche({
  fiche,
  children,
}: Readonly<{ fiche: ApiState<DossierFicheDto>; children: (f: DossierFicheDto) => ReactNode }>) {
  if (fiche.error) return <ErrorState message={fiche.error} />;
  if (!fiche.data) return <LoadingState />;
  return <div className="flex flex-col gap-3 p-3">{children(fiche.data)}</div>;
}
