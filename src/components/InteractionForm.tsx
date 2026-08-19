import { useState } from 'react';
import Modal from './Modal';
import type { CreerInteractionRequest } from '../types';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from './ui/field';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const DIRECTION_ITEMS = [
  { label: 'Sortant (nous → contact)', value: 'out' },
  { label: 'Entrant (contact → nous)', value: 'in' },
];

// CreerInteractionRequest only carries description + entrante — the API has
// no actionType/channel/RDV-scheduling fields (that was prototype-only
// state layered on the legacy export), so this form is intentionally
// minimal now.
export default function InteractionForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: CreerInteractionRequest) => void;
}) {
  const [direction, setDirection] = useState<'in' | 'out'>('out');
  const [description, setDescription] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmit({ description: description.trim(), entrante: direction === 'in' });
    onClose();
  }

  return (
    <Modal title="Ajouter une interaction" onClose={onClose} width={460}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="direction">Sens</FieldLabel>
            <Select items={DIRECTION_ITEMS} value={direction} onValueChange={(v) => setDirection(v as 'in' | 'out')}>
              <SelectTrigger id="direction" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {DIRECTION_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>

          <FormField>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              placeholder="Compte-rendu de l'appel / de la visite…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </FormField>
        </FieldGroup>

        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit">Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
