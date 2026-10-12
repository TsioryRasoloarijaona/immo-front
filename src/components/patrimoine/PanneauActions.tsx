import { useState } from 'react';
import { Plus } from 'lucide-react';
import InteractionForm from '../InteractionForm';
import Pagination from '../Pagination';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { createActionArticle, listActionsArticle } from '../../lib/api';
import { formatDate, formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { CreerInteractionRequest, SuiviActionDto, UUID } from '../../types';

function Alerte({ action }: Readonly<{ action: SuiviActionDto }>) {
  if (!action.dateAlerte) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="tabular-nums">{formatDate(action.dateAlerte)}</span>
      {action.alerteActive ? <Badge tone="amber">Active</Badge> : <Badge>Inactive</Badge>}
    </span>
  );
}

/** Actions et alertes d'un article (GEN0005, `ComActionMessage.StkItemId`) ; ajout réservé à l'administrateur. */
export default function PanneauActions({ articleId, admin }: Readonly<{ articleId: UUID; admin: boolean }>) {
  const [page, setPage] = useState(0);
  const [saisie, setSaisie] = useState(false);
  const { data, loading, error, refetch } = useApi(() => listActionsArticle(articleId, { page, size: 20 }), [articleId, page]);

  async function creer(demande: CreerInteractionRequest) {
    await createActionArticle(articleId, demande);
    await refetch();
  }

  let contenu;
  if (error) {
    contenu = <ErrorState message={error} />;
  } else if (!data) {
    contenu = <LoadingState />;
  } else if (data.content.length === 0) {
    contenu = <EmptyState title="Aucune action" message="Aucune action ni alerte n'est rattachée à cet article." />;
  } else {
    contenu = (
      <ResultsRegion loading={loading}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Résultat</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Alerte</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((a) => (
                <TableRow key={a.id} className="hover:bg-muted/40">
                  <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatDateTime(a.dateAction)}</TableCell>
                  <TableCell>{a.utilisateur || '—'}</TableCell>
                  <TableCell>{a.typeAction || '—'}</TableCell>
                  <TableCell>{a.resultat || '—'}</TableCell>
                  <TableCell className="max-w-96 whitespace-pre-line">{a.message || '—'}</TableCell>
                  <TableCell><Alerte action={a} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
      </ResultsRegion>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {admin && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setSaisie(true)}>
            <Plus data-icon="inline-start" /> Ajouter une action
          </Button>
        </div>
      )}
      {contenu}
      {saisie && <InteractionForm onClose={() => setSaisie(false)} onSubmit={creer} />}
    </div>
  );
}
