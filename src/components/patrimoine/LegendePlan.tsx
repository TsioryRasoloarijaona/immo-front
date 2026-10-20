import type { StatutPlan } from '../../lib/plans';
import { cn } from '../../lib/utils';

/** Légende des statuts présents ; chaque pastille filtre le plan (libellé écrit : la couleur seule ne suffit pas). */
export default function LegendePlan({ statuts, choisi, onChoisir }: Readonly<{
  statuts: readonly StatutPlan[];
  choisi: string | null;
  onChoisir: (cle: string | null) => void;
}>) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Légende des statuts">
      {statuts.map((s) => (
        <li key={s.cle}>
          <button
            type="button"
            aria-pressed={choisi === s.cle}
            onClick={() => onChoisir(choisi === s.cle ? null : s.cle)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-label text-foreground hover:bg-muted',
              choisi === s.cle && 'border-foreground bg-muted font-medium',
            )}
          >
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: s.couleur }} />
            {s.libelle}
          </button>
        </li>
      ))}
    </ul>
  );
}
