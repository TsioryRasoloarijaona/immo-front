import { formatDate } from '../../lib/format';
import type { ProspectionListItemDto } from '../../types';

/** Liste à cocher des dialogues Distribuer / Réaffecter ; `bloquee` explique une case désactivée. */
export default function LignesSelectionnables({
  lignes,
  selection,
  onBasculer,
  bloquee,
}: Readonly<{
  lignes: readonly ProspectionListItemDto[];
  selection: ReadonlySet<string>;
  onBasculer: (id: string) => void;
  bloquee?: (l: ProspectionListItemDto) => string | null;
}>) {
  return (
    <ul className="flex max-h-80 flex-col overflow-y-auto rounded-md border border-border">
      {lignes.map((l) => {
        const raison = bloquee?.(l) ?? null;
        return (
          <li key={l.id} className="border-b border-border last:border-b-0">
            <label
              className={`flex items-center gap-2.5 px-2.5 py-1.5 ${raison ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-muted/60'}`}
            >
              <input
                type="checkbox"
                className="size-3.5 shrink-0"
                checked={selection.has(l.id)}
                disabled={!!raison}
                onChange={() => onBasculer(l.id)}
              />
              <span className="w-20 shrink-0 font-mono text-micro text-muted-foreground">{l.code}</span>
              <span className="min-w-0 flex-1 truncate text-body text-foreground">
                {l.prospectNom || l.tempDescription || '—'}
              </span>
              <span className="shrink-0 text-micro text-muted-foreground">{l.trancheCode ?? 'sans tranche'}</span>
              <span className="w-20 shrink-0 text-right text-micro text-muted-foreground">
                {raison ?? formatDate(l.dateDocument)}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
