import { useState } from 'react';
import { Pencil } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import DataGrid from '../../DataGrid';
import { EmptyState } from '../../ui';
import { Button } from '../../ui/button';
import GraphePrevisions from '../GraphePrevisions';
import ModalePrevisionsLot from './ModalePrevisionsLot';
import { getPrevisionsLot } from '../../../lib/apiProjet';
import { COLONNES_PREVISIONS } from '../../../lib/sousFenetresLot';
import type { PrevisionsLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';

const LIBELLES = { estimation: 'Estimation de base', prevision: 'Prévision', reel: 'Réel' };

function ContenuPrevisions({ lotId, initial }: Readonly<{ lotId: string; initial: PrevisionsLotDto }>) {
  const [enregistre, setEnregistre] = useState<PrevisionsLotDto | null>(null);
  const [saisie, setSaisie] = useState(false);
  const d = enregistre ?? initial;
  return (
    <div className="flex flex-col gap-3">
      {d.modifiable && (
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => setSaisie(true)}>
            <Pencil /> Modifier les prévisions
          </Button>
        </BarreIcones>
      )}
      {d.mois.length === 0 ? (
        <EmptyState title="Aucune prévision pour ce lot" />
      ) : (
        <>
          <GraphePrevisions mois={d.mois} libelles={LIBELLES} titre="Prévisions mensuelles du lot" />
          <DataGrid rows={d.mois.map((p) => ({ ...p, id: p.mois }))} colonnes={COLONNES_PREVISIONS} cleOrdre="lot-previsions" bandeauRegroupement={false} />
        </>
      )}
      {saisie && (
        <ModalePrevisionsLot
          lotId={lotId}
          onFermer={() => setSaisie(false)}
          onEnregistre={(reponse) => {
            setEnregistre(reponse);
            setSaisie(false);
          }}
        />
      )}
    </div>
  );
}

export default function PrevisionsLot({ lotId }: Readonly<{ lotId: string }>) {
  return (
    <DonneesLot<PrevisionsLotDto> lotId={lotId} charger={getPrevisionsLot} estVide={() => false} texteVide="Aucune prévision pour ce lot">
      {(d) => <ContenuPrevisions lotId={lotId} initial={d} />}
    </DonneesLot>
  );
}
