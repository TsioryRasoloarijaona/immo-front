import { useNavigate, useParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import AdminGuard from '../utilisateurs/AdminGuard';
import { ErrorState, LoadingState } from '../../components/ui';
import { createSousArticle, getArticle } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import FormulaireArticle from './FormulaireArticle';

export default function SousArticleForm() {
  const { id = '' } = useParams();
  return (
    <AdminGuard
      title="Nouveau sous-article"
      icon={<Home />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Articles', to: '/articles' }, { label: 'Article', to: `/articles/${id}` }, { label: 'Nouveau sous-article' }]}
    >
      <CreationSousArticle key={id} parentId={id} />
    </AdminGuard>
  );
}

function CreationSousArticle({ parentId }: Readonly<{ parentId: string }>) {
  const navigate = useNavigate();
  const { data: parent, error } = useApi(() => getArticle(parentId), [parentId]);
  if (error) return <ErrorState message={error} />;
  if (!parent) return <LoadingState />;
  return (
    <>
      <p className="mb-3 text-body text-muted-foreground">
        Rattaché à l’article <span className="font-medium text-foreground">{parent.code}</span> : même tranche, même
        vocation, même nature.
      </p>
      <FormulaireArticle
        sousArticle
        creation
        initial={{ immeubleId: parent.immeubleId, surfaceProvisoire: 1, estTitre: false, toujoursAffecte: false }}
        trancheVerrouillee
        dossierOccupant={null}
        // Tranche et vocation absentes du formulaire de sous-article : le serveur prend celles du parent.
        enregistrer={(form) => createSousArticle(parentId, form)}
        apres={() => void navigate(`/articles/${parentId}`)}
        annuler={() => void navigate(`/articles/${parentId}`)}
      />
    </>
  );
}
