import { Lock } from 'lucide-react';
import { getBordereauEstimatifLot } from '../../../lib/apiProjet';
import type { BordereauEstimatifDto } from '../../../types/projet';
import BordereauAvecArbre from './ArbreBordereau';
import DonneesLot from './DonneesLot';

export default function BordereauEstimatifLot({ lotId }: Readonly<{ lotId: string }>) {
  return (
    <DonneesLot<BordereauEstimatifDto> lotId={lotId} charger={getBordereauEstimatifLot} estVide={(d) => d.lignes.length === 0} texteVide="Bordereau estimatif non saisi">
      {(d) => (
        <div className="flex flex-col gap-2">
          <p className="inline-flex items-center gap-1 text-body text-muted-foreground">
            <Lock className="size-3.5" /> Lecture seule
          </p>
          <BordereauAvecArbre groupes={d.groupes} lignes={d.lignes} totaux={d.totaux} cleOrdre="lot-bordereau-estimatif" />
        </div>
      )}
    </DonneesLot>
  );
}
