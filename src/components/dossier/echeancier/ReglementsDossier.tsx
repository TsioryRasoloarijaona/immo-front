import { Badge, ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { encaissementEtatLabel, encaissementEtatTone } from '../../../lib/domain';
import { formatCurrency, formatDate } from '../../../lib/format';
import { resumeAffectations } from '../../../lib/repartitionReglement';
import type { ApiState } from '../../../lib/useApi';
import type { ReglementDossierDto } from '../../../types';
import AffecterReste from './AffecterReste';

function CelluleAffectations({ reglement }: Readonly<{ reglement: ReglementDossierDto }>) {
  const autres = reglement.montantAffecteAutresDossiers ?? 0;
  return (
    <TableCell className="text-muted-foreground">
      {resumeAffectations(reglement.affectations ?? [])}
      {autres > 0 && <span className="block text-micro">dont {formatCurrency(autres)} sur d'autres dossiers</span>}
    </TableCell>
  );
}

function LigneReglementDossier({
  dossierId,
  reglement,
  onChanged,
}: Readonly<{
  dossierId: string;
  reglement: ReglementDossierDto;
  onChanged: () => Promise<void>;
}>) {
  const reste = reglement.resteAAffecter ?? 0;
  const affectable = reste > 0 && reglement.statut !== 'CANCELED';
  return (
    <TableRow>
      <TableCell>{reglement.reference || '—'}</TableCell>
      <TableCell className="text-muted-foreground">{formatDate(reglement.dateDocument)}</TableCell>
      <TableCell>{reglement.typeLibelle || '—'}</TableCell>
      <TableCell>{reglement.payeurNom || '—'}</TableCell>
      <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(reglement.montant)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(reglement.montantAffecte)}</TableCell>
      <TableCell className="text-right tabular-nums">{formatCurrency(reste)}</TableCell>
      <TableCell>
        <Badge tone={encaissementEtatTone(reglement.statut)}>{encaissementEtatLabel(reglement.statut)}</Badge>
      </TableCell>
      <CelluleAffectations reglement={reglement} />
      <TableCell className="text-right">
        {affectable && <AffecterReste dossierId={dossierId} reglement={reglement} onAffecte={onChanged} />}
      </TableCell>
    </TableRow>
  );
}

/** Section « Règlements du dossier » sous l'échéancier (FEATURE-reglement-multi-echeances.md §3.2). */
export default function ReglementsDossier({
  dossierId,
  reglements,
  onChanged,
}: Readonly<{
  dossierId: string;
  reglements: ApiState<ReglementDossierDto[]>;
  onChanged: () => Promise<void>;
}>) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-label font-semibold text-foreground">Règlements du dossier</h3>
      {reglements.loading && !reglements.data && <LoadingState />}
      {reglements.error && (
        <div className="flex flex-col items-center">
          <ErrorState message={reglements.error} />
          <Button type="button" variant="outline" size="sm" onClick={() => void reglements.refetch()}>
            Réessayer
          </Button>
        </div>
      )}
      {!reglements.error && reglements.data && reglements.data.length === 0 && (
        <p className="text-body text-muted-foreground">Aucun règlement sur ce dossier.</p>
      )}
      {!reglements.error && reglements.data && reglements.data.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Référence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Réglé par</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Affecté</TableHead>
                <TableHead className="text-right">Reste à affecter</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Affectations</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {reglements.data.map((r) => (
                <LigneReglementDossier key={r.id} dossierId={dossierId} reglement={r} onChanged={onChanged} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
