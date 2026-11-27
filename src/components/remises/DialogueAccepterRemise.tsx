import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { accepterDemandeRemise } from '../../lib/apiRemise';
import { formatPercentValue } from '../../lib/format';
import { errorMessage } from '../../lib/useApi';
import type { DemandeRemiseDto } from '../../types/remise';

/** Acceptation : taux pré-rempli au taux demandé, modifiable à la baisse ; les 400 / 409 du serveur s'affichent dans la boîte. */
export default function DialogueAccepterRemise({ demande, onFermer, onTraitee }: Readonly<{
  demande: DemandeRemiseDto;
  onFermer: () => void;
  onTraitee: () => void;
}>) {
  const [taux, setTaux] = useState(String(demande.tauxDemande));
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const valeur = Number(taux.replace(',', '.'));
  const valide = taux.trim() !== '' && valeur > 0 && valeur <= demande.tauxDemande;

  async function valider() {
    setOccupe(true);
    setErreur(null);
    try {
      await accepterDemandeRemise(demande.id, { taux: valeur });
      onTraitee();
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <Modal title={`Accepter la remise · ${demande.dossierCode}`} onClose={onFermer} width={440}>
      <form onSubmit={(e) => { e.preventDefault(); void valider(); }}>
        <Field>
          <FieldLabel htmlFor="accepter-taux">Taux de remise accordé (%)</FieldLabel>
          <Input id="accepter-taux" inputMode="decimal" value={taux} onChange={(e) => setTaux(e.target.value)} />
          <span className="text-micro text-muted-foreground">
            Demandé : {formatPercentValue(demande.tauxDemande)} · actuel : {formatPercentValue(demande.tauxActuel)}
          </span>
        </Field>
        {erreur && <p role="alert" className="mt-3 text-label text-destructive">{erreur}</p>}
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onFermer}>Annuler</Button>
          <Button type="submit" disabled={!valide || occupe}>Accepter</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
