import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { formatNumber } from '../lib/format';

// Shared pager for every paginated list view — the API's PageDto is
// 0-indexed (page/size/totalElements/totalPages), this renders it as a
// numbered "1 2 3 … N" control (1-indexed for display) plus
// Précédent/Suivant, always keeping the first, last and current ±1 pages
// visible and collapsing the rest behind "…".
function pageWindow(current: number, total: number): (number | 'ellipsis')[] {
  const items = new Set<number>([0, total - 1, current, current - 1, current + 1]);
  const sorted = [...items].filter((p) => p >= 0 && p <= total - 1).sort((a, b) => a - b);

  const out: (number | 'ellipsis')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('ellipsis');
    out.push(p);
  });
  return out;
}

export default function Pagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
      <div className="text-micro text-muted-foreground">
        Page {formatNumber(page + 1)} sur {formatNumber(totalPages)} · {formatNumber(totalElements)} résultat{totalElements > 1 ? 's' : ''}
      </div>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="h-6.5 w-6.5"
          disabled={page <= 0}
          aria-label="Page précédente"
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
        </Button>
        {pageWindow(page, totalPages).map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e${i}`} className="px-1 text-body text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={p}
              type="button"
              /* `secondary`/`ghost` et non `default`/`outline` : depuis que
                 --primary est l'encre (20/09), le variant default rendait la
                 page active en pastille noire pleine où le chiffre se perdait.
                 Pastille grise douce + chiffre en encre, lisible dans les deux
                 thèmes ; les pages inactives en fantôme, façon Uxerflow. */
              variant={p === page ? 'secondary' : 'ghost'}
              size="icon-sm"
              className={cn(
                'h-6.5 w-6.5 text-body tabular-nums',
                p === page ? 'pointer-events-none font-semibold text-foreground' : 'text-muted-foreground',
              )}
              aria-label={`Page ${p + 1}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </Button>
          ),
        )}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="h-6.5 w-6.5"
          disabled={page >= totalPages - 1}
          aria-label="Page suivante"
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight />
        </Button>
      </nav>
    </div>
  );
}
