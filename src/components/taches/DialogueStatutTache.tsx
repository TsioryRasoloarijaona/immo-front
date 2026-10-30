import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';

/** Commentaire demandé quand la transition le requiert (`commentaireRequis` du contrat). */
export default function DialogueStatutTache({ cible, requis, onValider, onClose }: Readonly<{
  cible: string;
  requis: boolean;
  onValider: (commentaire: string) => void;
  onClose: () => void;
}>) {
  const [commentaire, setCommentaire] = useState('');
  return (
    <Modal title={`Passer à « ${cible} »`} onClose={onClose} width={480}>
      <div className="flex flex-col gap-3">
        <label htmlFor="commentaire-statut-tache" className="text-label font-medium text-foreground">
          Commentaire{requis ? ' *' : ''}
        </label>
        <Textarea id="commentaire-statut-tache" rows={4} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="button" disabled={requis && commentaire.trim() === ''} onClick={() => onValider(commentaire.trim())}>Valider</Button>
      </DialogFooter>
    </Modal>
  );
}
