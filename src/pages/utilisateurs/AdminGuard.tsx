import type { ReactNode } from 'react';
import PageShell from '../../components/PageShell';
import { EmptyState } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';

// Confort seulement : la vraie barrière est le 403 du backend pour les non-admins.
export default function AdminGuard({
  title,
  crumbs,
  icon,
  accent,
  accentBg,
  fullHeight,
  children,
}: Readonly<{
  title: string;
  crumbs: { label: string; to?: string }[];
  icon?: ReactNode;
  accent?: string;
  accentBg?: string;
  fullHeight?: boolean;
  children: ReactNode;
}>) {
  const { user } = useAuth();
  const isAdmin = estAdministrateur(user);
  return (
    <PageShell title={title} crumbs={crumbs} icon={icon} accent={accent} accentBg={accentBg} fullHeight={fullHeight}>
      {isAdmin ? (
        children
      ) : (
        <EmptyState
          title="Accès réservé aux administrateurs"
          message="Cette section n'est visible que pour les comptes ayant le rôle Administrateur."
        />
      )}
    </PageShell>
  );
}
