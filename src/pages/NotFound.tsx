import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import PageShell from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../components/ui/empty';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <PageShell title="Page introuvable" crumbs={[{ label: '404' }]}>
      <Empty className="border-none py-17.5">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-14 rounded-2xl bg-(--warning-bg) text-(--warning)">
            <AlertTriangle className="size-7" />
          </EmptyMedia>
          <EmptyTitle>Cette page n'existe pas</EmptyTitle>
          <EmptyDescription>L'adresse demandée ne correspond à aucune page du prototype.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => navigate('/')}>Retour au Dashboard</Button>
        </EmptyContent>
      </Empty>
    </PageShell>
  );
}
