import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import DataGrid, { type ColonneGrille } from '../../DataGrid';
import { EmptyState } from '../../ui';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { getRemboursementsLot } from '../../../lib/apiProjet';
import { COLONNES_AVANCES, COLONNES_RECEPTIONS_RG } from '../../../lib/sousFenetresLot';
import type { RemboursementsLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';
import FicheReception from './FicheReception';
import GrilleEcheancesRg from './GrilleEcheancesRg';

function Onglet<T extends { id: string }>({ valeur, rows, colonnes, texteVide }: Readonly<{ valeur: string; rows: T[]; colonnes: ColonneGrille<T>[]; texteVide: string }>): ReactNode {
  return (
    <TabsContent value={valeur}>
      {rows.length === 0 ? <EmptyState title={texteVide} /> : <DataGrid rows={rows} colonnes={colonnes} cleOrdre={`lot-remb-${valeur}`} bandeauRegroupement={false} />}
    </TabsContent>
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
          <Onglet valeur="rg" rows={d.remboursementsRg} colonnes={COLONNES_AVANCES} texteVide="Aucun remboursement de retenue de garantie" />
          <Onglet valeur="prorata" rows={d.remboursementsProrata} colonnes={COLONNES_AVANCES} texteVide="Aucun remboursement du compte prorata" />
        </Tabs>
      )}
    </DonneesLot>
  );
}
