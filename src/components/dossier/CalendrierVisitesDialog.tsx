import { useState } from 'react';
import Modal from '../Modal';
import { ErrorState, Field, FieldGrid, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { formatDateTime, formatHeure, formatNumber } from '../../lib/format';
import { getCalendrierVisites, programmerVisiteTechnique } from '../../lib/api';
import { errorMessage, useApi } from '../../lib/useApi';
import type { CalendrierVisitesDto } from '../../types';

function Creneaux({ calendrier }: Readonly<{ calendrier: CalendrierVisitesDto }>) {
  if (calendrier.creneaux.length === 0) {
    return <p className="text-body text-muted-foreground">Aucune visite programmée sur la tranche ces 60 prochains jours.</p>;
  }
  return (
    <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
      {calendrier.creneaux.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center gap-x-2 rounded-md bg-muted/40 px-2.5 py-1 text-body">
          <span className="font-medium tabular-nums text-foreground">{formatDateTime(c.debut)}</span>
          {formatHeure(c.fin) && <span className="text-muted-foreground">→ {formatHeure(c.fin)}</span>}
          <span className="text-muted-foreground">{c.dossierCode || '—'}</span>
        </li>
      ))}
    </ul>
  );
}

function FormulaireVisite({ dossierId, onProgrammee }: Readonly<{ dossierId: string; onProgrammee: (emailEnvoye: boolean) => void }>) {
  const [jour, setJour] = useState('');
  const [heureDebut, setHeureDebut] = useState('09:00');
  const [heureFin, setHeureFin] = useState('10:00');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!jour) return;
        setBusy(true);
        setError(null);
        try {
          const res = await programmerVisiteTechnique(dossierId, {
            debut: `${jour}T${heureDebut}:00`,
            fin: `${jour}T${heureFin}:00`,
            note: note.trim() || undefined,
          });
          onProgrammee(res.emailEnvoye);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <FieldGroup>
        <FormField>
          <FieldLabel htmlFor="visite-jour">Jour</FieldLabel>
          <Input id="visite-jour" type="date" value={jour} onChange={(e) => setJour(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-2.5">
          <FormField>
            <FieldLabel htmlFor="visite-de">De</FieldLabel>
            <Input id="visite-de" type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="visite-a">À</FieldLabel>
            <Input id="visite-a" type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} />
          </FormField>
        </div>
        <FormField>
          <FieldLabel htmlFor="visite-note">Note</FieldLabel>
          <Input id="visite-note" value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>
      </FieldGroup>
      {error && <p role="alert" className="mt-3 text-micro text-destructive">{error}</p>}
      <DialogFooter className="mt-5">
        <Button type="submit" disabled={busy || !jour || heureFin <= heureDebut}>
          {busy ? 'Enregistrement…' : 'Programmer la visite'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Calendrier des visites techniques de la tranche du dossier (aide OMRAN, « Calendrier »). */
export default function CalendrierVisitesDialog({
  dossierId,
  onClose,
  onProgrammee,
}: Readonly<{ dossierId: string; onClose: () => void; onProgrammee: (emailEnvoye: boolean) => void }>) {
  const calendrier = useApi(() => getCalendrierVisites(dossierId), [dossierId]);
  const c = calendrier.data;

  return (
    <Modal title="Visite technique" onClose={onClose} width={520}>
      {calendrier.error && <ErrorState message={calendrier.error} />}
      {!calendrier.error && !c && <LoadingState />}
      {!calendrier.error && c && (
        <div className="flex flex-col gap-4">
          <FieldGrid>
            <Field label="Tranche" value={c.trancheLibelle} />
            <Field label="Responsable S.A.V." value={c.responsableSav} />
            <Field label="Délai minimum" value={c.delaiMinimumHeures ? `${formatNumber(c.delaiMinimumHeures)} h` : undefined} />
            <Field label="Visites max. par jour" value={c.maxVisitesParJour ? formatNumber(c.maxVisitesParJour) : undefined} />
          </FieldGrid>
          <section>
            <h3 className="mb-1.5 text-micro font-medium text-muted-foreground">Créneaux déjà pris sur la tranche</h3>
            <Creneaux calendrier={c} />
          </section>
          {c.responsableSav ? (
            <FormulaireVisite dossierId={dossierId} onProgrammee={onProgrammee} />
          ) : (
            <p role="alert" className="rounded-md border border-(--warning-border) bg-(--warning-bg) px-3 py-2 text-body text-(--warning)">
              Aucun responsable S.A.V. n'est affecté à cette tranche : la visite ne peut pas être programmée.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
