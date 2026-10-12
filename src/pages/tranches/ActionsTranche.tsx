import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { deleteTranche } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { useToast } from '../../lib/toastContext';
import { errorMessage } from '../../lib/useApi';
import type { TrancheDetailDto } from '../../types';

/** Bouton administrateur « Supprimer » de la fiche tranche ; retour à la liste après succès. */
export default function ActionsTranche({ t }: Readonly<{ t: TrancheDetailDto }>) {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const toast = useToast();
  const [suppression, setSuppression] = useState(false);

  async function supprimer() {
    const ok = await confirmer({
      title: 'Supprimer la tranche',
      message: `Supprimer la tranche « ${t.description ?? t.code} » ? Ses terrains, onglets, habilitations, pièces jointes et notes seront supprimés avec elle.`,
      confirmLabel: 'Supprimer',
    });
    if (!ok) return;
    setSuppression(true);
    try {
      await deleteTranche(t.id);
      toast({ texte: 'Tranche supprimée.', variante: 'succes' });
      void navigate('/tranches');
    } catch (err) {
      // 409 : le message du serveur liste les tables qui référencent la tranche.
      toast({ texte: errorMessage(err), variante: 'erreur' });
    } finally {
      setSuppression(false);
    }
  }

  return (
    <Button variant="outline" size="sm" disabled={suppression} onClick={() => void supprimer()}>
      <Trash2 data-icon="inline-start" /> {suppression ? 'Suppression…' : 'Supprimer'}
    </Button>
  );
}
