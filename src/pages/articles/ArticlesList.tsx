import { useNavigate } from 'react-router-dom';
import { Home, Plus } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { Button } from '../../components/ui/button';
import GrilleArticles from './GrilleArticles';

export default function ArticlesList() {
  const navigate = useNavigate();
  const admin = estAdministrateur(useAuth().user);

  return (
    <PageShell
      title="Articles"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Articles' }]}
      actions={
        admin ? (
          <Button size="sm" onClick={() => void navigate('/articles/nouveau')}>
            <Plus data-icon="inline-start" /> Nouvel article
          </Button>
        ) : undefined
      }
      fullHeight
      icon={<Home />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <GrilleArticles cleOrdre="articles" />
      </div>
    </PageShell>
  );
}
