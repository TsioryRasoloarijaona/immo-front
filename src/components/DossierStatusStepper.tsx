import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Card } from './ui';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './ui/popover';
import { DOSSIER_STATUS_PIPELINE, DOSSIER_EXIT_STATUSES, validTransitionsFrom } from '../lib/dossierStatus';
import { cn } from '../lib/utils';

// Interactive, non-linear status changer — replaces the old static status
// badge + "Faire avancer/Annuler la dernière étape" buttons. See
// instructions/FEATURE-changement-statut.md. Only statuses in
// validTransitionsFrom(currentStatus) are clickable; everything else in the
// pipeline stays visible (for process context) but inert.
export default function DossierStatusStepper({
  currentStatus,
  onConfirm,
}: {
  currentStatus: string;
  onConfirm: (newStatus: string, note: string) => void;
}) {
  const currentIndex = DOSSIER_STATUS_PIPELINE.indexOf(currentStatus as (typeof DOSSIER_STATUS_PIPELINE)[number]);
  const validTargets = validTransitionsFrom(currentStatus);

  return (
    <Card title="Statut du dossier">
      <div className="flex flex-col gap-5">
        <div className="flex items-center overflow-x-auto pb-1">
          {DOSSIER_STATUS_PIPELINE.map((label, i) => {
            const isCurrent = label === currentStatus;
            const isPast = currentIndex >= 0 && i < currentIndex;
            const isClickable = !isCurrent && validTargets.includes(label);
            return (
              <div className="flex shrink-0 items-center last:flex-1" key={label}>
                <StepNode
                  label={label}
                  isCurrent={isCurrent}
                  isPast={isPast}
                  isClickable={isClickable}
                  onConfirm={onConfirm}
                />
                {i < DOSSIER_STATUS_PIPELINE.length - 1 && (
                  <div className={cn('mx-1 h-0.5 w-6 shrink-0 sm:w-10', isPast ? 'bg-primary' : 'bg-border')} />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <span className="text-[11.5px] font-medium text-muted-foreground">Sorties :</span>
          {DOSSIER_EXIT_STATUSES.map((label) => {
            const isCurrent = label === currentStatus;
            const isClickable = !isCurrent && validTargets.includes(label);
            return (
              <ExitChip
                key={label}
                label={label}
                isCurrent={isCurrent}
                isClickable={isClickable}
                onConfirm={onConfirm}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function ConfirmPopoverBody({ label, onConfirm, close }: { label: string; onConfirm: (s: string, note: string) => void; close: () => void }) {
  const [note, setNote] = useState('');
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-medium text-foreground">Passer à « {label} » ?</p>
      <Textarea
        placeholder="Motif / note (optionnel)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-[70px] text-[13px]"
      />
      <div className="flex justify-end gap-2">
        <PopoverClose render={<Button type="button" variant="outline" size="sm" />}>Annuler</PopoverClose>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            onConfirm(label, note.trim());
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
  isClickable,
  onConfirm,
}: {
  label: string;
  isCurrent: boolean;
  isPast: boolean;
  isClickable: boolean;
  onConfirm: (s: string, note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const circle = (
    <div
      className={cn(
        'flex size-[26px] shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-transform',
        isCurrent
          ? 'border-primary bg-primary text-primary-foreground'
          : isPast
            ? 'border-primary bg-[var(--brand-bg)] text-primary'
            : 'border-border bg-[var(--neutral-bg)] text-muted-foreground',
        isClickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
      )}
    >
      {isPast ? <Check className="size-3.5" /> : ''}
    </div>
  );
  const textLabel = (
    <div
      className={cn(
        'mt-1.5 whitespace-nowrap text-center text-[10.5px]',
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
        <ConfirmPopoverBody label={label} onConfirm={onConfirm} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function ExitChip({
  label,
  isCurrent,
  isClickable,
  onConfirm,
}: {
  label: string;
  isCurrent: boolean;
  isClickable: boolean;
  onConfirm: (s: string, note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const chip = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        isCurrent
          ? 'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning)]'
          : 'border-border bg-[var(--neutral-bg)] text-muted-foreground',
        isClickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-sm hover:border-[var(--warning-border)] hover:text-[var(--warning)]',
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
        <ConfirmPopoverBody label={label} onConfirm={onConfirm} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
