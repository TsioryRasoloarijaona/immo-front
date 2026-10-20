import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Plus, Unlink } from 'lucide-react';
import AffecterSousArticleDialog from './AffecterSousArticleDialog';
import { Button } from '../ui/button';
import { desaffecterSousArticle } from '../../lib/apiPatrimoine';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { formatCurrency } from '../../lib/format';
import { estAdministrateur } from '../../lib/roles';
import type { ArticleDetailDto } from '../../types';

/** Sous-articles de l'article ; un article principal libre gagne les actions d'ajout, d'affectation et de désaffectation. */
export default function SousArticlesArticle({
  article,
  onModifie,
  onOuvrir,
}: Readonly<{ article: ArticleDetailDto; onModifie: () => void; onOuvrir: (id: string) => void }>) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [affectation, setAffectation] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const sousLots = article.sousLots ?? [];
  const actions = estAdministrateur(user) && !article.estSousArticle && !article.occupe;

  async function desaffecter(sousArticleId: string) {
    const ok = await confirm({ title: 'Désaffecter', message: 'Êtes-vous sûr de vouloir désaffecter le sous-article ?', confirmLabel: 'Désaffecter' });
    if (!ok) return;
    setErreur(null);
    try {
      await desaffecterSousArticle(article.id, sousArticleId);
      onModifie();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Échec de la désaffectation.');
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {actions && (
          <div className="flex gap-2 self-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setAffectation(true)}>
              <Link2 data-icon="inline-start" /> Affecter un sous-article libre
            </Button>
            <Button type="button" size="sm" onClick={() => void navigate(`/articles/${article.id}/sous-articles/nouveau`)}>
              <Plus data-icon="inline-start" /> Ajouter un sous-article
            </Button>
          </div>
        )}
        {sousLots.length === 0 && <p className="text-label text-muted-foreground">Aucun sous-article rattaché.</p>}
        {sousLots.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-label">
            <button type="button" className="font-medium text-foreground hover:underline" onClick={() => onOuvrir(s.id)}>
              {s.code}
            </button>
            <span className="text-muted-foreground">{s.description}</span>
            <span className="font-medium tabular-nums text-foreground">{formatCurrency(s.salePrice)}</span>
            {actions && (
              <Button type="button" variant="ghost" size="sm" onClick={() => void desaffecter(s.id)}>
                <Unlink data-icon="inline-start" /> Désaffecter
              </Button>
            )}
          </div>
        ))}
        {erreur && <p role="alert" className="text-micro text-destructive">{erreur}</p>}
      </div>
      {affectation && article.trancheId && (
        <AffecterSousArticleDialog articleId={article.id} trancheId={article.trancheId}
          onClose={() => setAffectation(false)} onSaved={onModifie} />
      )}
    </>
  );
}
