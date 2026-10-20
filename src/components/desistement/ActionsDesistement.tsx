import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, CircleCheck, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import ModifierDesistementDialog from './ModifierDesistementDialog';
import RembourserDesistementDialog from './RembourserDesistementDialog';
import ValiderDesistementDialog from './ValiderDesistementDialog';
import { supprimerDesistement } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { estChefOuExempte } from '../../lib/roles';
import { useToast } from '../../lib/toastContext';
import { errorMessage } from '../../lib/useApi';
import type { DesistementDto } from '../../types';

type Dialogue = 'modifier' | 'valider' | 'rembourser';

/** Boutons selon l'état ; masqués hors Administrateur, Direction Générale et Commercial Chef (le serveur répond 403). */
export default function ActionsDesistement({
  desistement: d,
  onChanged,
}: Readonly<{ desistement: DesistementDto; onChanged: () => void }>) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const showToast = useToast();
  const [ouvert, setOuvert] = useState<Dialogue | null>(null);

  if (!estChefOuExempte(user)) return null;

  const brouillon = d.etat === 'BROUILLON';
  const termine = (message: string) => {
    setOuvert(null);
    showToast(message);
    onChanged();
  };

  async function supprimer() {
    const ok = await confirm({
      title: 'Supprimer le désistement',
      message: 'Ce brouillon sera supprimé définitivement.',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
    if (!ok) return;
    try {
      await supprimerDesistement(d.id);
      showToast('Désistement supprimé.');
      void navigate('/desistements');
    } catch (err) {
      showToast(errorMessage(err));
    }
  }

  return (
    <>
      {d.etat !== 'LEGALISE' && (
        <Button variant="outline" size="sm" onClick={() => setOuvert('modifier')}>
          <Pencil data-icon="inline-start" /> Modifier
        </Button>
      )}
      {brouillon && (
        <>
          <Button size="sm" onClick={() => setOuvert('valider')}>
            <CircleCheck data-icon="inline-start" /> Valider
          </Button>
          <Button variant="outline" size="sm" onClick={() => void supprimer()}>
            <Trash2 data-icon="inline-start" /> Supprimer
          </Button>
        </>
      )}
      {!brouillon && d.resteARembourser > 0 && (
        <Button size="sm" onClick={() => setOuvert('rembourser')}>
          <Banknote data-icon="inline-start" /> Enregistrer le remboursement
        </Button>
      )}

      {ouvert === 'modifier' && (
        <ModifierDesistementDialog desistement={d} onClose={() => setOuvert(null)} onDone={() => termine('Désistement modifié.')} />
      )}
      {ouvert === 'valider' && (
        <ValiderDesistementDialog desistement={d} onClose={() => setOuvert(null)} onDone={() => termine('Désistement validé.')} />
      )}
      {ouvert === 'rembourser' && (
        <RembourserDesistementDialog desistement={d} onClose={() => setOuvert(null)} onDone={() => termine('Remboursement enregistré.')} />
      )}
    </>
  );
}
