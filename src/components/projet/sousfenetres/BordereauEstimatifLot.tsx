import { Lock } from 'lucide-react';
import { getBordereauEstimatifLot, putBordereauEstimatifLot } from '../../../lib/apiProjet';
import type { BordereauEstimatifDto } from '../../../types/projet';
import BordereauModifiable from './BordereauModifiable';
import DonneesLot from './DonneesLot';

export default function BordereauEstimatifLot({ lotId, onModifie }: Readonly<{ lotId: string; onModifie?: (modifie: boolean) => void }>) {
  return (
    <DonneesLot<BordereauEstimatifDto>
      lotId={lotId}
      charger={getBordereauEstimatifLot}
      estVide={(d) => d.verrouille && d.lignes.length === 0}
      texteVide="Bordereau estimatif non saisi"
    >
      {(d) => (
        <div className="flex flex-col gap-2">
          {d.verrouille && (
            <p className="inline-flex items-center gap-1 text-body text-muted-foreground">
              <Lock className="size-3.5" /> Lecture seule
            </p>
          )}
          <BordereauModifiable
            source={d}
            editable={!d.verrouille}
            cleOrdre="lot-bordereau-estimatif"
            enregistrer={(corps) => putBordereauEstimatifLot(lotId, corps)}
            onModifie={onModifie}
          />
        </div>
      )}
    </DonneesLot>
  );
}
