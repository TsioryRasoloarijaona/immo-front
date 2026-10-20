import { useState } from 'react';
import { Link2, Pencil, Trash2 } from 'lucide-react';
import ActionAdmin from './ActionAdmin';
import SousArticleDialog from './SousArticleDialog';
import type { ArticleDetailDto } from '../../types';

/**
 * Actions de la fiche article. `ecranSousArticles` : fiche ouverte depuis `/sous-articles`, où un rattaché est en
 * lecture seule (aucune action) et un libre gagne « Rattachement » (`PATCH /api/sous-articles/{id}`).
 */
export default function ActionsFicheArticle({ article, ecranSousArticles, onSupprimer, onModifie }: Readonly<{
  article: ArticleDetailDto;
  ecranSousArticles: boolean;
  onSupprimer: () => void;
  onModifie: () => void;
}>) {
  const [rattachement, setRattachement] = useState(false);
  const rattache = ecranSousArticles && !!article.lotParentId;
  if (rattache && article.toujoursAffecte) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <ActionAdmin onClick={onSupprimer} libelle="Supprimer" variant="outline" icone={<Trash2 data-icon="inline-start" />} />
      {ecranSousArticles && article.estSousArticle && !rattache && (
        <ActionAdmin onClick={() => setRattachement(true)} libelle="Rattachement" variant="outline" icone={<Link2 data-icon="inline-start" />} />
      )}
      {!rattache && (
        <ActionAdmin to={`/articles/${article.id}/modifier`} libelle="Modifier" variant="outline" icone={<Pencil data-icon="inline-start" />} />
      )}
      {rattachement && <SousArticleDialog article={article} onClose={() => setRattachement(false)} onSaved={onModifie} />}
    </div>
  );
}

/** Message d'OMRAN pour un sous-article rattaché ouvert seul. */
export function BandeauRattache({ code, onOuvrirParent }: Readonly<{ code?: string | null; onOuvrirParent: () => void }>) {
  return (
    <p role="note" className="basis-full text-body text-muted-foreground">
      Ce sous-article est attaché à l'article parent <span className="font-medium text-foreground">{code}</span> : il est en
      lecture seule ici. Pour le modifier, ouvrez-le depuis la fiche de son article parent.{' '}
      <button type="button" onClick={onOuvrirParent} className="text-foreground underline">
        Ouvrir l'article parent
      </button>
    </p>
  );
}
