import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Textarea } from '../ui/textarea';
import { refuserDemandeRemise } from '../../lib/apiRemise';
import { errorMessage } from '../../lib/useApi';
import type { DemandeRemiseDto } from '../../types/remise';

/** Refus : motif obligatoire ; l'erreur du serveur (409 dossier non modifiable…) s'affiche dans la boîte. */
export default function DialogueRefuserRemise({ demande, onFermer, onTraitee }: Readonly<{
  demande: DemandeRemiseDto;
  onFermer: () => void;
  onTraitee: () => void;
}>) {
  const [motif, setMotif] = useState('');
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function valider() {
    setOccupe(true);
    setErreur(null);
    try {
      await refuserDemandeRemise(demande.id, { motif: motif.trim() });
      onTraitee();
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <Modal title={`Refuser la remise · ${demande.dossierCode}`} onClose={onFermer} width={440}>
      <form onSubmit={(e) => { e.preventDefault(); void valider(); }}>
        <Field>
          <FieldLabel htmlFor="refuser-motif">Motif du refus</FieldLabel>
          <Textarea id="refuser-motif" value={motif} onChange={(e) => setMotif(e.target.value)} />
        </Field>
        {erreur && <p role="alert" className="mt-3 text-label text-destructive">{erreur}</p>}
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onFermer}>Annuler</Button>
          <Button type="submit" disabled={motif.trim() === '' || occupe}>Refuser</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
