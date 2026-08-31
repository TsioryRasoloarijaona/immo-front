import { useState, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Badge, Field, FieldGrid } from './ui';
import { Button } from './ui/button';
import { formatCurrency } from '../lib/format';
import type { ArticleDetailDto } from '../types';

/** Compact article display — code + statut badge on one line, with a
 * "Détails" toggle to expand the full field grid (description, catégorie,
 * type, surface, prix, prix commercial, titre foncier, adresse). Shared
 * across every screen that needs to show an already-picked article without
 * eating the whole layout: the prospection's tranche/article principal and
 * "Articles associés" rows, and the dossier creation form's selection. */
export default function ArticleCompactPreview({
  article,
  loading,
  emptyLabel = 'Aucun article sélectionné.',
  bare,
  actions,
  defaultExpanded,
}: {
  article: ArticleDetailDto | null;
  loading?: boolean;
  emptyLabel?: string;
  /** Drop the own border/background — use when already nested inside
   * another bordered container, to avoid a box-in-box look. */
  bare?: boolean;
  /** Extra controls (e.g. a "Retirer" button) rendered before the "Détails"
   * toggle, on the same header row. */
  actions?: ReactNode;
  /** Starts expanded — for contexts where the full detail is the point
   * (e.g. DossierDetail.tsx's "Article(s) réservé(s)", the final record),
   * as opposed to a picker/summary context where collapsed-by-default
   * keeps the layout light. */
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  if (loading) return <p className="text-body text-muted-foreground">Chargement…</p>;
  if (!article) return <span className="text-body text-muted-foreground">{emptyLabel}</span>;
  return (
    <div className={bare ? '' : 'rounded-md border border-border bg-(--neutral-bg) p-3'}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-label font-semibold text-foreground">{article.code}</span>
        {article.statut && <Badge tone={article.statut === 'DISPONIBLE' ? 'success' : 'warning'}>{article.statut}</Badge>}
        <div className="ml-auto flex items-center gap-1">
          {actions}
          <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-body" onClick={() => setExpanded((v) => !v)}>
            {expanded ? <Minus className="size-3" /> : <Plus className="size-3" />}
            {expanded ? 'Moins de détails' : 'Détails'}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="mt-2.5 border-t border-border pt-2.5">
          <FieldGrid>
            <Field label="Description" value={article.description} />
            <Field label="Tranche" value={article.trancheDescription || article.trancheCode} />
            <Field label="Catégorie" value={article.categorieLibelle} />
            <Field label="Type" value={article.typeLibelle} />
            <Field label="Surface" value={article.area ? `${article.area} m²` : undefined} />
            <Field
              label="Prix de vente"
              value={article.salePrice ? formatCurrency(article.salePrice) : article.salePriceFloor ? `${formatCurrency(article.salePriceFloor)} (plancher)` : undefined}
            />
            <Field
              label="Prix commercial"
              value={article.comSalePrice ? formatCurrency(article.comSalePrice) : article.comSalePriceFloor ? `${formatCurrency(article.comSalePriceFloor)} (plancher)` : undefined}
            />
            <Field label="Titre foncier" value={article.titreFoncier} />
            <Field label="Adresse" value={article.adresse} />
          </FieldGrid>
        </div>
      )}
    </div>
  );
}
