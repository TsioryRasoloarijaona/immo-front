import { Badge } from './ui';
import LienFiche from './LienFiche';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { canonicalStatusLabel, toneForStatus } from '../lib/dossierStatus';
import { formatDateTime } from '../lib/format';
import type { HistoriqueDto } from '../types';

export default function HistoriqueTiersTable({ lignes }: Readonly<{ lignes: readonly HistoriqueDto[] }>) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Utilisateur</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>État</TableHead>
            <TableHead>N° Dossier</TableHead>
            <TableHead>Article</TableHead>
            <TableHead>Détails</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((h) => {
            const etat = canonicalStatusLabel(h.statutDescription);
            return (
              <TableRow key={h.id}>
                <TableCell className="text-foreground">{h.utilisateur ?? 'Système'}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatDateTime(h.date)}</TableCell>
                <TableCell>{etat ? <Badge tone={toneForStatus(etat)}>{etat}</Badge> : '—'}</TableCell>
                <TableCell className="whitespace-nowrap">
                  {h.dossierId ? (
                    <LienFiche cible={{ type: 'dossier', id: h.dossierId }} className="font-medium text-(--brand) hover:underline">
                      {h.dossierCode || 'Voir le dossier'}
                    </LienFiche>
                  ) : (
                    h.dossierCode || '—'
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{h.articleCode || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{h.description || '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
