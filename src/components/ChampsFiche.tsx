import { createContext, useContext, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import RefSelect from './RefSelect';
import { Textarea } from './ui/textarea';
import { cn } from '../lib/utils';
import { ETIQUETTE_CHAMP, GRILLE_CHAMPS, LIGNE_CHAMP, TEXTE_ETIQUETTE, VALEUR_CHAMP } from '../lib/ficheChamp';

// Libellé au-dessus de la valeur : la valeur garde toute la largeur de sa colonne, rien n'est tronqué.
const GrilleEmpilee = createContext(false);

function Enveloppe({
  label,
  htmlFor,
  modifie,
  verrouille,
  aide,
  className,
  children,
}: Readonly<{
  label: string;
  htmlFor?: string;
  modifie?: boolean;
  verrouille?: boolean;
  aide?: string;
  className?: string;
  children: ReactNode;
}>) {
  const empilee = useContext(GrilleEmpilee);
  return (
    <div
      className={cn(
        empilee ? 'flex min-w-0 flex-col gap-1' : LIGNE_CHAMP,
        'border-l-2 pl-1.5 transition-colors',
        modifie ? 'border-l-(--warning)' : 'border-l-transparent',
        className,
      )}
    >
      <label className={cn(ETIQUETTE_CHAMP, 'flex items-center gap-1')} htmlFor={htmlFor} title={aide ?? label}>
        <span className={TEXTE_ETIQUETTE}>{label}</span>
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
  multiligne,
}: Readonly<{
  label: string;
  valeur: ReactNode;
  aide?: string;
  className?: string;
  /** Texte long : la cellule prend toute la largeur de la grille. */
  multiligne?: boolean;
}>) {
  const empilee = useContext(GrilleEmpilee);
  const vide = valeur === null || valeur === undefined || valeur === '' || valeur === '—';
  let debordement = 'truncate';
  if (multiligne) debordement = 'max-h-24 overflow-y-auto whitespace-pre-wrap';
  else if (empilee) debordement = '[overflow-wrap:anywhere]';
  return (
    <Enveloppe label={label} verrouille aide={aide} className={cn(multiligne && 'col-span-full items-start', className)}>
      <div
        className={cn(
          VALEUR_CHAMP,
          'py-0.5',
          debordement,
          vide && 'font-normal text-muted-foreground',
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
}: Readonly<{
  id: string;
  label: string;
  valeur: string | null;
  onChange: (v: string | null) => void;
  items: { label: string; value: string }[];
  modifie?: boolean;
  aide?: string;
  className?: string;
}>) {
  return (
    <Enveloppe label={label} htmlFor={id} modifie={modifie} aide={aide} className={className}>
      <RefSelect id={id} value={valeur} onChange={onChange} items={items} size="sm" />
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
}: Readonly<{
  id: string;
  label: string;
  valeur: string;
  onChange: (v: string) => void;
  modifie?: boolean;
  lignes?: number;
  className?: string;
}>) {
  return (
    <Enveloppe label={label} htmlFor={id} modifie={modifie} className={cn('col-span-full items-start', className)}>
      <Textarea
        id={id}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        rows={lignes}
        className="max-h-24 min-h-7 resize-none overflow-y-auto py-1 text-body md:text-body"
      />
    </Enveloppe>
  );
}

export function GrilleFiche({
  children,
  className,
  empilee = false,
}: Readonly<{ children: ReactNode; className?: string; empilee?: boolean }>) {
  return (
    <GrilleEmpilee.Provider value={empilee}>
      <div className={cn(GRILLE_CHAMPS, empilee && 'gap-y-2.5', className)}>{children}</div>
    </GrilleEmpilee.Provider>
  );
}

export function PiedFiche({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <p className="col-span-full flex flex-wrap items-center gap-x-1.5 gap-y-0.5 pt-0.5 text-micro text-muted-foreground">
      {children}
    </p>
  );
}
