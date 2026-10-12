import { formatDate } from '../../lib/format';
import type { ProspectionListItemDto } from '../../types';

/** Liste à cocher des dialogues Distribuer / Réaffecter. */
export default function LignesSelectionnables({
  lignes,
  selection,
  onBasculer,
}: Readonly<{
  lignes: readonly ProspectionListItemDto[];
  selection: ReadonlySet<string>;
  onBasculer: (id: string) => void;
}>) {
  return (
    <ul className="flex max-h-80 flex-col overflow-y-auto rounded-md border border-border">
      {lignes.map((l) => (
        <li key={l.id} className="border-b border-border last:border-b-0">
          <label className="flex cursor-pointer items-center gap-2.5 px-2.5 py-1.5 hover:bg-muted/60">
            <input
              type="checkbox"
              className="size-3.5 shrink-0"
              checked={selection.has(l.id)}
              onChange={() => onBasculer(l.id)}
            />
            <span className="w-20 shrink-0 font-mono text-micro text-muted-foreground">{l.code}</span>
            <span className="min-w-0 flex-1 truncate text-body text-foreground">
              {l.prospectNom || l.tempDescription || '—'}
            </span>
            <span className="shrink-0 text-micro text-muted-foreground">{l.trancheCode ?? 'sans tranche'}</span>
            <span className="w-20 shrink-0 text-right text-micro text-muted-foreground">{formatDate(l.dateDocument)}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
