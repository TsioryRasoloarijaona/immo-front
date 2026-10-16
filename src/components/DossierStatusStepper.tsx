import { useState, type CSSProperties } from 'react';
import { Check, X } from 'lucide-react';
import { Card } from './ui';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import ConfirmationStatut, { type ConfirmerStatut } from './dossier/ConfirmationStatut';
import {
  CODE_SORTIE,
  DOSSIER_STATUS_PIPELINE,
  DOSSIER_EXIT_STATUSES,
  normalizeStatus,
} from '../lib/dossierStatus';
import { useAuth } from '../lib/auth';
import { estAdministrateur } from '../lib/roles';
import { cn } from '../lib/utils';
import type { EtapeSuivanteDto } from '../types';

// Seules les étapes renvoyées par le serveur sont cliquables : il les filtre par le paramétrage des
// transitions et par les rôles de l'utilisateur, et refuserait les autres (409 / 403).
export default function DossierStatusStepper({
  currentStatus,
  nextSteps,
  onConfirm,
}: Readonly<{
  currentStatus: string;
  nextSteps: EtapeSuivanteDto[];
  onConfirm: ConfirmerStatut;
}>) {
  const { user } = useAuth();
  const administrateur = estAdministrateur(user);
  const normalizedCurrent = normalizeStatus(currentStatus);
  const currentIndex = DOSSIER_STATUS_PIPELINE.findIndex((label) => normalizeStatus(label) === normalizedCurrent);
  const stepByStatus = new Map(nextSteps.map((s) => [normalizeStatus(s.statut), s]));

  return (
    <Card title="Statut du dossier" accent="var(--sec-dossier)">
      <div className="flex flex-col gap-5">
        <div className="flex items-center overflow-x-auto pb-1">
          {DOSSIER_STATUS_PIPELINE.map((label, i) => {
            const isPast = currentIndex >= 0 && i < currentIndex;
            return (
              <div className="flex shrink-0 items-center last:flex-1" key={label}>
                <StepNode
                  label={label}
                  isCurrent={normalizeStatus(label) === normalizedCurrent}
                  isPast={isPast}
                  step={stepByStatus.get(normalizeStatus(label))}
                  administrateur={administrateur}
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
            const code = CODE_SORTIE[label];
            return (
              <ExitChip
                key={label}
                label={label}
                isCurrent={normalizeStatus(code) === normalizedCurrent}
                step={stepByStatus.get(normalizeStatus(code))}
                administrateur={administrateur}
                onConfirm={onConfirm}
              />
            );
          })}
        </div>
        {nextSteps.length === 0 && (
          <p className="text-micro text-muted-foreground">
            Aucune transition possible depuis ce statut pour vos rôles.
          </p>
        )}
      </div>
    </Card>
  );
}

function styleCercle(isCurrent: boolean, isPast: boolean): CSSProperties | undefined {
  if (isCurrent) return { borderColor: 'var(--sec-dossier)', background: 'var(--sec-dossier)' };
  if (isPast) return { borderColor: 'var(--sec-dossier)', background: 'var(--sec-dossier-bg)', color: 'var(--sec-dossier)' };
  return undefined;
}

function classeLibelle(isCurrent: boolean, isPast: boolean, atteignable: boolean): string {
  if (isCurrent) return 'font-semibold text-foreground';
  if (atteignable) return 'font-medium text-foreground';
  return isPast ? 'text-foreground' : 'text-muted-foreground';
}

function StepNode({
  label,
  isCurrent,
  isPast,
  step,
  administrateur,
  onConfirm,
}: Readonly<{
  label: string;
  isCurrent: boolean;
  isPast: boolean;
  step?: EtapeSuivanteDto;
  administrateur: boolean;
  onConfirm: ConfirmerStatut;
}>) {
  const [open, setOpen] = useState(false);
  const atteignable = !isCurrent && step !== undefined;
  const circle = (
    <div
      className={cn(
        'flex size-6.5 shrink-0 items-center justify-center rounded-full border-2 text-micro font-bold transition-transform',
        isCurrent ? 'text-white' : !isPast && 'border-border bg-(--neutral-bg) text-muted-foreground',
        atteignable && 'cursor-pointer border-(--sec-dossier) hover:-translate-y-0.5 hover:shadow-md',
      )}
      style={styleCercle(isCurrent, isPast)}
    >
      {isPast ? <Check className="size-3.5" /> : ''}
    </div>
  );
  const textLabel = (
    <div className={cn('mt-1.5 whitespace-nowrap text-center text-micro', classeLibelle(isCurrent, isPast, atteignable))}>
      {label}
    </div>
  );

  if (!atteignable) {
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
        <ConfirmationStatut label={label} step={step} administrateur={administrateur} onConfirm={onConfirm} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function ExitChip({
  label,
  isCurrent,
  step,
  administrateur,
  onConfirm,
}: Readonly<{
  label: string;
  isCurrent: boolean;
  step?: EtapeSuivanteDto;
  administrateur: boolean;
  onConfirm: ConfirmerStatut;
}>) {
  const [open, setOpen] = useState(false);
  const atteignable = !isCurrent && step !== undefined;
  const chip = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        isCurrent
          ? 'border-(--warning-border) bg-(--warning-bg) text-(--warning)'
          : 'border-border bg-(--neutral-bg) text-muted-foreground',
        atteignable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-sm hover:border-(--warning-border) hover:text-(--warning)',
        !isCurrent && !atteignable && 'opacity-60',
      )}
    >
      <X className="size-3" />
      {label}
    </span>
  );

  if (!atteignable) return chip;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<button type="button" aria-label={`Passer au statut ${label}`} />} className="outline-none">
        {chip}
      </PopoverTrigger>
      <PopoverContent>
        <ConfirmationStatut label={label} step={step} administrateur={administrateur} onConfirm={onConfirm} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
