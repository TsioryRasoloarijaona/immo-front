import ModalFiche from './ModalFiche';
import { FicheArticle } from '../pages/articles/ArticleDetail';

// À charger par `lazy()` : ce module tire toute la page de détail.
export default function FicheArticleDialog({ id, onClose }: Readonly<{ id: string; onClose: () => void }>) {
  return (
    <ModalFiche title="Article" onClose={onClose}>
      <FicheArticle id={id} variante="dialogue" onFermer={onClose} />
    </ModalFiche>
  );
}
