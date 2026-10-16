import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../ui/field';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { referentielItems, useCategoriesEcheance } from '../../../lib/referentiels';
import { formatCurrency } from '../../../lib/format';
import { champsModifies, saisieDepuis, sousLeRegle, type SaisieEcheance } from '../../../lib/modificationEcheance';
import type { EcheanceDto, ModifierEcheanceRequest } from '../../../types';

/** Préremplie avec la ligne ; réglé, reste et quittance en lecture seule (OMRAN les verrouille aussi). */
export default function ModifierEcheance({
  echeance,
  onEnregistrer,
  onClose,
}: Readonly<{
  echeance: EcheanceDto;
  /** `false` si le serveur a refusé : la fenêtre reste ouverte avec la saisie. */
  onEnregistrer: (corps: ModifierEcheanceRequest) => Promise<boolean>;
  onClose: () => void;
}>) {
  const [initiale] = useState(() => saisieDepuis(echeance));
  const [saisie, setSaisie] = useState<SaisieEcheance>(initiale);
  const [busy, setBusy] = useState(false);
  const categoriesEcheance = useCategoriesEcheance();
  const categorieItems = referentielItems(categoriesEcheance.data);
  const corps = champsModifies(initiale, saisie);
  const rienAEnvoyer = Object.keys(corps).length === 0;
  const changerCategorie = corps.categorieId !== undefined;

  function changer<K extends keyof SaisieEcheance>(champ: K, valeur: SaisieEcheance[K]) {
    setSaisie((s) => ({ ...s, [champ]: valeur }));
  }

  return (
    <Modal title="Modifier l'échéance" onClose={onClose} width={480}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (rienAEnvoyer) return;
          setBusy(true);
          try {
            if (await onEnregistrer(corps)) onClose();
          } finally {
            setBusy(false);
          }
        }}
      >
        <dl className="mb-4 grid grid-cols-3 gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-body">
          <div>
            <dt className="text-micro text-muted-foreground">Réglé</dt>
            <dd className="tabular-nums">{formatCurrency(echeance.montantRegle)}</dd>
          </div>
          <div>
            <dt className="text-micro text-muted-foreground">Reste</dt>
            <dd className="tabular-nums">{formatCurrency(echeance.reste)}</dd>
          </div>
          <div>
            <dt className="text-micro text-muted-foreground">Quittance</dt>
            <dd>{echeance.decompte ?? 'N.A.'}</dd>
          </div>
        </dl>
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="mod-cat">Catégorie *</FieldLabel>
            <Select
              items={categorieItems}
              value={saisie.categorieId}
              onValueChange={(v) => changer('categorieId', v || initiale.categorieId)}
            >
              <SelectTrigger id="mod-cat" className="w-full">
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
            {changerCategorie && (
              <p className="text-micro text-muted-foreground">
                TVA et « Exclure du prix » seront repris de la nouvelle catégorie ; montant et date restent ceux saisis.
              </p>
            )}
          </FormField>
          <FormField>
            <FieldLabel htmlFor="mod-montant">Montant</FieldLabel>
            <Input id="mod-montant" type="number" value={saisie.montant} onChange={(e) => changer('montant', e.target.value)} />
            {sousLeRegle(saisie.montant, echeance.montantRegle) && (
              <p role="alert" className="flex items-center gap-1 text-micro text-(--warning)">
                <AlertTriangle className="size-3.5" /> Montant inférieur au déjà réglé : le reste deviendra négatif.
              </p>
            )}
          </FormField>
          <FormField>
            <FieldLabel htmlFor="mod-date">Échéance</FieldLabel>
            <Input id="mod-date" type="date" value={saisie.dateEcheance} onChange={(e) => changer('dateEcheance', e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="mod-desc">Description</FieldLabel>
            <Input id="mod-desc" value={saisie.description} onChange={(e) => changer('description', e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="mod-notes">Notes</FieldLabel>
            <Input id="mod-notes" value={saisie.notes} onChange={(e) => changer('notes', e.target.value)} />
          </FormField>
          <label className="flex items-center gap-1.5 text-body text-muted-foreground">
            <input
              type="checkbox"
              checked={saisie.exclureDuPrix}
              onChange={(e) => changer('exclureDuPrix', e.target.checked)}
            />
            Exclure du prix
          </label>
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={busy || rienAEnvoyer}>Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
