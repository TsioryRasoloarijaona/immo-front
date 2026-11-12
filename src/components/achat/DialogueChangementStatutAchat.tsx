import { useState } from 'react';
import Modal from '../Modal';
import SearchableSelect from '../SearchableSelect';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Textarea } from '../ui/textarea';
import { ApiError } from '../../lib/api';
import { transitionnerPieceAchat } from '../../lib/apiAchat';
import { estIntrouvable, messageActionPieceAchat, relirePieceAchat } from '../../lib/actionsPieceAchat';
import type { DocumentAchatDetailDto } from '../../types/achat';

/** Changement de statut d'une pièce d'achat : seules les transitions de `actions` sont proposées. */
export default function DialogueChangementStatutAchat({ piece, onClose, onChange, onIntrouvable }: Readonly<{
  piece: DocumentAchatDetailDto;
  onClose: () => void;
  onChange: (piece: DocumentAchatDetailDto) => void;
  onIntrouvable: (message: string) => void;
}>) {
  const [statutId, setStatutId] = useState('');
  const [note, setNote] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const transitions = piece.actions.transitions;
  const choisie = transitions.find((t) => t.statutId === statutId);
  const noteManquante = !!choisie?.noteObligatoire && note.trim() === '';

  async function valider() {
    setEnvoi(true);
    setErreur(null);
    try {
      onChange(await transitionnerPieceAchat(piece.id, { statutId, note: note.trim() || null }));
      onClose();
    } catch (err) {
      if (estIntrouvable(err)) {
        onClose();
        onIntrouvable(messageActionPieceAchat(err));
      } else {
        setErreur(messageActionPieceAchat(err));
        if (err instanceof ApiError && err.status === 409) {
          const relue = await relirePieceAchat(piece.id);
          if (relue) onChange(relue);
          setStatutId('');
        }
      }
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal title="Changer de statut" onClose={onClose} width={460}>
      <div className="flex flex-col gap-3">
        <Field>
          <FieldLabel htmlFor="statut-piece-achat">Nouveau statut</FieldLabel>
          <SearchableSelect
            id="statut-piece-achat"
            value={statutId || null}
            placeholder="Choisir…"
            emptyMessage="Aucune transition"
            className="w-full min-w-0"
            onValueChange={(v) => setStatutId(v ?? '')}
            items={transitions.map((t) => ({ value: t.statutId, label: t.statutDescription ?? t.statutCode ?? '—' }))}
          />
        </Field>
        {choisie && (
          <Field>
            <FieldLabel htmlFor="note-piece-achat">Note{choisie.noteObligatoire ? ' *' : ''}</FieldLabel>
            <Textarea id="note-piece-achat" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        )}
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
          <Button type="button" disabled={envoi || !choisie || noteManquante} onClick={() => void valider()}>Valider</Button>
        </DialogFooter>
      </div>
    </Modal>
  );
}
