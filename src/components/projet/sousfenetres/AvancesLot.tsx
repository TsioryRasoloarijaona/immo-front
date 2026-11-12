import DataGrid from '../../DataGrid';
import { getAvancesLot } from '../../../lib/apiProjet';
import { COLONNES_AVANCES } from '../../../lib/sousFenetresLot';
import type { AvanceLotDto, AvancesLotDto } from '../../../types/projet';
import DonneesLot from './DonneesLot';

export function GrilleAvances({ titre, lignes, texteVide, cleOrdre }: Readonly<{ titre: string; lignes: AvanceLotDto[]; texteVide: string; cleOrdre: string }>) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-body font-semibold">{titre}</h3>
      {lignes.length === 0 ? (
        <p className="text-body text-muted-foreground">{texteVide}</p>
      ) : (
        <DataGrid rows={lignes} colonnes={COLONNES_AVANCES} cleOrdre={cleOrdre} bandeauRegroupement={false} />
      )}
    </section>
  );
}

export default function AvancesLot({ lotId }: Readonly<{ lotId: string }>) {
  return (
    <DonneesLot<AvancesLotDto> lotId={lotId} charger={getAvancesLot} estVide={() => false} texteVide="">
      {(d) => (
        <div className="flex flex-col gap-4">
          <GrilleAvances titre="Avances sur marché" lignes={d.surMarche} texteVide="Aucune avance sur marché" cleOrdre="lot-avances-marche" />
          <GrilleAvances titre="Avances sur décompte" lignes={d.surDecompte} texteVide="Aucune avance sur décompte" cleOrdre="lot-avances-decompte" />
        </div>
      )}
    </DonneesLot>
  );
}
