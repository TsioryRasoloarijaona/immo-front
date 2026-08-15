import { Check } from 'lucide-react';
import { WIZARD_STEPS } from './wizardTypes';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui';

export default function WizardStepper({ activeIndex }: { activeIndex: number }) {
  return (
    <Card>
      {/* Full labeled stepper — plenty of width from sm up. */}
      <div className="hidden items-center sm:flex">
        {WIZARD_STEPS.map((step, i) => (
          <div className="flex flex-1 items-center" key={step.key}>
            <div className={cn('flex flex-col items-center', i === WIZARD_STEPS.length - 1 ? 'flex-none' : 'flex-1')}>
              <div
                className={cn(
                  'flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 text-[10.5px] font-bold',
                  i < activeIndex
                    ? 'border-primary bg-primary text-primary-foreground'
                    : i === activeIndex
                      ? 'border-primary bg-[var(--brand-bg)] text-primary'
                      : 'border-border bg-[var(--neutral-bg)] text-muted-foreground',
                )}
              >
                {i < activeIndex ? <Check className="size-3" /> : i + 1}
              </div>
              <div className={cn('mt-1.5 text-center text-[10.5px]', i === activeIndex ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </div>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={cn('mx-0.5 h-0.5 flex-1', i < activeIndex ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      {/* Compact mobile version — a labeled dot row would either overlap or
          shrink illegibly at 6 steps on a phone width, so this swaps to a
          segmented progress bar plus the current step's name and position. */}
      <div className="sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-semibold text-foreground">{WIZARD_STEPS[activeIndex].label}</span>
          <span className="text-[11.5px] text-muted-foreground">
            Étape {activeIndex + 1}/{WIZARD_STEPS.length}
          </span>
        </div>
        <div className="flex gap-1">
          {WIZARD_STEPS.map((step, i) => (
            <div
              key={step.key}
              className={cn('h-1.5 flex-1 rounded-full', i <= activeIndex ? 'bg-primary' : 'bg-border')}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
