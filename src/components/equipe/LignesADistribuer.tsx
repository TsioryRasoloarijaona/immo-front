import { Badge } from '../ui';
import { formatDate } from '../../lib/format';
import type { LigneADistribuerDto, UUID } from '../../types';

/** Lignes cochables de la carte « À distribuer » ; badge « Déjà traitée » quand « Voir tout » est allumé. */
export default function LignesADistribuer({
  lignes,
  selection,
  onBasculer,
  onOuvrir,
}: Readonly<{
  lignes: readonly LigneADistribuerDto[];
  selection: ReadonlySet<string>;
  onBasculer: (id: UUID) => void;
  onOuvrir: (id: UUID) => void;
}>) {
  return (
    <ul className="flex max-h-[60vh] flex-col overflow-y-auto rounded-md border border-border">
      {lignes.map((l) => {
        const nom = l.nom || '—';
        return (
          <li key={l.id} className="flex items-center gap-2.5 border-b border-border px-2.5 py-1.5 last:border-b-0 hover:bg-muted/60">
            <input
              type="checkbox"
              className="size-3.5 shrink-0"
              aria-label={`Sélectionner ${nom}`}
              checked={selection.has(l.id)}
              onChange={() => onBasculer(l.id)}
            />
            <span className="w-20 shrink-0 font-mono text-micro text-muted-foreground">{l.code}</span>
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-body font-medium text-foreground underline-offset-2 hover:underline"
              onClick={() => onOuvrir(l.id)}
            >
              {nom}
            </button>
            {l.dejaTraitee && <Badge tone="neutral">Déjà traitée</Badge>}
            <span className="shrink-0 text-micro text-muted-foreground">{l.trancheCode ?? 'sans tranche'}</span>
            <span className="w-20 shrink-0 text-right text-micro text-muted-foreground">{formatDate(l.dateDocument)}</span>
          </li>
        );
      })}
    </ul>
  );
}
