import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../ui/field';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { referentielItems, useCategoriesEcheance } from '../../../lib/referentiels';
import { toApiDateTime } from '../../../lib/format';
import type { CreerEcheanceRequest } from '../../../types';

export default function AjoutEcheance({
  onAdd,
  initialOpen,
  initialMontant,
  initialDate,
}: Readonly<{
  /** `false` si le serveur a refusé : la fenêtre reste ouverte avec la saisie. */
  onAdd: (body: CreerEcheanceRequest) => Promise<boolean>;
  initialOpen?: boolean;
  initialMontant?: number;
  initialDate?: string;
}>) {
  const [open, setOpen] = useState(!!initialOpen);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [montant, setMontant] = useState(initialMontant ? String(initialMontant) : '');
  const [dateEcheance, setDateEcheance] = useState(initialDate ?? '');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const categoriesEcheance = useCategoriesEcheance();
  const categorieItems = referentielItems(categoriesEcheance.data);

  function reset() {
    setOpen(false);
    setCategorieId(null);
    setMontant(initialMontant ? String(initialMontant) : '');
    setDateEcheance(initialDate ?? '');
    setDescription('');
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Ajouter une échéance
      </Button>
    );
  }

  return (
    <Modal title="Ajouter une échéance" onClose={reset} width={460}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!categorieId) return;
          setBusy(true);
          try {
            const ok = await onAdd({
              categorieId,
              // Vide : le serveur prend le montant par défaut de la catégorie (400 si elle n'en a pas).
              montant: montant === '' ? undefined : Number(montant),
              // `dateEcheance` est en `date-time` : un « YYYY-MM-DD » nu vaut 400.
              dateEcheance: toApiDateTime(dateEcheance) ?? null,
              description: description || undefined,
            });
            if (ok) reset();
          } finally {
            setBusy(false);
          }
        }}
      >
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="new-cat">Catégorie *</FieldLabel>
            <Select items={categorieItems} value={categorieId} onValueChange={(v) => setCategorieId((v) || null)}>
              <SelectTrigger id="new-cat" className="w-full">
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categorieItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
          <FormField>
            <FieldLabel htmlFor="new-montant">Montant (vide : montant par défaut de la catégorie)</FieldLabel>
            <Input id="new-montant" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="new-date">Échéance</FieldLabel>
            <Input id="new-date" type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="new-desc">Description</FieldLabel>
            <Input id="new-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={reset}>Annuler</Button>
          <Button type="submit" disabled={busy || !categorieId}>Ajouter</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
