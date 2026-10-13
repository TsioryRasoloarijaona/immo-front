import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { Badge } from '../../../components/ui';
import { cn } from '../../../lib/utils';
import { cible, type Cote } from './reperes';

type Visee = Readonly<{ repere?: number; cote?: Cote }>;

const viser = ({ repere, cote }: Visee) => (repere ? cible(repere, cote) : {});

/** Une boîte de dialogue dessinée à plat, sans fond ni portail. */
export function FenetreMaquette({
  titre,
  pied,
  className,
  children,
}: Readonly<{ titre: string; pied?: ReactNode; className?: string; children: ReactNode }>) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-title font-semibold">{titre}</span>
        <X className="size-4 text-muted-foreground" />
      </div>
      {children}
      {pied && <div className="flex justify-end gap-2 border-t border-border pt-3">{pied}</div>}
    </div>
  );
}

/** Libellé + valeur dans une case de saisie ; `liste` ajoute le chevron d'une liste déroulante. */
export function ChampMaquette({
  libelle,
  valeur = '',
  liste = false,
  ...visee
}: Readonly<{ libelle?: string; valeur?: string; liste?: boolean }> & Visee) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {libelle && <span className="text-label font-medium text-foreground">{libelle}</span>}
      <span
        {...viser(visee)}
        className="flex h-8 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-body text-foreground dark:bg-input/30"
      >
        <span className={cn('truncate', !valeur && 'text-muted-foreground')}>{valeur || (liste ? 'Choisir…' : '')}</span>
        {liste && <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
      </span>
    </div>
  );
}

/** En-tête d'une fiche : code, nom, badges — comme `EnteteFiche`. */
export function EnteteMaquette({ code, nom, children }: Readonly<{ code: string; nom: string; children?: ReactNode }>) {
  return (
    <span className="flex items-center gap-2">
      <ChevronRight className="size-3.5 text-muted-foreground" />
      <Badge tone="neutral" className="font-mono">{code}</Badge>
      <span className="text-title font-semibold text-foreground">{nom}</span>
      {children}
    </span>
  );
}

/** Ligne d'onglets d'une fiche (`OngletsLigne`) ; `cibles` : libellé de l'onglet visé → étape et côté. */
export function OngletsMaquette({
  onglets,
  actif,
  cibles = {},
}: Readonly<{
  onglets: readonly (readonly [string, number?])[];
  actif: string;
  cibles?: Readonly<Partial<Record<string, readonly [number, Cote?]>>>;
}>) {
  return (
    <div className="flex items-end gap-4 border-b border-border">
      {onglets.map(([libelle, compteur]) => (
        <span
          key={libelle}
          {...viser({ repere: cibles[libelle]?.[0], cote: cibles[libelle]?.[1] })}
          className={cn(
            'flex items-center gap-1.5 border-b-2 pb-1.5 text-body',
            libelle === actif ? 'border-(--brand) font-semibold text-foreground' : 'border-transparent text-foreground/60',
          )}
        >
          {libelle}
          {compteur !== undefined && (
            <span className={cn('text-micro tabular-nums', compteur > 0 ? 'rounded-full bg-secondary px-1.5 font-medium text-foreground' : 'text-muted-foreground/70')}>
              {compteur}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
