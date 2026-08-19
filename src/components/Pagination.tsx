import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

// Shared pager for every paginated list view — the API's PageDto is
// 0-indexed (page/size/totalElements/totalPages), this renders it as a
// 1-indexed "Page X sur Y" control with Précédent/Suivant.
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
      <div className="text-[11.5px] text-muted-foreground">
        Page {page + 1} sur {totalPages} · {totalElements} résultat{totalElements > 1 ? 's' : ''}
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6.5 px-2 text-[12px]"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft data-icon="inline-start" /> Précédent
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-6.5 px-2 text-[12px]"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
