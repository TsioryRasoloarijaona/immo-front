import { useState } from 'react';
import Modal from '../Modal';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field as FormField, FieldLabel } from '../ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatCurrency, formatDate, formatSurface } from '../../lib/format';
import { useTranchesFiltre } from '../../lib/referentiels';
import { validerReajustementSuperficies, verifierReajustementSuperficies } from '../../lib/api';
import { errorMessage, useApi } from '../../lib/useApi';
import type { LigneCibleReajustement, LigneReajustementDto } from '../../types';

const CIBLE: Record<LigneCibleReajustement, string> = {
  AUTOFINANCEMENT: 'ligne d’autofinancement du',
  CREDIT: 'ligne de crédit du',
  NOUVELLE_LIGNE_AUTOFINANCEMENT: 'nouvelle ligne d’autofinancement',
};

function libelleAction(l: LigneReajustementDto): string {
  const sens = (l.differenceSchema ?? 0) < 0 ? 'Soustraire' : 'Ajouter';
  const montant = formatCurrency(Math.abs(l.differenceSchema ?? 0));
  const cible = l.ligneCible ? CIBLE[l.ligneCible] : '';
  const date = l.ligneCibleDate ? ` ${formatDate(l.ligneCibleDate)}` : '';
  return `${sens} ${montant} — ${cible}${date}`;
}

/** Un dossier exclu (`motifExclusion`) n'est pas cochable : son nouveau prix ne peut pas être calculé. */
function LigneTableau({
  l,
  coche,
  onBasculer,
}: Readonly<{ l: LigneReajustementDto; coche: boolean; onBasculer: (id: string) => void }>) {
  const exclu = !!l.motifExclusion;
  return (
    <TableRow>
      <TableCell>
        <input
          type="checkbox"
          aria-label={`Réajuster le dossier ${l.dossierCode ?? ''}`}
          checked={!exclu && coche}
          disabled={exclu}
          onChange={() => onBasculer(l.dossierId)}
        />
      </TableCell>
      <TableCell className="font-medium text-foreground">{l.dossierCode || '—'}</TableCell>
      <TableCell>{l.articleCode || '—'}</TableCell>
      <TableCell className="text-muted-foreground">{l.client || '—'}</TableCell>
      <TableCell className="text-right tabular-nums" title={l.notes ?? undefined}>
        {formatSurface(l.ancienneSuperficie)} → {formatSurface(l.nouvelleSuperficie)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {exclu ? formatCurrency(l.ancienPrix) : `${formatCurrency(l.ancienPrix)} → ${formatCurrency(l.nouveauPrix)}`}
      </TableCell>
      {exclu
        ? <TableCell className="font-medium text-(--warning)">{l.motifExclusion}</TableCell>
        : <TableCell className="text-muted-foreground">{libelleAction(l)}</TableCell>}
    </TableRow>
  );
}

function TableauReajustement({
  lignes,
  coches,
  onBasculer,
}: Readonly<{ lignes: LigneReajustementDto[]; coches: Set<string>; onBasculer: (id: string) => void }>) {
  return (
    <div className="max-h-[50vh] overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead />
            <TableHead>Dossier</TableHead>
            <TableHead>Article</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Superficie</TableHead>
            <TableHead className="text-right">Prix</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((l) => (
            <LigneTableau key={l.dossierId} l={l} coche={coches.has(l.dossierId)} onBasculer={onBasculer} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function VerificationTranche({ trancheId, onDone }: Readonly<{ trancheId: string; onDone: (nombre: number) => void }>) {
  const lignes = useApi(() => verifierReajustementSuperficies(trancheId), [trancheId]);
  const [coches, setCoches] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function basculer(id: string) {
    setCoches((c) => {
      const suivant = new Set(c);
      if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
  }

  async function valider() {
    setBusy(true);
    setError(null);
    try {
      const faites = await validerReajustementSuperficies(trancheId, [...coches]);
      onDone(faites.length);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (lignes.error) return <ErrorState message={lignes.error} />;
  if (!lignes.data) return <LoadingState />;
  if (lignes.data.length === 0) {
    return <EmptyState title="Aucun écart" message="Aucun dossier de la tranche n'a de superficie différente du stock." />;
  }
  return (
    <>
      <TableauReajustement lignes={lignes.data} coches={coches} onBasculer={basculer} />
      {error && <p role="alert" className="mt-3 text-micro text-destructive">{error}</p>}
      <DialogFooter className="mt-4">
        <Button type="button" disabled={busy || coches.size === 0} onClick={() => void valider()}>
          {busy ? 'Validation…' : `Valider (${coches.size})`}
        </Button>
      </DialogFooter>
    </>
  );
}

/** « Réajuster les superficies » d'une tranche (Administrateur). */
export default function ReajustementSuperficiesDialog({
  onClose,
  onDone,
}: Readonly<{ onClose: () => void; onDone: (nombre: number) => void }>) {
  const tranches = useTranchesFiltre();
  const items = tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const [trancheId, setTrancheId] = useState<string | null>(null);

  return (
    <Modal title="Réajuster les superficies" onClose={onClose} width={960}>
      <p className="mb-3 text-body text-muted-foreground">
        Dossiers dont la superficie diffère du stock. L'écart de prix est reporté sur la dernière ligne
        d'autofinancement, sinon de crédit, sinon sur une nouvelle ligne d'autofinancement.
      </p>
      <FormField className="mb-3 max-w-90">
        <FieldLabel htmlFor="reajustement-tranche">Tranche</FieldLabel>
        <Select items={items} value={trancheId} onValueChange={(v) => setTrancheId(v)}>
          <SelectTrigger id="reajustement-tranche" className="w-full">
            <SelectValue placeholder={tranches.loading ? 'Chargement…' : 'Choisir une tranche'} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </FormField>
      {trancheId && <VerificationTranche key={trancheId} trancheId={trancheId} onDone={onDone} />}
    </Modal>
  );
}
