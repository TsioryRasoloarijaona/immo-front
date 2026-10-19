import ModalFiche from './ModalFiche';
import { FicheArticle } from '../pages/articles/ArticleDetail';

// À charger par `lazy()` : ce module tire toute la page de détail.
// Pas de `pleineHauteur` : la fiche article n'a pas d'onglets à hauteur bornée, le dialogue défile.
export default function FicheArticleDialog({ id, onClose }: Readonly<{ id: string; onClose: () => void }>) {
  return (
    <ModalFiche title="Article" onClose={onClose} pleineHauteur={false}>
      <FicheArticle id={id} variante="dialogue" onFermer={onClose} />
    </ModalFiche>
  );
}
