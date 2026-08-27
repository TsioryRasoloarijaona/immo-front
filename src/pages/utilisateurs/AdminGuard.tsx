import type { ReactNode } from 'react';
import PageShell from '../../components/PageShell';
import { EmptyState } from '../../components/ui';
import { useAuth } from '../../lib/auth';

/** Wraps an admin-only page — same "roles includes Administrateur" rule
 * enforced for the sidebar link (Layout.tsx) and here, and the backend
 * itself 403s these endpoints for non-admins, so this is UX only, not the
 * real security boundary. */
export default function AdminGuard({
  title,
  crumbs,
  icon,
  accent,
  accentBg,
  fullHeight,
  children,
}: {
  title: string;
  crumbs: { label: string; to?: string }[];
  icon?: ReactNode;
  accent?: string;
  accentBg?: string;
  fullHeight?: boolean;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('Administrateur') ?? false;
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
