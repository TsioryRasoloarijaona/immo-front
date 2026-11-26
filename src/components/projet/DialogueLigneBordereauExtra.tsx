import { getBordereauLot } from '../../lib/apiProjet';
import { errorMessage, useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { LigneBordereauDto } from '../../types/projet';
import { ErrorState, LoadingState } from '../ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import SelecteurBordereauAvenant from './sousfenetres/SelecteurBordereauAvenant';

/** Choix de lignes du bordereau définitif du lot pour créer des travaux supplémentaires. */
export default function DialogueLigneBordereauExtra({
  lotId,
  onChoisir,
  onFermer,
}: Readonly<{ lotId: UUID; onChoisir: (lignes: LigneBordereauDto[]) => void; onFermer: () => void }>) {
  const bordereau = useApi(() => getBordereauLot(lotId), [lotId]);
  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onFermer()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter basée sur le BDP</DialogTitle>
          <DialogDescription>Le serveur recopie le prix, le code, la désignation, la TVA, l’unité, les notes et la catégorie de la ligne choisie.</DialogDescription>
        </DialogHeader>
        {bordereau.error && <ErrorState message={errorMessage(bordereau.error)} />}
        {!bordereau.error && !bordereau.data && <LoadingState />}
        {!bordereau.error && bordereau.data && (
          <SelecteurBordereauAvenant
            lignes={bordereau.data.lignes}
            onAjouter={(choisies) => {
              onChoisir(choisies);
              onFermer();
            }}
            onFermer={onFermer}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
