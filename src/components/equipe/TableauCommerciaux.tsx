import { Badge, Card, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatNumber, formatPercent } from '../../lib/format';
import type { CommercialEquipeDto } from '../../types';

function Alerte({ valeur }: Readonly<{ valeur: number }>) {
  return valeur > 0 ? <Badge tone="warning">{formatNumber(valeur)}</Badge> : <span className="text-muted-foreground">0</span>;
}

/** Une ligne par commercial ; clic (ou Entrée) = ses prospections ouvertes, à réaffecter. */
export default function TableauCommerciaux({
  data,
  loading,
  error,
  onOuvrir,
}: Readonly<{
  data: CommercialEquipeDto[] | null;
  loading: boolean;
  error: string | null;
  onOuvrir: (c: CommercialEquipeDto) => void;
}>) {
  return (
    <Card title="Par commercial" padded={false}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (
        <ResultsRegion loading={loading}>
          {data.length === 0 ? (
            <EmptyState title="Aucun commercial dans l’équipe" message="Aucun commercial actif n’est affecté à vos projets." />
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-200">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Commercial</TableHead>
                    <TableHead>Projets</TableHead>
                    <TableHead className="text-right">Portefeuille ouvert</TableHead>
                    <TableHead className="text-right">Sans action &gt; 7 j</TableHead>
                    <TableHead className="text-right">Relances en retard</TableHead>
                    <TableHead className="text-right">Dossiers</TableHead>
                    <TableHead className="text-right">Prosp. → dossier</TableHead>
                    <TableHead className="text-right">Appels</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((c) => {
                    const cliquable = !!c.commercialId;
                    return (
                      <TableRow
                        key={c.admUserId}
                        className={cliquable ? 'cursor-pointer hover:bg-muted/40' : undefined}
                        tabIndex={cliquable ? 0 : undefined}
                        onClick={cliquable ? () => onOuvrir(c) : undefined}
                        onKeyDown={cliquable ? (e) => { if (e.key === 'Enter') onOuvrir(c); } : undefined}
                      >
                        <TableCell className="font-medium text-foreground">
                          {c.nom ?? c.code}
                          {!c.commercialId && <span className="text-micro font-normal text-muted-foreground"> (sans fiche employé)</span>}
                        </TableCell>
                        <TableCell className="text-micro text-muted-foreground">
                          {c.projets.length > 0 ? c.projets.map((p) => p.code).join(', ') : 'Tous'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatNumber(c.portefeuilleOuvert)}</TableCell>
                        <TableCell className="text-right tabular-nums"><Alerte valeur={c.sansActionDepuis7Jours} /></TableCell>
                        <TableCell className="text-right tabular-nums"><Alerte valeur={c.relancesEnRetard} /></TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{formatNumber(c.performance.dossiersCrees)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatPercent(c.performance.tauxProspectionVersDossier)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{formatNumber(c.performance.appelsPasses)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </ResultsRegion>
      )}
    </Card>
  );
}
