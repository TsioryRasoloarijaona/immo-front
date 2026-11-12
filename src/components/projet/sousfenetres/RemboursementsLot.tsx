import type { ReactNode } from 'react';
import DataGrid, { type ColonneGrille } from '../../DataGrid';
import { EmptyState } from '../../ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { getRemboursementsLot } from '../../../lib/apiProjet';
import { COLONNES_AVANCES, COLONNES_ECHEANCES_RG, COLONNES_RECEPTIONS_RG } from '../../../lib/sousFenetresLot';
import type { RemboursementsLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';

function Onglet<T extends { id: string }>({ valeur, rows, colonnes, texteVide }: Readonly<{ valeur: string; rows: T[]; colonnes: ColonneGrille<T>[]; texteVide: string }>): ReactNode {
  return (
    <TabsContent value={valeur}>
      {rows.length === 0 ? <EmptyState title={texteVide} /> : <DataGrid rows={rows} colonnes={colonnes} cleOrdre={`lot-remb-${valeur}`} bandeauRegroupement={false} />}
    </TabsContent>
  );
}

export default function RemboursementsLot({ lotId }: Readonly<{ lotId: string }>) {
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
          <Onglet valeur="echeances" rows={d.echeances} colonnes={COLONNES_ECHEANCES_RG} texteVide="Aucune échéance de remboursement" />
          <Onglet valeur="receptions" rows={d.receptions} colonnes={COLONNES_RECEPTIONS_RG} texteVide="Aucune réception de retenue de garantie" />
          <Onglet valeur="rg" rows={d.remboursementsRg} colonnes={COLONNES_AVANCES} texteVide="Aucun remboursement de retenue de garantie" />
          <Onglet valeur="prorata" rows={d.remboursementsProrata} colonnes={COLONNES_AVANCES} texteVide="Aucun remboursement du compte prorata" />
        </Tabs>
      )}
    </DonneesLot>
  );
}
