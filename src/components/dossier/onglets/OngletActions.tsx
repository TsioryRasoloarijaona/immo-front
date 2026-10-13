import { useEffect, useRef, useState } from 'react';
import { BellDot, Plus } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../ui';
import { LigneActivite } from '../../FicheShell';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { formatDate, formatDateTime } from '../../../lib/format';
import { marquerInstructionLue } from '../../../lib/api';
import { useAuth } from '../../../lib/auth';
import type { ApiState } from '../../../lib/useApi';
import type { ActionDossierDto, ActionsDossierDto } from '../../../types';
import AjoutActionDialog from '../AjoutActionDialog';

/**
 * « L'icône sera supprimée lorsque le commercial concerné ouvre l'écran des actions » (aide OMRAN) :
 * à l'ouverture de l'onglet, les instructions non lues adressées à l'utilisateur sont marquées lues.
 */
function useMarquerInstructionsLues(dossierId: string, actions: ActionDossierDto[] | undefined, onLues: () => void) {
  const { user } = useAuth();
  const dejaEnvoyees = useRef(new Set<string>());

  useEffect(() => {
    const employeId = user?.employeeId;
    if (!employeId || !actions) return;
    const aMarquer = actions.filter(
      (a) => a.instruction && a.nonLue && a.destinataireId === employeId && !dejaEnvoyees.current.has(a.id),
    );
    if (aMarquer.length === 0) return;
    aMarquer.forEach((a) => dejaEnvoyees.current.add(a.id));
    void Promise.all(aMarquer.map((a) => marquerInstructionLue(dossierId, a.id)))
      .then(onLues)
      .catch(() => undefined);
  }, [actions, dossierId, onLues, user?.employeeId]);
}

function LigneAction({ action: a }: Readonly<{ action: ActionDossierDto }>) {
  return (
    <TableRow>
      <TableCell className="tabular-nums text-muted-foreground">{formatDateTime(a.date)}</TableCell>
      <TableCell>
        <span className="flex items-center gap-1.5">
          {a.instruction && a.nonLue && <BellDot aria-label="Instruction non lue" className="size-3.5 text-(--warning)" />}
          <span className="font-medium text-foreground">{a.type || '—'}</span>
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{a.categorie || '—'}</TableCell>
      <TableCell className="min-w-60 max-w-120 py-1 whitespace-pre-wrap text-foreground">
        {a.note || '—'}
        {a.instruction && a.destinataireNom && (
          <span className="block text-micro text-muted-foreground">Pour {a.destinataireNom}</span>
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{a.dateAlerte ? formatDate(a.dateAlerte) : '—'}</TableCell>
      <TableCell className="text-muted-foreground">{a.auteur || '—'}</TableCell>
    </TableRow>
  );
}

export default function OngletActions({
  dossierId,
  actions,
  onChanged,
}: Readonly<{
  dossierId: string;
  actions: ApiState<ActionsDossierDto>;
  /** Relit actions et fiche (icône d'instruction non lue). */
  onChanged: () => void;
}>) {
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  useMarquerInstructionsLues(dossierId, actions.data?.actions, onChanged);

  return (
    <div className="flex flex-col gap-2.5 p-3">
      <LigneActivite
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => setAjoutOuvert(true)}>
            <Plus data-icon="inline-start" /> Ajouter une action
          </Button>
        }
      >
        {actions.data?.parType.map((c) => (
          <Badge key={c.typeId ?? 'sans-type'} tone="neutral">
            {c.type || 'Sans type'} · {c.nombre}
          </Badge>
        ))}
      </LigneActivite>
      {actions.error && <ErrorState message={actions.error} />}
      {actions.loading && !actions.data && <LoadingState />}
      {actions.data && actions.data.actions.length === 0 && (
        <EmptyState title="Aucune action" message="Aucune action n'a encore été saisie sur ce dossier." />
      )}
      {actions.data && actions.data.actions.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Alerte</TableHead>
                <TableHead>Par</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.data.actions.map((a) => (
                <LigneAction key={a.id} action={a} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {ajoutOuvert && (
        <AjoutActionDialog
          dossierId={dossierId}
          onClose={() => setAjoutOuvert(false)}
          onCreated={() => {
            setAjoutOuvert(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}
