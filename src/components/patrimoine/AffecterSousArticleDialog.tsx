import { useState } from 'react';
import { Link2 } from 'lucide-react';
import Modal from '../Modal';
import { DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { listSousArticlesLibres } from '../../lib/api';
import { affecterSousArticle } from '../../lib/apiPatrimoine';
import { formatCurrency, formatSurface } from '../../lib/format';
import { useApi } from '../../lib/useApi';

/** Sous-articles libres de la tranche (sans article, non toujours affectés, sans dossier) à rattacher à l'article. */
export default function AffecterSousArticleDialog({ articleId, trancheId, onClose, onSaved }: Readonly<{
  articleId: string;
  trancheId: string;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const { data, error } = useApi(() => listSousArticlesLibres(trancheId, { page: 0, size: 200 }), [trancheId]);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [toujoursAffecte, setToujoursAffecte] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function affecter() {
    if (!choisi) return;
    setEnvoi(true);
    setErreur(null);
    try {
      await affecterSousArticle(articleId, choisi, toujoursAffecte);
      onSaved();
      onClose();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'affectation.");
      setEnvoi(false);
    }
  }

  return (
    <Modal title="Affecter un sous-article libre" onClose={onClose} width={480}>
      <div className="flex flex-col gap-3">
        {error && <ErrorState message={error} />}
        {!error && !data && <LoadingState />}
        {!error && data && data.content.length === 0 && <EmptyState title="Aucun sous-article libre dans cette tranche" />}
        {!error && data && data.content.length > 0 && (
          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {data.content.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 hover:bg-muted/60">
                <input type="radio" name="sous-article" checked={choisi === s.id} onChange={() => setChoisi(s.id)} />
                <span className="w-24 shrink-0 font-mono text-micro text-muted-foreground">{s.code}</span>
                <span className="flex-1 truncate text-body text-foreground">{s.description}</span>
                <span className="text-micro text-muted-foreground">{s.area ? formatSurface(s.area) : ''}</span>
                <span className="text-micro tabular-nums text-foreground">{formatCurrency(s.salePrice)}</span>
              </label>
            ))}
          </div>
        )}
        <label className="flex items-center gap-2 text-label text-foreground">
          <input type="checkbox" checked={toujoursAffecte} onChange={(e) => setToujoursAffecte(e.target.checked)} />
          Toujours affecté (suit l'article dans la vente)
        </label>
        {erreur && <p role="alert" className="text-micro text-destructive">{erreur}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="button" onClick={() => void affecter()} disabled={!choisi || envoi}>
          <Link2 data-icon="inline-start" /> Affecter
        </Button>
      </DialogFooter>
    </Modal>
  );
}
