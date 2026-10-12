import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import AdminGuard from '../utilisateurs/AdminGuard';
import { ErrorState, LoadingState } from '../../components/ui';
import { createArticle, getArticle, updateArticle } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import FormulaireArticle from './FormulaireArticle';
import { dossierOccupant, versEcriture } from './champsArticle';

const ENTETE = { icon: <Home />, accent: 'var(--sec-tranche)', accentBg: 'var(--sec-tranche-bg)' };
const FIL = [{ label: 'Patrimoine' }, { label: 'Articles', to: '/articles' }];

export default function ArticleForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  if (id) {
    return (
      <AdminGuard title="Modifier l’article" {...ENTETE} crumbs={[...FIL, { label: 'Modifier' }]}>
        <EditionArticle key={id} id={id} />
      </AdminGuard>
    );
  }
  const trancheId = params.get('trancheId') ?? undefined;
  return (
    <AdminGuard title="Nouvel article" {...ENTETE} crumbs={[...FIL, { label: 'Nouveau' }]}>
      <FormulaireArticle
        sousArticle={false}
        creation
        initial={{ trancheId, surfaceProvisoire: 1, estTitre: true }}
        trancheVerrouillee={false}
        dossierOccupant={null}
        enregistrer={(form) => createArticle(form)}
        apres={(article) => void navigate(`/articles/${article.id}`)}
        annuler={() => void navigate(trancheId ? `/tranches/${trancheId}` : '/articles')}
      />
    </AdminGuard>
  );
}

function EditionArticle({ id }: Readonly<{ id: string }>) {
  const navigate = useNavigate();
  const { data, error } = useApi(() => getArticle(id), [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  return (
    <FormulaireArticle
      sousArticle={data.estSousArticle === true}
      creation={false}
      initial={versEcriture(data)}
      trancheVerrouillee
      dossierOccupant={dossierOccupant(data)}
      enregistrer={(form) => updateArticle(id, form)}
      apres={() => void navigate(`/articles/${id}`)}
      annuler={() => void navigate(`/articles/${id}`)}
    />
  );
}
