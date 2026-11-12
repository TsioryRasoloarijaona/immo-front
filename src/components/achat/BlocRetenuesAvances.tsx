import { formatCurrency, formatPercent } from '../../lib/format';
import type { RetenueAchatDto, RetenuesAvancesAchatDto } from '../../types/achat';

function Ligne({ libelle, ratio, montant }: Readonly<{ libelle: string; ratio?: number | null; montant: number | null }>) {
  return (
    <tr>
      <th scope="row" className="py-1 pr-2 text-left text-body font-normal text-muted-foreground">
        {libelle}
      </th>
      <td className="w-16 py-1 pr-2 text-right text-body tabular-nums text-muted-foreground">{ratio === undefined ? '' : formatPercent(ratio)}</td>
      <td className="py-1 text-right text-body tabular-nums text-foreground">{formatCurrency(montant)}</td>
    </tr>
  );
}

function AvecTaux({ libelle, r }: Readonly<{ libelle: string; r: RetenueAchatDto }>) {
  return <Ligne libelle={libelle} ratio={r.ratio} montant={r.montant} />;
}

/** Colonne droite de la fiche OMRAN : retenues et avances, lues telles quelles (vide = tiret). */
export default function BlocRetenuesAvances({ r }: Readonly<{ r: RetenuesAvancesAchatDto }>) {
  return (
    <table className="w-full text-body">
      <tbody>
        <AvecTaux libelle="Amort. avance" r={r.amortissementAvance} />
        <AvecTaux libelle="Ret. garantie" r={r.retenueGarantie} />
        <AvecTaux libelle="Ret. assu. TRC" r={r.assuranceTRC} />
        <AvecTaux libelle="Ret. assu. décennale" r={r.assuranceDecennale} />
        <AvecTaux libelle="Ret. compte prorata" r={r.compteProrata} />
        <Ligne libelle="Ret. forfaitaires" montant={r.retenuesForfaitaires} />
        <Ligne libelle="Avance sur décompte" montant={r.avanceSurDecompte} />
        <Ligne libelle="Approvisionnement" montant={r.approvisionnement} />
        <Ligne libelle="Remb. compte prorata" montant={r.remboursementProrata} />
        <Ligne libelle="Remb. fluctuations" montant={r.remboursementFluctuations} />
      </tbody>
    </table>
  );
}
