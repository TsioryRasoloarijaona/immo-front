import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { referentielItems, useTypesContactProspection } from '../../lib/referentiels';
import { toApiDateTime } from '../../lib/format';
import { errorMessage } from '../../lib/useApi';
import type { CreerActionDossierRequest } from '../../types';

/** Une instruction passe par son propre bouton : le serveur la refuse ici (400). */
const TYPE_INSTRUCTION = '6441143f-1111-1111-2222-9db192573333';

/** Saisie d'une action (GEN0005) ; `enregistrer` choisit le porteur (dossier, article). */
export default function AjoutActionDialog({
  enregistrer,
  onClose,
  onCreated,
}: Readonly<{
  enregistrer: (body: CreerActionDossierRequest) => Promise<unknown>;
  onClose: () => void;
  onCreated: () => void;
}>) {
  const types = useTypesContactProspection();
  const items = referentielItems(types.data.filter((t) => t.id.toLowerCase() !== TYPE_INSTRUCTION));
  const [typeId, setTypeId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [dateAlerte, setDateAlerte] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Modal title="Ajouter une action" onClose={onClose} width={480}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!typeId || !note.trim()) return;
          setBusy(true);
          setError(null);
          try {
            await enregistrer({
              typeId,
              note: note.trim(),
              date: toApiDateTime(date),
              dateAlerte: toApiDateTime(dateAlerte),
            });
            onCreated();
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="action-type">Type d'action</FieldLabel>
            <Select items={items} value={typeId} onValueChange={(v) => setTypeId(v)}>
              <SelectTrigger id="action-type" className="w-full">
                <SelectValue placeholder={types.loading ? 'Chargement…' : 'Choisir…'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
          <FormField>
            <FieldLabel htmlFor="action-note">Note</FieldLabel>
            <Textarea id="action-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="action-date">Date (vide = maintenant)</FieldLabel>
            <Input id="action-date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="action-alerte">Alerte le (facultatif)</FieldLabel>
            <Input id="action-alerte" type="date" value={dateAlerte} onChange={(e) => setDateAlerte(e.target.value)} />
          </FormField>
        </FieldGroup>
        {error && <p role="alert" className="mt-3 text-micro text-destructive">{error}</p>}
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={busy || !typeId || !note.trim()}>Ajouter</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
