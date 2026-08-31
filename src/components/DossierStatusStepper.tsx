import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Card } from './ui';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './ui/popover';
import { DOSSIER_STATUS_PIPELINE, DOSSIER_EXIT_STATUSES, normalizeStatus } from '../lib/dossierStatus';
import { todayISO } from '../lib/format';
import { cn } from '../lib/utils';
import type { EtapeSuivanteDto } from '../types';

// Interactive, non-linear status changer — see instructions/FEATURE-changement-statut.md
// for the original design. GET /api/dossiers/{id}/statut/etapes-suivantes
// (V4) still informs each step when it can — the date field it hangs off
// (`champDate`/`libelleChampDate`) and the backend's confidence that the
// dossier is actually ready (`confiance`) — but every step in the pipeline
// is clickable regardless of whether the API listed it as reachable: real
// dossiers routinely skip steps, so this is left un-enforced by design and
// any status is one click away.
export default function DossierStatusStepper({
  currentStatus,
  nextSteps,
  onConfirm,
}: {
  currentStatus: string;
  nextSteps: EtapeSuivanteDto[];
  onConfirm: (newStatus: string, note: string, date?: string) => void;
}) {
  const normalizedCurrent = normalizeStatus(currentStatus);
  const currentIndex = DOSSIER_STATUS_PIPELINE.findIndex((label) => normalizeStatus(label) === normalizedCurrent);
  const stepByStatus = new Map(nextSteps.map((s) => [normalizeStatus(s.statut), s]));

  return (
    <Card title="Statut du dossier" accent="var(--sec-dossier)">
      <div className="flex flex-col gap-5">
        <div className="flex items-center overflow-x-auto pb-1">
          {DOSSIER_STATUS_PIPELINE.map((label, i) => {
            const isCurrent = normalizeStatus(label) === normalizedCurrent;
            const isPast = currentIndex >= 0 && i < currentIndex;
            const step = stepByStatus.get(normalizeStatus(label));
            return (
              <div className="flex shrink-0 items-center last:flex-1" key={label}>
                <StepNode
                  label={label}
                  isCurrent={isCurrent}
                  isPast={isPast}
                  step={step}
                  onConfirm={onConfirm}
                />
                {i < DOSSIER_STATUS_PIPELINE.length - 1 && (
                  <div className={cn('mx-1 h-0.5 w-6 shrink-0 sm:w-10', !isPast && 'bg-border')} style={isPast ? { background: 'var(--sec-dossier)' } : undefined} />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="text-micro font-medium text-muted-foreground">Sorties :</span>
          {DOSSIER_EXIT_STATUSES.map((label) => {
            const isCurrent = normalizeStatus(label) === normalizedCurrent;
            const step = stepByStatus.get(normalizeStatus(label));
            return (
              <ExitChip
                key={label}
                label={label}
                isCurrent={isCurrent}
                step={step}
                onConfirm={onConfirm}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}

const CONFIANCE_TONE: Record<string, string> = {
  ELEVEE: 'text-(--success)',
  HIGH: 'text-(--success)',
  MOYENNE: 'text-(--warning)',
  MEDIUM: 'text-(--warning)',
  FAIBLE: 'text-destructive',
  LOW: 'text-destructive',
};

function ConfianceBadge({ confiance }: { confiance?: string }) {
  if (!confiance) return null;
  const tone = CONFIANCE_TONE[confiance.toUpperCase()] ?? 'text-muted-foreground';
  return <span className={cn('text-micro font-medium', tone)}>Confiance : {confiance}</span>;
}

function ConfirmPopoverBody({
  label,
  step,
  onConfirm,
  close,
}: {
  label: string;
  step?: EtapeSuivanteDto;
  onConfirm: (s: string, note: string, date?: string) => void;
  close: () => void;
}) {
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  return (
    <div className="flex flex-col gap-3">
      <p className="text-label font-medium text-foreground">Passer à « {label} » ?</p>
      {step ? (
        <ConfianceBadge confiance={step.confiance} />
      ) : (
        <span className="text-micro font-medium text-muted-foreground">
          Statut non listé comme atteignable par l'API — le saut sera forcé.
        </span>
      )}
      {step?.champDate && (
        <label className="flex flex-col gap-1 text-micro font-medium text-muted-foreground">
          {step.libelleChampDate || 'Date'}
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-label" />
        </label>
      )}
      <Textarea
        placeholder="Motif / note (optionnel)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-17.5 text-label"
      />
      <div className="flex justify-end gap-2">
        <PopoverClose render={<Button type="button" variant="outline" size="sm" />}>Annuler</PopoverClose>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            // Submit the exact statut string the API gave us as reachable
            // (step.statut), not our display label — they can differ in
            // casing/accents (e.g. "CONCRETISATION" vs "Concrétisation").
            onConfirm(step?.statut ?? label, note.trim(), step?.champDate ? date || undefined : undefined);
            setNote('');
            close();
          }}
        >
          Confirmer
        </Button>
      </div>
    </div>
  );
}

function StepNode({
  label,
  isCurrent,
  isPast,
  step,
  onConfirm,
}: {
  label: string;
  isCurrent: boolean;
  isPast: boolean;
  step?: EtapeSuivanteDto;
  onConfirm: (s: string, note: string, date?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isClickable = !isCurrent;
  const circle = (
    <div
      className={cn(
        'flex size-6.5 shrink-0 items-center justify-center rounded-full border-2 text-micro font-bold transition-transform',
        isCurrent ? 'text-white' : !isPast && 'border-border bg-(--neutral-bg) text-muted-foreground',
        isClickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
      )}
      style={
        isCurrent
          ? { borderColor: 'var(--sec-dossier)', background: 'var(--sec-dossier)' }
          : isPast
            ? { borderColor: 'var(--sec-dossier)', background: 'var(--sec-dossier-bg)', color: 'var(--sec-dossier)' }
            : undefined
      }
    >
      {isPast ? <Check className="size-3.5" /> : ''}
    </div>
  );
  const textLabel = (
    <div
      className={cn(
        'mt-1.5 whitespace-nowrap text-center text-micro',
        isCurrent ? 'font-semibold text-foreground' : isPast ? 'text-foreground' : 'text-muted-foreground',
        !isClickable && !isCurrent && 'opacity-60',
      )}
    >
      {label}
    </div>
  );

  if (!isClickable) {
    return (
      <div className="flex flex-col items-center">
        {circle}
        {textLabel}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<button type="button" aria-label={`Passer au statut ${label}`} />}
        className="flex flex-col items-center outline-none"
      >
        {circle}
        {textLabel}
      </PopoverTrigger>
      <PopoverContent>
        <ConfirmPopoverBody label={label} step={step} onConfirm={onConfirm} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function ExitChip({
  label,
  isCurrent,
  step,
  onConfirm,
}: {
  label: string;
  isCurrent: boolean;
  step?: EtapeSuivanteDto;
  onConfirm: (s: string, note: string, date?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const isClickable = !isCurrent;
  const chip = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        isCurrent
          ? 'border-(--warning-border) bg-(--warning-bg) text-(--warning)'
          : 'border-border bg-(--neutral-bg) text-muted-foreground',
        isClickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-sm hover:border-(--warning-border) hover:text-(--warning)',
        !isClickable && !isCurrent && 'opacity-60',
      )}
    >
      <X className="size-3" />
      {label}
    </span>
  );

  if (!isClickable) return chip;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" aria-label={`Passer au statut ${label}`} />} className="outline-none">
        {chip}
      </PopoverTrigger>
      <PopoverContent>
        <ConfirmPopoverBody label={label} step={step} onConfirm={onConfirm} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
