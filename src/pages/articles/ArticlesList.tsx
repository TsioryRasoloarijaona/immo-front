import { useNavigate } from 'react-router-dom';
import { Home, Paperclip, Upload } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import ListeLignesArticles from '../../components/patrimoine/ListeLignesArticles';

export default function ArticlesList() {
  const navigate = useNavigate();

  return (
    <PageShell
      title="Articles"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Articles' }]}
      fullHeight
      icon={<Home />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <div className="flex gap-2">
          <ActionAdmin to="/articles/attachement-masse" libelle="Attacher des fichiers" variant="outline" icone={<Paperclip data-icon="inline-start" />} />
          <ActionAdmin to="/articles/import?type=articles" libelle="Importer" variant="outline" icone={<Upload data-icon="inline-start" />} />
          <ActionAdmin to="/articles/nouveau" libelle="Nouvel article" />
        </div>
      }
    >
      <ListeLignesArticles liste="articles" onOuvrir={(id) => navigate(`/articles/${id}`)} />
    </PageShell>
  );
}
