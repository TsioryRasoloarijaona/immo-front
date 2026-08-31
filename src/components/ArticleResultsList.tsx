import { Badge } from './ui';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/format';
import type { ArticleListItemDto } from '../types';

/** Scrollable article-picker table — code/description/catégorie/type/
 * surface/prix/statut, one row selectable at a time. Shared by
 * `ArticleCascadePicker`/`ChoixArticleSection` and `DevisFormSection`
 * (`ProspectionDetail.tsx`), and the "Nouvelle offre" flow on `/offres`
 * (`OffresList.tsx`) — every place that filters a tranche's articles down
 * to one pick. */
export default function ArticleResultsList({
  items,
  loading,
  selectedId,
  onSelect,
  allowNone,
  noneLabel,
}: {
  items: ArticleListItemDto[];
  loading?: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  if (loading) return <p className="text-body text-muted-foreground">Chargement…</p>;
  if (items.length === 0) return <p className="text-body text-muted-foreground">Aucun résultat pour ces filtres.</p>;
  return (
    <div className="max-h-70 overflow-y-auto rounded-md border border-border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow className="hover:bg-transparent">
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Surface</TableHead>
            <TableHead className="text-right">Prix de vente</TableHead>
            <TableHead>Statut</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allowNone && (
            <TableRow
              tabIndex={0}
              role="button"
              className={cn('cursor-pointer', selectedId === null && 'bg-primary/10')}
              onClick={() => onSelect(null)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelect(null); }}
            >
              <TableCell colSpan={7} className="text-muted-foreground">{noneLabel}</TableCell>
            </TableRow>
          )}
          {items.map((a) => (
            <TableRow
              key={a.id}
              tabIndex={0}
              role="button"
              className={cn('cursor-pointer', selectedId === a.id && 'bg-primary/10')}
              onClick={() => onSelect(a.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelect(a.id); }}
            >
              <TableCell className="font-medium text-foreground">{a.code}</TableCell>
              <TableCell className="text-muted-foreground">{a.description || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{a.categorieLibelle || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{a.typeLibelle || '—'}</TableCell>
              <TableCell className="text-right tabular-nums">{a.area ? `${a.area} m²` : '—'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {a.salePrice ? formatCurrency(a.salePrice) : a.salePriceFloor ? `${formatCurrency(a.salePriceFloor)} (plancher)` : '—'}
              </TableCell>
              <TableCell>
                {a.statut && <Badge tone={a.statut === 'DISPONIBLE' ? 'success' : 'warning'}>{a.statut}</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
