import { Link } from 'react-router-dom';
import PageShell from '../PageShell';
import { Button } from '../ui/button';
import { EmptyState } from '../ui';

/** 403 : le rapport existe mais n'est pas visible pour ce profil ; autre statut : introuvable. */
export default function AccesRapport({ statut, titre }: Readonly<{ statut: number; titre: string }>) {
  const refuse = statut === 403;
  return (
    <PageShell title={titre}>
      <EmptyState
        title={refuse ? "Vous n'avez pas accès à ce rapport." : 'Rapport introuvable.'}
        action={
          <Button variant="outline" size="sm" render={<Link to="/rapports" />}>
            Retour aux rapports
          </Button>
        }
      />
    </PageShell>
  );
}
