import { Card, EmptyState, ErrorState, LoadingState } from '../../ui';
import Pagination from '../../Pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { formatDateTime } from '../../../lib/format';
import { avecCles } from '../../../lib/cles';
import type { ApiState } from '../../../lib/useApi';
import type { HistoriqueEvenementDto, PageDto } from '../../../types';

export default function OngletHistorique({
  historique,
  onPageChange,
}: Readonly<{
  historique: ApiState<PageDto<HistoriqueEvenementDto>>;
  onPageChange: (page: number) => void;
}>) {
  return (
    <div className="p-3">
      <Card title="Historique">
        {historique.loading && !historique.data && <LoadingState />}
        {historique.error && <ErrorState message={historique.error} />}
        {historique.data && historique.data.content.length === 0 && (
          <EmptyState title="Aucun historique" message="Aucun événement n'a encore été enregistré pour ce dossier." />
        )}
        {historique.data && historique.data.content.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Date</TableHead>
                  <TableHead>Événement</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {avecCles(historique.data.content, (e) => `${e.date}-${e.type}-${e.utilisateur}-${e.description}`).map(({ item: h, cle }) => (
                  <TableRow key={cle}>
                    <TableCell className="tabular-nums text-muted-foreground">{formatDateTime(h.date)}</TableCell>
                    <TableCell className="font-medium text-foreground">{h.type || 'Événement'}</TableCell>
                    <TableCell className="min-w-60 max-w-120 py-1 whitespace-normal text-muted-foreground">
                      {h.description || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{h.utilisateur || 'Système'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {historique.data && (
          <Pagination
            page={historique.data.page}
            totalPages={historique.data.totalPages}
            totalElements={historique.data.totalElements}
            onPageChange={onPageChange}
          />
        )}
      </Card>
    </div>
  );
}
