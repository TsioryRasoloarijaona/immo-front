import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import RefSelect from './RefSelect';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';

// Classes littérales, indexées par le nombre de cellules posées avant : Tailwind ne voit pas les classes calculées.
const RESTE_BASE = ['col-span-2', 'col-span-1'];
const RESTE_LG = ['lg:col-span-4', 'lg:col-span-3', 'lg:col-span-2', 'lg:col-span-1'];
function classeReste(apres: number | undefined) {
  return apres === undefined ? undefined : cn(RESTE_BASE[apres % 2], RESTE_LG[apres % 4]);
}

const ETIQUETTE ='mb-0.5 flex items-center gap-1 text-micro font-medium text-muted-foreground';

function Enveloppe({
  label,
  htmlFor,
  modifie,
  verrouille,
  aide,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  modifie?: boolean;
  verrouille?: boolean;
  aide?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'min-w-0 border-l-2 pl-2 transition-colors',
        modifie ? 'border-l-(--warning)' : 'border-l-transparent',
        className,
      )}
    >
      <label className={ETIQUETTE} htmlFor={htmlFor} title={aide}>
        {label}
        {verrouille && <Lock aria-hidden className="size-2.5 shrink-0 opacity-60" />}
        {modifie && <span className="text-(--warning)">•</span>}
      </label>
      {children}
    </div>
  );
}

export function ChampLecture({
  label,
  valeur,
  aide,
  className,
  apres,
  multiligne,
}: {
  label: string;
  valeur: ReactNode;
  aide?: string;
  className?: string;
  /** Nombre de cellules posées avant celle-ci : elle prend alors le reste de la ligne. */
  apres?: number;
  multiligne?: boolean;
}) {
  const vide = valeur === null || valeur === undefined || valeur === '' || valeur === '—';
  return (
    <Enveloppe label={label} verrouille aide={aide} className={cn(classeReste(apres), className)}>
      <div
        className={cn(
          'min-h-7 py-1 text-label',
          multiligne ? 'max-h-24 overflow-y-auto whitespace-pre-wrap' : 'truncate',
          vide ? 'font-normal text-muted-foreground' : 'font-medium text-foreground',
        )}
        title={typeof valeur === 'string' && !multiligne ? valeur : undefined}
      >
        {vide ? '—' : valeur}
      </div>
    </Enveloppe>
  );
}

export function ChampRef({
  id,
  label,
  valeur,
  onChange,
  items,
  modifie,
  aide,
  className,
}: {
  id: string;
  label: string;
  valeur: string | null;
  onChange: (v: string | null) => void;
  items: { label: string; value: string }[];
  modifie?: boolean;
  aide?: string;
  className?: string;
}) {
  return (
    <Enveloppe label={label} htmlFor={id} modifie={modifie} aide={aide} className={className}>
      <RefSelect id={id} value={valeur} onChange={onChange} items={items} size="sm" />
    </Enveloppe>
  );
}

export function ChampTexte({
  id,
  label,
  valeur,
  onChange,
  modifie,
  aide,
  placeholder,
  className,
}: {
  id: string;
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  modifie?: boolean;
  aide?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Enveloppe label={label} htmlFor={id} modifie={modifie} aide={aide} className={className}>
      <Input id={id} value={valeur} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-7" />
    </Enveloppe>
  );
}

export function ChampNotes({
  id,
  label,
  valeur,
  onChange,
  modifie,
  lignes = 1,
  className,
  apres,
}: {
  id: string;
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  modifie?: boolean;
  lignes?: number;
  className?: string;
  apres?: number;
}) {
  return (
    <Enveloppe label={label} htmlFor={id} modifie={modifie} className={cn(classeReste(apres), className)}>
      <Textarea
        id={id}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        rows={lignes}
        className="max-h-24 min-h-7 resize-none overflow-y-auto py-1 text-label md:text-label"
      />
    </Enveloppe>
  );
}

export function GrilleFiche({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PiedFiche({ children }: { children: ReactNode }) {
  return (
    <p className="col-span-full flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pt-0.5 text-micro text-muted-foreground">
      {children}
    </p>
  );
}
