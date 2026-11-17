import { useState, type ReactNode } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import DataGrid from '../../DataGrid';
import { EmptyState, ErrorState } from '../../ui';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { getRemboursementsLot } from '../../../lib/apiProjet';
import { useOuverturePiece } from '../../../lib/saisiePieceLot';
import { COLONNES_AVANCES, COLONNES_RECEPTIONS_RG } from '../../../lib/sousFenetresLot';
import { refetchAllApis } from '../../../lib/useApi';
import type { AvanceLotDto, NaturePieceLot, RemboursementsLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';
import FichePieceLot from './FichePieceLot';
import FicheReception from './FicheReception';
import GrilleEcheancesRg from './GrilleEcheancesRg';

function OngletPieces({
  lotId,
  nature,
  rows,
  texteVide,
  peutAjouter,
  onModifie,
}: Readonly<{ lotId: string; nature: NaturePieceLot; rows: AvanceLotDto[]; texteVide: string; peutAjouter: boolean; onModifie?: (modifie: boolean) => void }>): ReactNode {
  const { ouvert, erreur, ajouter, consulter, fermer } = useOuverturePiece(lotId);
  if (ouvert) return <FichePieceLot lotId={lotId} piece={ouvert} onRetour={fermer} onModifie={onModifie} />;
  return (
    <div className="flex flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        {peutAjouter && (
          <Button type="button" variant="ghost" size="sm" onClick={() => void ajouter(nature)}>
            <Plus /> Ajouter
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={refetchAllApis}>
          <RefreshCw /> Rafraîchir
        </Button>
      </BarreIcones>
      {erreur && <ErrorState message={erreur} />}
      {rows.length === 0 ? (
        <EmptyState title={texteVide} />
      ) : (
        <DataGrid rows={rows} colonnes={COLONNES_AVANCES} cleOrdre={`lot-remb-${nature}`} bandeauRegroupement={false} onOuvrir={(id) => consulter(nature, id)} />
      )}
    </div>
  );
}

function OngletReceptions({ lotId, d, onModifie }: Readonly<{ lotId: string; d: RemboursementsLotDto; onModifie?: (modifie: boolean) => void }>) {
  const [ouvert, setOuvert] = useState<{ id: string | null } | null>(null);
  if (ouvert) return <FicheReception lotId={lotId} receptionId={ouvert.id} remb={d} onRetour={() => setOuvert(null)} onModifie={onModifie} />;
  return (
    <div className="flex flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOuvert({ id: null })}>
          <Plus /> Ajouter
        </Button>
      </BarreIcones>
      {d.receptions.length === 0 ? (
        <EmptyState title="Aucune réception de retenue de garantie" />
      ) : (
        <DataGrid rows={d.receptions} colonnes={COLONNES_RECEPTIONS_RG} cleOrdre="lot-remb-receptions" bandeauRegroupement={false} onOuvrir={(id) => setOuvert({ id })} />
      )}
    </div>
  );
}

export default function RemboursementsLot({ lotId, onModifie }: Readonly<{ lotId: string; onModifie?: (modifie: boolean) => void }>) {
  return (
    <DonneesLot<RemboursementsLotDto> lotId={lotId} charger={getRemboursementsLot} estVide={() => false} texteVide="">
      {(d) => (
        <Tabs defaultValue="echeances">
          <TabsList>
            <TabsTrigger value="echeances">Échéances de remboursement retenue de garantie</TabsTrigger>
            <TabsTrigger value="receptions">Réceptions retenue de garantie</TabsTrigger>
            <TabsTrigger value="rg">Remboursements retenue de garantie</TabsTrigger>
            <TabsTrigger value="prorata">Remboursements compte prorata</TabsTrigger>
          </TabsList>
          <TabsContent value="echeances" keepMounted>
            <GrilleEcheancesRg lotId={lotId} echeances={d.echeances} dateReceptionDefinitive={d.dateReceptionDefinitive} onModifie={onModifie} />
          </TabsContent>
          <TabsContent value="receptions" keepMounted>
            <OngletReceptions lotId={lotId} d={d} onModifie={onModifie} />
          </TabsContent>
          <TabsContent value="rg" keepMounted>
            <OngletPieces lotId={lotId} nature="MARKET_WARRANTY" rows={d.remboursementsRg} texteVide="Aucun remboursement de retenue de garantie" peutAjouter={d.droitPieces} onModifie={onModifie} />
          </TabsContent>
          <TabsContent value="prorata" keepMounted>
            <OngletPieces lotId={lotId} nature="MARKET_PROPORTION" rows={d.remboursementsProrata} texteVide="Aucun remboursement du compte prorata" peutAjouter onModifie={onModifie} />
          </TabsContent>
        </Tabs>
      )}
    </DonneesLot>
  );
}
