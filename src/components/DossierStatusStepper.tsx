import { useState, type CSSProperties } from 'react';
import { Check, X } from 'lucide-react';
import { Card } from './ui';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  CODE_SORTIE,
  DOSSIER_STATUS_PIPELINE,
  DOSSIER_EXIT_STATUSES,
  estStatutSortie,
  normalizeStatus,
} from '../lib/dossierStatus';
import { todayISO } from '../lib/format';
import { cn } from '../lib/utils';
import type { EtapeSuivanteDto } from '../types';

// Toute étape reste cliquable même si l'API ne la liste pas comme atteignable :
// les vrais dossiers sautent des étapes, c'est voulu.
export default function DossierStatusStepper({
  currentStatus,
  nextSteps,
  onConfirm,
}: Readonly<{
  currentStatus: string;
  nextSteps: EtapeSuivanteDto[];
  onConfirm: (newStatus: string, note: string, date?: string) => void;
}>) {
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
            const code = CODE_SORTIE[label];
            const isCurrent = normalizeStatus(code) === normalizedCurrent;
            const step = stepByStatus.get(normalizeStatus(code));
            return (
              <ExitChip
                key={label}
                label={label}
                code={code}
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

function ConfianceBadge({ confiance }: Readonly<{ confiance?: string }>) {
  if (!confiance) return null;
  const tone = CONFIANCE_TONE[confiance.toUpperCase()] ?? 'text-muted-foreground';
  return <span className={cn('text-micro font-medium', tone)}>Confiance : {confiance}</span>;
}

function ConfirmPopoverBody({
  label,
  code,
  step,
  onConfirm,
  close,
}: Readonly<{
  label: string;
  code: string;
  step?: EtapeSuivanteDto;
  onConfirm: (s: string, note: string, date?: string) => void;
  close: () => void;
}>) {
  const [note, setNote] = useState('');
  const [date, setDate] = useState(todayISO());
  // Envoyer `step.statut` tel que l'API le donne, sinon le code API, jamais le libellé affiché :
  // casse et accents diffèrent (« CONCRETISATION » / « Concrétisation », « ANNULATION » / « Annulé »).
  const statutApi = step?.statut ?? code;
  // Sortie : le serveur exige la cause (400 sinon) et libère le lot.
  const sortie = estStatutSortie(statutApi);
  const causeManquante = sortie && note.trim() === '';
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
      {sortie && (
        <p role="alert" className="rounded-md border border-(--warning-border) bg-(--warning-bg) px-2 py-1.5 text-micro font-medium text-(--warning)">
          Le lot sera libéré et remis en vente.
        </p>
      )}
      <Textarea
        aria-label={sortie ? 'Cause' : 'Motif / note'}
        placeholder={sortie ? 'Cause (obligatoire)' : 'Motif / note (optionnel)'}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-17.5 text-label"
      />
      <div className="flex justify-end gap-2">
        <PopoverClose render={<Button type="button" variant="outline" size="sm" />}>Annuler</PopoverClose>
        <Button
          type="button"
          size="sm"
          disabled={causeManquante}
          onClick={() => {
            onConfirm(statutApi, note.trim(), step?.champDate ? date || undefined : undefined);
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

function styleCercle(isCurrent: boolean, isPast: boolean): CSSProperties | undefined {
  if (isCurrent) return { borderColor: 'var(--sec-dossier)', background: 'var(--sec-dossier)' };
  if (isPast) return { borderColor: 'var(--sec-dossier)', background: 'var(--sec-dossier-bg)', color: 'var(--sec-dossier)' };
  return undefined;
}

function classeLibelle(isCurrent: boolean, isPast: boolean): string {
  if (isCurrent) return 'font-semibold text-foreground';
  return isPast ? 'text-foreground' : 'text-muted-foreground';
}

function StepNode({
  label,
  isCurrent,
  isPast,
  step,
  onConfirm,
}: Readonly<{
  label: string;
  isCurrent: boolean;
  isPast: boolean;
  step?: EtapeSuivanteDto;
  onConfirm: (s: string, note: string, date?: string) => void;
}>) {
  const [open, setOpen] = useState(false);
  const isClickable = !isCurrent;
  const circle = (
    <div
      className={cn(
        'flex size-6.5 shrink-0 items-center justify-center rounded-full border-2 text-micro font-bold transition-transform',
        isCurrent ? 'text-white' : !isPast && 'border-border bg-(--neutral-bg) text-muted-foreground',
        isClickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
      )}
      style={styleCercle(isCurrent, isPast)}
    >
      {isPast ? <Check className="size-3.5" /> : ''}
    </div>
  );
  const textLabel = (
    <div
      className={cn(
        'mt-1.5 whitespace-nowrap text-center text-micro',
        classeLibelle(isCurrent, isPast),
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
        <ConfirmPopoverBody label={label} code={label} step={step} onConfirm={onConfirm} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

function ExitChip({
  label,
  code,
  isCurrent,
  step,
  onConfirm,
}: Readonly<{
  label: string;
  code: string;
  isCurrent: boolean;
  step?: EtapeSuivanteDto;
  onConfirm: (s: string, note: string, date?: string) => void;
}>) {
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
        <ConfirmPopoverBody label={label} code={code} step={step} onConfirm={onConfirm} close={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
