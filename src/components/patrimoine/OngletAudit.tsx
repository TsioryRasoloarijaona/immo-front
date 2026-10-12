import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Pagination from '../Pagination';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { listAudit } from '../../lib/api';
import { formatDateTime, pluriel } from '../../lib/format';
import { actionAudit } from '../../lib/notesAudit';
import { useApi } from '../../lib/useApi';
import type { ChangementAuditDto, LigneAuditDto, UUID } from '../../types';

const TAILLE_PAGE = 50;

function DetailsLigne({ details }: Readonly<{ details: ChangementAuditDto[] }>) {
  return (
    <div className="overflow-x-auto rounded-md bg-muted/30 px-2 py-1.5">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Propriété</TableHead>
            <TableHead>Ancienne valeur</TableHead>
            <TableHead>Nouvelle valeur</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {details.map((d, i) => (
            // Une propriété peut revenir deux fois dans un Details OMRAN : l'index départage (liste figée).
            <TableRow key={`${d.propriete ?? ''}-${i}`}>
              <TableCell className="font-medium text-foreground">{d.propriete || '—'}</TableCell>
              <TableCell className="break-all text-muted-foreground">{d.ancienneValeur || '—'}</TableCell>
              <TableCell className="break-all text-foreground">{d.nouvelleValeur || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LigneAudit({ ligne }: Readonly<{ ligne: LigneAuditDto }>) {
  const [ouverte, setOuverte] = useState(false);
  const details = ligne.details ?? [];
  const action = actionAudit(ligne.action);
  const Chevron = ouverte ? ChevronDown : ChevronRight;
  return (
    <Fragment>
      <TableRow className="hover:bg-muted/40">
        <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{formatDateTime(ligne.date)}</TableCell>
        <TableCell>{ligne.utilisateur || '—'}</TableCell>
        <TableCell><Badge tone={action.tone}>{action.libelle}</Badge></TableCell>
        <TableCell>
          <span className="text-muted-foreground">{ligne.libelleTypeObjet}</span>{' '}
          <span className="font-medium text-foreground">{ligne.libelleObjet}</span>
        </TableCell>
        <TableCell className="text-right">
          {details.length > 0 ? (
            <Button type="button" variant="ghost" size="sm" aria-expanded={ouverte} onClick={() => setOuverte((o) => !o)}>
              <Chevron data-icon="inline-start" /> {pluriel(details.length, 'propriété')}
            </Button>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
      </TableRow>
      {ouverte && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5}>
            <DetailsLigne details={details} />
          </TableCell>
        </TableRow>
      )}
    </Fragment>
  );
}

/** Journal d'audit OMRAN de la fiche et de ses lignes enfants (FEATURE-patrimoine-audit-actions.md §5). */
export default function OngletAudit({ objetId }: Readonly<{ objetId: UUID }>) {
  const [page, setPage] = useState(0);
  const { data, loading, error } = useApi(() => listAudit(objetId, page, TAILLE_PAGE), [objetId, page]);

  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  if (data.content.length === 0) {
    return <EmptyState title="Aucune modification enregistrée" message="Ni OMRAN ni le CRM n'ont tracé d'écriture sur cette fiche." />;
  }
  return (
    <ResultsRegion loading={loading}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Objet</TableHead>
              <TableHead className="text-right">Détails</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((l) => <LigneAudit key={l.id} ligne={l} />)}
          </TableBody>
        </Table>
      </div>
      <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
    </ResultsRegion>
  );
}
