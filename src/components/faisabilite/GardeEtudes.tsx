import type { ReactNode } from 'react';
import PageShell from '../PageShell';
import { EmptyState } from '../ui';
import { useAuth } from '../../lib/auth';
import { estExempte } from '../../lib/roles';

/** Lecture réservée à l'Administrateur et à la Direction Générale (coûts, marges, prix d'achat) ; le serveur répond 403 aux autres. */
export default function GardeEtudes({ children }: Readonly<{ children: ReactNode }>) {
  const { user } = useAuth();
  if (estExempte(user)) return <>{children}</>;
  return (
    <PageShell title="Études de faisabilité" crumbs={[{ label: 'Patrimoine' }, { label: 'Études de faisabilité' }]}>
      <EmptyState title="Accès réservé" message="Les études de faisabilité sont réservées à l'Administrateur et à la Direction Générale." />
    </PageShell>
  );
}
