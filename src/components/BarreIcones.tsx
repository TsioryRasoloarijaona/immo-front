import { useRef, type ReactNode } from 'react';
import { ICONES_SEULES, useIconesSeules } from '../lib/useIconesSeules';
import { cn } from '../lib/utils';

/** Groupe de boutons d'action en icônes seules ; le libellé de chaque bouton passe en infobulle. */
export default function BarreIcones({ className, children }: Readonly<{ className?: string; children: ReactNode }>) {
  const racine = useRef<HTMLDivElement>(null);
  useIconesSeules(racine);
  return (
    <div ref={racine} className={cn(ICONES_SEULES, className)}>
      {children}
    </div>
  );
}
