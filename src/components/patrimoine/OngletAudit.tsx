import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import Pagination from '../Pagination';
import { getJournalAudit } from '../../lib/apiAudit';
import { formatDateTime } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { BadgeTone } from '../../types';
import type { ActionAudit, LigneAuditDto } from '../../types/audit';

const ACTIONS: Record<ActionAudit, { libelle: string; tone: BadgeTone }> = {
  Added: { libelle: 'Ajout', tone: 'success' },
  Modified: { libelle: 'Modification', tone: 'info' },
  Deleted: { libelle: 'Suppression', tone: 'amber' },
};

function Details({ ligne }: Readonly<{ ligne: LigneAuditDto }>) {
  if (ligne.details.length === 0) {
    return <p className="px-3 py-2 text-micro text-muted-foreground">Aucun détail lisible.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Propriété</TableHead>
          <TableHead>Ancienne valeur</TableHead>
          <TableHead>Nouvelle valeur</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ligne.details.map((d, i) => (
          // Une propriété peut revenir deux fois (code de ressource OMRAN) : l'index départage.
          <TableRow key={`${d.propriete}-${i}`}>
            <TableCell className="font-medium text-foreground">{d.propriete}</TableCell>
            <TableCell className="text-muted-foreground">{d.ancienneValeur || '—'}</TableCell>
            <TableCell className="text-foreground">{d.nouvelleValeur || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LigneJournal({ ligne }: Readonly<{ ligne: LigneAuditDto }>) {
  const [ouvert, setOuvert] = useState(false);
  const action = ligne.action ? ACTIONS[ligne.action] : undefined;
  const Chevron = ouvert ? ChevronDown : ChevronRight;
  return (
    <Fragment>
      <TableRow>
        <TableCell>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-expanded={ouvert}
            aria-label={ouvert ? 'Masquer les détails' : 'Afficher les détails'}
            onClick={() => setOuvert((o) => !o)}
          >
            <Chevron />
          </Button>
        </TableCell>
        <TableCell className="tabular-nums text-muted-foreground">{formatDateTime(ligne.date)}</TableCell>
        <TableCell className="text-foreground">{ligne.utilisateur || '—'}</TableCell>
        <TableCell>{action ? <Badge tone={action.tone}>{action.libelle}</Badge> : '—'}</TableCell>
        <TableCell className="text-muted-foreground">
          {ligne.libelleTypeObjet} <span className="font-medium text-foreground">{ligne.libelleObjet}</span>
        </TableCell>
      </TableRow>
      {ouvert && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="bg-muted/30 p-0">
            <Details ligne={ligne} />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}

/** Journal d'audit OMRAN de l'objet et de ses lignes enfants (FEATURE-patrimoine-audit-actions.md §5). */
export default function OngletAudit({ id }: Readonly<{ id: string }>) {
  const [page, setPage] = useState(0);
  const journal = useApi(() => getJournalAudit(id, page), [id, page]);

  if (journal.error) return <ErrorState message={journal.error} />;
  if (!journal.data) return <LoadingState />;
  if (journal.data.content.length === 0) {
    return <EmptyState title="Aucune modification enregistrée" message="Ni OMRAN ni le CRM n'ont tracé d'écriture sur cet objet." />;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8"><span className="sr-only">Détails</span></TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Objet</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {journal.data.content.map((l) => (
            <LigneJournal key={l.id} ligne={l} />
          ))}
        </TableBody>
      </Table>
      <Pagination
        page={journal.data.page}
        totalPages={journal.data.totalPages}
        totalElements={journal.data.totalElements}
        onPageChange={setPage}
      />
    </div>
  );
}
