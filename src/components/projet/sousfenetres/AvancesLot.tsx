import { Plus, RefreshCw } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import DataGrid from '../../DataGrid';
import { ErrorState } from '../../ui';
import { Button } from '../../ui/button';
import { getAvancesLot } from '../../../lib/apiProjet';
import { useOuverturePiece } from '../../../lib/saisiePieceLot';
import { COLONNES_AVANCES } from '../../../lib/sousFenetresLot';
import { refetchAllApis } from '../../../lib/useApi';
import type { AvanceLotDto, AvancesLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';
import FichePieceLot from './FichePieceLot';

export function GrilleAvances({
  titre,
  lignes,
  texteVide,
  cleOrdre,
  onAjouter,
  onOuvrir,
}: Readonly<{ titre: string; lignes: AvanceLotDto[]; texteVide: string; cleOrdre: string; onAjouter?: () => void; onOuvrir: (id: string) => void }>) {
  return (
    <section className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <h3 className="text-body font-semibold">{titre}</h3>
        {onAjouter && (
          <BarreIcones className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={onAjouter}>
              <Plus /> Ajouter
            </Button>
          </BarreIcones>
        )}
      </div>
      {lignes.length === 0 ? (
        <p className="text-body text-muted-foreground">{texteVide}</p>
      ) : (
        <DataGrid rows={lignes} colonnes={COLONNES_AVANCES} cleOrdre={cleOrdre} bandeauRegroupement={false} onOuvrir={onOuvrir} />
      )}
    </section>
  );
}

export default function AvancesLot({ lotId, onModifie }: Readonly<{ lotId: string; onModifie?: (modifie: boolean) => void }>) {
  const { ouvert, erreur, ajouter, consulter, fermer } = useOuverturePiece(lotId);
  if (ouvert) return <FichePieceLot lotId={lotId} piece={ouvert} onRetour={fermer} onModifie={onModifie} />;
  return (
    <DonneesLot<AvancesLotDto> lotId={lotId} charger={getAvancesLot} estVide={() => false} texteVide="">
      {(d) => (
        <div className="flex flex-col gap-4">
          <BarreIcones className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={refetchAllApis}>
              <RefreshCw /> Rafraîchir
            </Button>
          </BarreIcones>
          {erreur && <ErrorState message={erreur} />}
          <GrilleAvances
            titre="Avances sur marché"
            lignes={d.surMarche}
            texteVide="Aucune avance sur marché"
            cleOrdre="lot-avances-marche"
            onAjouter={d.droitPieces ? () => void ajouter('MARKET_ADVANCE') : undefined}
            onOuvrir={(id) => consulter('MARKET_ADVANCE', id)}
          />
          <GrilleAvances
            titre="Avances sur décompte"
            lignes={d.surDecompte}
            texteVide="Aucune avance sur décompte"
            cleOrdre="lot-avances-decompte"
            onAjouter={d.droitPieces ? () => void ajouter('WORKINGOUT_ADVANCE') : undefined}
            onOuvrir={(id) => consulter('WORKINGOUT_ADVANCE', id)}
          />
        </div>
      )}
    </DonneesLot>
  );
}
