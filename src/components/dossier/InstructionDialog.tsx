import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { toApiDateTime } from '../../lib/format';
import { creerInstructionDossier } from '../../lib/api';
import { errorMessage } from '../../lib/useApi';

/** Instruction au commercial du dossier : action non lue + mail (aide OMRAN, action « Instruction »). */
export default function InstructionDialog({
  dossierId,
  commercialNom,
  onClose,
  onCreated,
}: Readonly<{
  dossierId: string;
  commercialNom?: string;
  onClose: () => void;
  onCreated: (emailEnvoye: boolean) => void;
}>) {
  const [note, setNote] = useState('');
  const [dateAlerte, setDateAlerte] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal title="Instruction au commercial" onClose={onClose} width={480}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!note.trim()) return;
          setBusy(true);
          setError(null);
          try {
            const res = await creerInstructionDossier(dossierId, { note: note.trim(), dateAlerte: toApiDateTime(dateAlerte) });
            onCreated(res.emailEnvoye);
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="mb-3 text-body text-muted-foreground">
          Destinataire : <span className="font-medium text-foreground">{commercialNom || 'commercial du dossier'}</span>.
          Il reçoit un mail et voit l'instruction comme non lue jusqu'à l'ouverture de l'onglet Actions.
        </p>
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="instruction-note">Instruction</FieldLabel>
            <Textarea id="instruction-note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="instruction-alerte">Alerte le (facultatif)</FieldLabel>
            <Input id="instruction-alerte" type="date" value={dateAlerte} onChange={(e) => setDateAlerte(e.target.value)} />
          </FormField>
        </FieldGroup>
        {error && <p role="alert" className="mt-3 text-micro text-destructive">{error}</p>}
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={busy || !note.trim()}>{busy ? 'Envoi…' : 'Envoyer'}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
