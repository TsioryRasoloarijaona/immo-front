import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';

/** Action d'écriture du patrimoine : visible pour l'Administrateur seul (le serveur répond 403 aux autres). */
export default function ActionAdmin({ to, libelle, icone = <Plus data-icon="inline-start" />, variant = 'default' }: Readonly<{
  to: string;
  libelle: string;
  icone?: ReactNode;
  variant?: 'default' | 'outline';
}>) {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!estAdministrateur(user)) return null;
  return (
    <Button type="button" size="sm" variant={variant} onClick={() => void navigate(to)}>
      {icone} {libelle}
    </Button>
  );
}
