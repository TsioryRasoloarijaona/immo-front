import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { Button } from '../components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../components/ui/empty';
import { APP_MODULES } from '../lib/modules';

export default function ComingSoon() {
  const { module } = useParams();
  const navigate = useNavigate();
  const mod = APP_MODULES.find((m) => m.slug === module);
  const label = mod?.label ?? 'Ce module';
  const Icon = mod?.icon;

  return (
    <PageShell title={label} crumbs={[{ label: 'Bientôt disponible' }]}>
      <Empty className="border-none py-17.5">
        <EmptyHeader>
          {Icon && (
            <EmptyMedia variant="icon" className="size-14 rounded-2xl bg-(--brand-bg) text-(--brand)">
              <Icon className="size-7" />
            </EmptyMedia>
          )}
          <EmptyTitle>{label} — Bientôt disponible</EmptyTitle>
          <EmptyDescription>Ce module sera disponible dans une prochaine phase du projet.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => navigate('/')}>Retour au Dashboard</Button>
        </EmptyContent>
      </Empty>
    </PageShell>
  );
}
