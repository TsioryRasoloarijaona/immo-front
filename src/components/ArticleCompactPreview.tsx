import { useState, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Badge, Field, FieldGrid } from './ui';
import { Button } from './ui/button';
import { formatSurface, libellePrix } from '../lib/format';
import type { ArticleDetailDto } from '../types';

export default function ArticleCompactPreview({
  article,
  loading,
  emptyLabel = 'Aucun article sélectionné.',
  bare,
  actions,
  defaultExpanded,
}: Readonly<{
  article: ArticleDetailDto | null;
  loading?: boolean;
  emptyLabel?: string;
  bare?: boolean;
  actions?: ReactNode;
  defaultExpanded?: boolean;
}>) {
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  if (loading) return <p className="text-body text-muted-foreground">Chargement…</p>;
  if (!article) return <span className="text-body text-muted-foreground">{emptyLabel}</span>;
  return (
    <div className={bare ? '' : 'rounded-lg bg-(--neutral-bg) p-3'}>
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
            <Field label="Surface" value={article.area ? formatSurface(article.area) : undefined} />
            <Field label="Prix de vente" value={libellePrix(article.salePrice, article.salePriceFloor)} />
            <Field label="Prix commercial" value={libellePrix(article.comSalePrice, article.comSalePriceFloor)} />
            <Field label="Titre foncier" value={article.titreFoncier} />
            <Field label="Adresse" value={article.adresse} />
          </FieldGrid>
        </div>
      )}
    </div>
  );
}
