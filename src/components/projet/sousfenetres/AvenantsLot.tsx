import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import DataGrid from '../../DataGrid';
import { Button } from '../../ui/button';
import { getAvenantsLot } from '../../../lib/apiProjet';
import { COLONNES_AVENANTS } from '../../../lib/sousFenetresLot';
import { refetchAllApis } from '../../../lib/useApi';
import type { AvenantLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';
import FicheAvenant from './FicheAvenant';

export default function AvenantsLot({ lotId, onModifie }: Readonly<{ lotId: string; onModifie?: (modifie: boolean) => void }>) {
  const [ouvert, setOuvert] = useState<{ id: string | null } | null>(null);
  if (ouvert) return <FicheAvenant lotId={lotId} avenantId={ouvert.id} onRetour={() => setOuvert(null)} onModifie={onModifie} />;
  return (
    <div className="flex flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOuvert({ id: null })}>
          <Plus /> Ajouter
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => refetchAllApis()}>
          <RefreshCw /> Rafraîchir
        </Button>
      </BarreIcones>
      <DonneesLot<AvenantLotDto[]> lotId={lotId} charger={getAvenantsLot} estVide={(d) => d.length === 0} texteVide="Aucun avenant pour ce lot">
        {(d) => <DataGrid rows={d} colonnes={COLONNES_AVENANTS} cleOrdre="lot-avenants" bandeauRegroupement={false} onOuvrir={(id) => setOuvert({ id })} />}
      </DonneesLot>
    </div>
  );
}
