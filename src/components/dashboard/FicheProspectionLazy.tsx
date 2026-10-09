import { Suspense, lazy } from 'react';

/* Chargée à la demande : ce dialogue tire toute la page de détail d'une prospection. */
const FicheProspectionDialog = lazy(() => import('../FicheProspectionDialog'));

export type FicheOuverte = { id: string; pre: boolean };

/** `fallback={null}` : le lot arrive vite, un indicateur ne ferait que clignoter. */
export default function FicheProspectionLazy({
  fiche,
  onClose,
}: {
  fiche: FicheOuverte | null;
  onClose: () => void;
}) {
  if (!fiche) return null;
  return (
    <Suspense fallback={null}>
      <FicheProspectionDialog id={fiche.id} pre={fiche.pre} onClose={onClose} />
    </Suspense>
  );
}
