import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Plus, Unlink } from 'lucide-react';
import Modal from '../../components/Modal';
import { Card, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { affecterSousArticle, desaffecterSousArticle, listSousArticlesLibres } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { formatCurrency, formatSurface } from '../../lib/format';
import { errorMessage, useApi } from '../../lib/useApi';
import type { ArticleDetailDto, ArticleListItemDto } from '../../types';

function LigneSousArticle({
  sous,
  action,
}: Readonly<{ sous: ArticleListItemDto; action?: ReactNode }>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-label">
      <span className="font-medium text-foreground">{sous.code}</span>
      <span className="text-muted-foreground">{sous.description}</span>
      <span className="text-muted-foreground">{sous.area ? formatSurface(sous.area) : '—'}</span>
      <span className="font-medium tabular-nums text-foreground">{formatCurrency(sous.salePrice)}</span>
      {action}
    </div>
  );
}

function DialogueAffectation({
  article,
  onFermer,
  onAffecte,
}: Readonly<{ article: ArticleDetailDto; onFermer: () => void; onAffecte: () => void }>) {
  const libres = useApi(() => listSousArticlesLibres(article.trancheId ?? '', { page: 0, size: 100 }), [article.trancheId]);
  const [toujoursAffecte, setToujoursAffecte] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function affecter(sousId: string) {
    setEnCours(sousId);
    setErreur(null);
    try {
      await affecterSousArticle(article.id, sousId, { toujoursAffecte });
      onAffecte();
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setEnCours(null);
    }
  }

  return (
    <Modal title="Affecter un sous-article libre" onClose={onFermer} width={560}>
      <label htmlFor="sous-toujours" className="mb-3 flex items-center gap-2 text-label">
        <input id="sous-toujours" type="checkbox" className="size-4 accent-primary" checked={toujoursAffecte}
          onChange={(e) => setToujoursAffecte(e.target.checked)} />
        Toujours affecté (suit l’article dans la vente)
      </label>
      {libres.error && <ErrorState message={libres.error} />}
      {!libres.error && !libres.data && <LoadingState />}
      {!libres.error && libres.data && libres.data.content.length === 0 && (
        <EmptyState title="Aucun sous-article libre" message="Tous les lots annexes de la tranche sont rattachés ou affectés." />
      )}
      {!libres.error && libres.data && libres.data.content.length > 0 && (
        <div className="flex max-h-90 flex-col gap-2 overflow-y-auto">
          {libres.data.content.map((s) => (
            <LigneSousArticle key={s.id} sous={s} action={
              <Button size="sm" variant="outline" disabled={enCours !== null} onClick={() => void affecter(s.id)}>
                <Link2 data-icon="inline-start" /> {enCours === s.id ? 'Affectation…' : 'Affecter'}
              </Button>
            } />
          ))}
        </div>
      )}
      {erreur && <p role="alert" className="mt-3 text-body text-destructive">{erreur}</p>}
    </Modal>
  );
}

/** Sous-articles rattachés, avec les actions d'écriture réservées à l'administrateur (FEATURE-patrimoine-ecriture.md §8). */
export default function SousArticlesArticle({
  article,
  admin,
  onModifie,
}: Readonly<{ article: ArticleDetailDto; admin: boolean; onModifie: () => void }>) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [dialogue, setDialogue] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const sousLots = article.sousLots ?? [];
  const principal = !article.estSousArticle && !article.lotParentId;
  const actif = admin && principal && !article.occupe;

  async function desaffecter(sous: ArticleListItemDto) {
    const ok = await confirm({
      title: 'Désaffecter le sous-article',
      message: 'Êtes-vous sûr de vouloir désaffecter le sous-article ?',
      confirmLabel: 'Désaffecter',
      cancelLabel: 'Annuler',
    });
    if (!ok) return;
    setErreur(null);
    try {
      await desaffecterSousArticle(article.id, sous.id);
      onModifie();
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  if (!principal && sousLots.length === 0) return null;

  return (
    <Card
      title={`Sous-articles (${sousLots.length})`}
      action={actif ? (
        <span className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setDialogue(true)}>
            <Link2 data-icon="inline-start" /> Affecter un sous-article libre
          </Button>
          <Button size="sm" onClick={() => navigate(`/articles/${article.id}/sous-articles/nouveau`)}>
            <Plus data-icon="inline-start" /> Ajouter un sous-article
          </Button>
        </span>
      ) : undefined}
    >
      {admin && principal && article.occupe && (
        <p className="mb-2 text-micro text-muted-foreground">Article affecté à un dossier : ses sous-articles ne se modifient plus.</p>
      )}
      {sousLots.length === 0 ? (
        <EmptyState title="Aucun sous-article" />
      ) : (
        <div className="flex flex-col gap-2">
          {sousLots.map((s) => (
            <LigneSousArticle key={s.id} sous={s} action={actif ? (
              <Button size="sm" variant="ghost" onClick={() => void desaffecter(s)}>
                <Unlink data-icon="inline-start" /> Désaffecter
              </Button>
            ) : undefined} />
          ))}
        </div>
      )}
      {erreur && <p role="alert" className="mt-2 text-body text-destructive">{erreur}</p>}
      {dialogue && (
        <DialogueAffectation
          article={article}
          onFermer={() => setDialogue(false)}
          onAffecte={() => {
            setDialogue(false);
            onModifie();
          }}
        />
      )}
    </Card>
  );
}
