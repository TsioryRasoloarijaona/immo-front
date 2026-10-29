import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListeLignesArticles from '../../components/patrimoine/ListeLignesArticles';
import SousArticleDialog from '../../components/patrimoine/SousArticleDialog';

export default function SousArticlesList() {
  const navigate = useNavigate();
  const [creation, setCreation] = useState(false);

  return (
    <ListeLignesArticles
      liste="sous-articles"
      admin={{
        nouveau: { libelle: 'Nouveau sous-article', onClick: () => setCreation(true) },
        actions: [{ id: 'importer', onClick: () => void navigate('/articles/import?type=sous-articles') }],
      }}
      dialogues={creation && (
        <SousArticleDialog onClose={() => setCreation(false)} onSaved={(a) => void navigate(`/sous-articles/${a.id}`)} />
      )}
    />
  );
}
