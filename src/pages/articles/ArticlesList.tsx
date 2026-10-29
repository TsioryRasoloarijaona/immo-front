import { useNavigate } from 'react-router-dom';
import { Paperclip } from 'lucide-react';
import ListeLignesArticles from '../../components/patrimoine/ListeLignesArticles';

export default function ArticlesList() {
  const navigate = useNavigate();

  return (
    <ListeLignesArticles
      liste="articles"
      admin={{
        nouveau: { libelle: 'Nouvel article', onClick: () => void navigate('/articles/nouveau') },
        actions: [{ id: 'importer', onClick: () => void navigate('/articles/import?type=articles') }],
        propres: [{ id: 'fichiers', libelle: 'Attacher des fichiers', icone: Paperclip, onClick: () => void navigate('/articles/attachement-masse') }],
      }}
    />
  );
}
