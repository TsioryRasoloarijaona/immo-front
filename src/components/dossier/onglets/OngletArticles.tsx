import ArticleCompactPreview from '../../ArticleCompactPreview';
import { ErrorState, Field, FieldGrid } from '../../ui';
import { formatCurrency, formatSurface } from '../../../lib/format';
import type { ApiState } from '../../../lib/useApi';
import type { ArticleDetailDto, DossierDetailDto } from '../../../types';

type ArticleDuDossier = NonNullable<DossierDetailDto['articles']>[number];

function ArticleResume({ article: a, chargement }: Readonly<{ article: ArticleDuDossier; chargement: boolean }>) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-label font-semibold text-foreground">{a.code}</span>
        {chargement && <span className="text-micro text-muted-foreground">chargement du détail…</span>}
      </div>
      <FieldGrid>
        <Field label="Description" value={a.description} />
        <Field label="Immeuble" value={a.immeubleLibelle || a.immeubleCode} />
        <Field label="Étage" value={a.etageLibelle || a.etageCode} />
        <Field label="Catégorie" value={a.categorieLibelle || a.categorieCode} />
        <Field label="Type" value={a.typeLibelle || a.typeCode} />
        <Field label="Surface" value={a.area ? formatSurface(a.area) : undefined} />
        <Field label="Prix" value={a.price ? formatCurrency(a.price) : undefined} />
      </FieldGrid>
    </div>
  );
}

function ListeArticles({
  articles,
  details,
  chargement,
}: Readonly<{ articles: DossierDetailDto['articles']; details: ArticleDetailDto[] | null; chargement: boolean }>) {
  if (!articles || articles.length === 0) return <p className="text-label text-muted-foreground">Aucun article lié.</p>;
  if (details && details.length > 0) {
    return <>{details.map((a) => <ArticleCompactPreview key={a.id} article={a} defaultExpanded />)}</>;
  }
  return <>{articles.map((a) => <ArticleResume key={a.id} article={a} chargement={chargement} />)}</>;
}

export default function OngletArticles({
  articles,
  details,
}: Readonly<{ articles: DossierDetailDto['articles']; details: ApiState<ArticleDetailDto[]> }>) {
  return (
    <div className="flex flex-col gap-2 p-3">
      <ListeArticles articles={articles} details={details.data} chargement={details.loading} />
      {details.error && <ErrorState message={details.error} />}
    </div>
  );
}
