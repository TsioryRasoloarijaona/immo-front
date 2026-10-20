import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderX } from 'lucide-react';
import { Button } from '../ui/button';
import DialogueDesistement from './DialogueDesistement';
import { useAuth } from '../../lib/auth';
import { useDesistementDuDossier } from '../../lib/desistements';
import { estChefOuExempte } from '../../lib/roles';

/** Écriture réservée à Administrateur, Direction Générale et Commercial Chef (le serveur répond 403 aux autres). */
export default function BoutonDesistement({ dossierId }: Readonly<{ dossierId: string }>) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const existant = useDesistementDuDossier(dossierId);
  const [ouvert, setOuvert] = useState(false);

  if (!estChefOuExempte(user) || (existant.loading && !existant.data)) return null;

  const ouvrirFiche = (id: string) => navigate(`/desistements/${id}`);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (existant.data ? ouvrirFiche(existant.data.id) : setOuvert(true))}
      >
        <FolderX data-icon="inline-start" /> {existant.data ? 'Voir le désistement' : 'Désistement'}
      </Button>
      {ouvert && <DialogueDesistement dossierId={dossierId} onClose={() => setOuvert(false)} onCree={ouvrirFiche} />}
    </>
  );
}
