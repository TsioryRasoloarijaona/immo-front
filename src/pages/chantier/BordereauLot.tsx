import { EmptyState, ErrorState } from '../../components/ui';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { getBordereauLot } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { formatCurrency, formatNumber, formatPercentValue } from '../../lib/format';
import { SqueletteGrille } from './chantierUi';

const NUM = 'text-right tabular-nums';

export default function BordereauLot({ lotId }: Readonly<{ lotId: string }>) {
  const { data, loading, error } = useApi(() => getBordereauLot(lotId), [lotId]);

  if (loading && !data) return <SqueletteGrille />;
  if (error) return <ErrorState message={error} />;
  if (!data || data.lignes.length === 0) {
    return <EmptyState title="Bordereau non saisi — montant forfaitaire" message="Le montant du marché vient du forfait saisi sur le lot." />;
  }
  const avecGroupes = data.lignes.some((l) => l.groupe);

  return (
    <div className="min-w-0 overflow-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {avecGroupes && <TableHead>Groupe</TableHead>}
            <TableHead>Code</TableHead>
            <TableHead>Désignation</TableHead>
            <TableHead>Unité</TableHead>
            <TableHead className={NUM}>Quantité</TableHead>
            <TableHead className={NUM}>PU HT</TableHead>
            <TableHead className={NUM}>TVA</TableHead>
            <TableHead className={NUM}>Total HT</TableHead>
            <TableHead className={NUM}>Total TTC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.lignes.map((l) => (
            <TableRow key={l.id}>
              {avecGroupes && <TableCell className="text-muted-foreground">{l.groupe ?? '—'}</TableCell>}
              <TableCell className="text-muted-foreground">{l.code ?? '—'}</TableCell>
              <TableCell className="max-w-90 truncate text-foreground" title={l.designation ?? undefined}>{l.designation ?? '—'}</TableCell>
              <TableCell className="text-muted-foreground">{l.unite ?? '—'}</TableCell>
              <TableCell className={NUM}>{formatNumber(l.quantite, 2)}</TableCell>
              <TableCell className={NUM}>{formatCurrency(l.prixUnitaireHT)}</TableCell>
              <TableCell className={NUM}>{formatPercentValue(l.tauxTVA)}</TableCell>
              <TableCell className={NUM}>{formatCurrency(l.totalHT)}</TableCell>
              <TableCell className={NUM}>{formatCurrency(l.totalTTC)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={avecGroupes ? 7 : 6} className="font-semibold">
              Total · {data.totaux.nbLignes} lignes · TVA {formatCurrency(data.totaux.totalTVA)}
            </TableCell>
            <TableCell className={`${NUM} font-semibold`}>{formatCurrency(data.totaux.totalHT)}</TableCell>
            <TableCell className={`${NUM} font-semibold`}>{formatCurrency(data.totaux.totalTTC)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
