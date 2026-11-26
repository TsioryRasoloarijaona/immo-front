import PageShell from './PageShell';
import { EmptyState } from './ui';

// Confort seulement : la vraie barrière est le 403 du backend pour les comptes agence.
export default function AccesReserveSiege() {
  return (
    <PageShell title="Accès réservé au siège" crumbs={[{ label: 'Accès réservé au siège' }]}>
      <EmptyState title="Accès réservé au siège" message="Cette fonction n'est pas ouverte aux agences." />
    </PageShell>
  );
}
