import { Suspense, lazy } from 'react';

/* Chargée à la demande : ce dialogue tire toute la page de détail d'une
   prospection (~50 kB), que le tableau de bord n'a pas à payer tant que
   personne n'ouvre une fiche. */
const FicheProspectionDialog = lazy(() => import('../FicheProspectionDialog'));

/** La fiche ouverte en dialogue : laquelle, et sous quel habillage. */
export type FicheOuverte = { id: string; pre: boolean };

/** Rend le dialogue de fiche quand `fiche` est posée, rien sinon.
 *
 * `fallback={null}` : le lot arrive en quelques millisecondes, un indicateur
 * clignoterait — même choix que les boîtes de création des listes. */
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
