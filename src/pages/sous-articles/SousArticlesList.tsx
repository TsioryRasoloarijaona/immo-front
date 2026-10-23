import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Upload } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import ListeLignesArticles from '../../components/patrimoine/ListeLignesArticles';
import SousArticleDialog from '../../components/patrimoine/SousArticleDialog';

export default function SousArticlesList() {
  const navigate = useNavigate();
  const [creation, setCreation] = useState(false);

  return (
    <PageShell
      title="Sous-articles"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Sous-articles' }]}
      fullHeight
      icon={<Layers />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <div className="flex gap-2">
          <ActionAdmin to="/articles/import?type=sous-articles" libelle="Importer" variant="outline" icone={<Upload data-icon="inline-start" />} />
          <ActionAdmin onClick={() => setCreation(true)} libelle="Nouveau sous-article" />
        </div>
      }
    >
      <ListeLignesArticles liste="sous-articles" onOuvrir={(id) => navigate(`/sous-articles/${id}`)} />
      {creation && (
        <SousArticleDialog onClose={() => setCreation(false)} onSaved={(a) => void navigate(`/sous-articles/${a.id}`)} />
      )}
    </PageShell>
  );
}
