import { useState } from 'react';
import Modal from '../../../components/Modal';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import SearchableSelect from '../../../components/SearchableSelect';
import { ChoixSimple } from './CadreVirements';
import {
  LIBELLE_TYPE,
  STATUT_ITEMS,
  majVirements,
  natureDuType,
  useVirements,
  type Ordre,
  type TypeVirement,
} from './donnees';

const TYPE_ITEMS = (Object.keys(LIBELLE_TYPE) as TypeVirement[]).map((t) => ({ value: t, label: LIBELLE_TYPE[t] }));

/** Modification d'un ordre déjà émis. Dans l'outil d'origine, le PDF archivé
 * est regénéré à l'enregistrement ; ici seul l'historique change. */
export default function ModifierOrdreDialog({
  ordre,
  onClose,
  notifier,
}: {
  ordre: Ordre;
  onClose: () => void;
  notifier: (msg: string) => void;
}) {
  const { societes, beneficiaires } = useVirements();
  const [brouillon, setBrouillon] = useState({ ...ordre, montant: String(ordre.montant) });
  const options = beneficiaires
    .filter((b) => b.nature === natureDuType(brouillon.type))
    .map((b) => ({ value: b.id, label: b.nom }));

  function maj(patch: Partial<typeof brouillon>) {
    setBrouillon((b) => ({ ...b, ...patch }));
  }

  function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    const montant = Number(brouillon.montant);
    if (!brouillon.beneficiaire || !(montant > 0)) return;
    majVirements((s) => ({
      ...s,
      ordres: s.ordres.map((o) => (o.id === ordre.id ? { ...brouillon, montant, reference: brouillon.reference.trim() } : o)),
    }));
    notifier(`Ordre ${ordre.numero} modifié. Maquette : aucun PDF n'est regénéré.`);
    onClose();
  }

  return (
    <Modal title={`Modifier l'ordre ${ordre.numero}`} onClose={onClose} width={600}>
      <p className="-mt-2 mb-3 text-body text-muted-foreground">Le PDF archivé sera regénéré avec les nouvelles valeurs.</p>
      <form onSubmit={enregistrer}>
        <FieldGroup>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField>
              <FieldLabel htmlFor="mo-societe">Société émettrice</FieldLabel>
              <ChoixSimple
                id="mo-societe"
                items={societes.map((s) => ({ value: s.id, label: s.nom }))}
                value={brouillon.societeId}
                onChange={(v) => maj({ societeId: v })}
              />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="mo-type">Type de virement</FieldLabel>
              <ChoixSimple id="mo-type" items={TYPE_ITEMS} value={brouillon.type} onChange={(v) => maj({ type: v })} />
            </FormField>
          </div>
          <FormField>
            <FieldLabel htmlFor="mo-beneficiaire">Bénéficiaire</FieldLabel>
            <SearchableSelect
              id="mo-beneficiaire"
              items={options}
              value={brouillon.beneficiaireId || null}
              onValueChange={(v) => {
                const b = beneficiaires.find((x) => x.id === v);
                maj({ beneficiaireId: v ?? '', beneficiaire: b?.nom ?? '', rib: b?.rib ?? '' });
              }}
              placeholder={brouillon.beneficiaire || 'Rechercher un bénéficiaire…'}
            />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="mo-rib">RIB</FieldLabel>
            <Input id="mo-rib" className="font-mono" value={brouillon.rib} onChange={(e) => maj({ rib: e.target.value })} required />
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField>
              <FieldLabel htmlFor="mo-montant">Montant (DH)</FieldLabel>
              <Input
                id="mo-montant"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={brouillon.montant}
                onChange={(e) => maj({ montant: e.target.value })}
                required
              />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="mo-date">Date</FieldLabel>
              <Input id="mo-date" type="date" value={brouillon.date} onChange={(e) => maj({ date: e.target.value })} required />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="mo-reference">Référence (facultatif)</FieldLabel>
              <Input id="mo-reference" value={brouillon.reference} onChange={(e) => maj({ reference: e.target.value })} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="mo-statut">Statut</FieldLabel>
              <ChoixSimple id="mo-statut" items={STATUT_ITEMS} value={brouillon.statut} onChange={(v) => maj({ statut: v })} />
            </FormField>
          </div>
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer et regénérer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
