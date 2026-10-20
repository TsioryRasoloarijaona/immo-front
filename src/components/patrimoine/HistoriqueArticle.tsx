import EtatListe from './EtatListe';
import HistoriqueStatuts from '../HistoriqueStatuts';
import { listHistoriqueArticle } from '../../lib/apiArticleOnglets';
import { useApi } from '../../lib/useApi';

/** Changements de statut des dossiers de l'article, du plus récent au plus ancien. */
export default function HistoriqueArticle({ articleId }: Readonly<{ articleId: string }>) {
  const historique = useApi(() => listHistoriqueArticle(articleId), [articleId]);
  return (
    <EtatListe etat={historique} vide={{ titre: 'Aucun historique', message: "Aucun changement de statut n'est enregistré pour cet article." }}>
      {(lignes) => <HistoriqueStatuts lignes={lignes} avecOrigine sansArticle />}
    </EtatListe>
  );
}
