import DataGrid from '../../DataGrid';
import { getAvenantsLot } from '../../../lib/apiProjet';
import { COLONNES_AVENANTS } from '../../../lib/sousFenetresLot';
import type { AvenantLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';

export default function AvenantsLot({ lotId }: Readonly<{ lotId: string }>) {
  return (
    <DonneesLot<AvenantLotDto[]> lotId={lotId} charger={getAvenantsLot} estVide={(d) => d.length === 0} texteVide="Aucun avenant pour ce lot">
      {(d) => <DataGrid rows={d} colonnes={COLONNES_AVENANTS} cleOrdre="lot-avenants" bandeauRegroupement={false} />}
    </DonneesLot>
  );
}
