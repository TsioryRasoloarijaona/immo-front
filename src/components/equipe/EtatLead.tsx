import { dort, libelleActions, libelleEtat } from '../../lib/activiteLeads';
import type { LeadActiviteDto } from '../../types';

/** « 3 actions · il y a 2 j » d'une ligne ; un tiret tant que l'état n'est pas lu (largeurs fixes : pas de saut). */
export default function EtatLead({ activite }: Readonly<{ activite: LeadActiviteDto | undefined }>) {
  if (!activite) {
    return (
      <span className="w-44 shrink-0 text-right text-micro text-muted-foreground" aria-hidden="true">
        —
      </span>
    );
  }
  const rouge = dort(activite);
  const ton = rouge ? 'text-destructive' : 'text-muted-foreground';
  return (
    <span className={`flex w-44 shrink-0 items-center justify-end gap-1.5 text-micro ${ton}`}>
      <span className="tabular-nums">{libelleActions(activite)}</span>
      <span aria-hidden="true">·</span>
      {rouge && <span className="size-1.5 shrink-0 rounded-full bg-destructive" aria-hidden="true" />}
      <span className={rouge ? 'font-medium' : undefined}>{libelleEtat(activite)}</span>
    </span>
  );
}
