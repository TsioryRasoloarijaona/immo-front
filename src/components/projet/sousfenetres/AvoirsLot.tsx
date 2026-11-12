import DataGrid from '../../DataGrid';
import { getAvoirsLot } from '../../../lib/apiProjet';
import { COLONNES_AVOIRS } from '../../../lib/sousFenetresLot';
import type { AvoirLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';

export default function AvoirsLot({ lotId }: Readonly<{ lotId: string }>) {
  return (
    <DonneesLot<AvoirLotDto[]> lotId={lotId} charger={getAvoirsLot} estVide={(d) => d.length === 0} texteVide="Aucun avoir pour ce lot">
      {(d) => <DataGrid rows={d} colonnes={COLONNES_AVOIRS} cleOrdre="lot-avoirs" bandeauRegroupement={false} />}
    </DonneesLot>
  );
}
