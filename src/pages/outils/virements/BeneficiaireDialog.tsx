import { useState } from 'react';
import Modal from '../../../components/Modal';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { ChoixSimple } from './CadreVirements';
import { LIBELLE_NATURE, majVirements, nouvelId, type Beneficiaire, type NatureBeneficiaire } from './donnees';

const NATURE_ITEMS = (Object.keys(LIBELLE_NATURE) as NatureBeneficiaire[]).map((n) => ({ value: n, label: LIBELLE_NATURE[n] }));

/** Ajout ou modification d'un bénéficiaire : fournisseur ou salarié, un nom
 * et un RIB. */
export default function BeneficiaireDialog({
  beneficiaire,
  onClose,
  notifier,
}: {
  /** Absent : création. */
  beneficiaire?: Beneficiaire;
  onClose: () => void;
  notifier: (msg: string) => void;
}) {
  const [nom, setNom] = useState(beneficiaire?.nom ?? '');
  const [rib, setRib] = useState(beneficiaire?.rib ?? '');
  const [nature, setNature] = useState<NatureBeneficiaire>(beneficiaire?.nature ?? 'fournisseur');

  function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim() || !rib.trim()) return;
    const fiche: Beneficiaire = { id: beneficiaire?.id ?? nouvelId('b'), nom: nom.trim(), rib: rib.trim(), nature };
    majVirements((s) => ({
      ...s,
      beneficiaires: beneficiaire
        ? s.beneficiaires.map((b) => (b.id === fiche.id ? fiche : b))
        : [...s.beneficiaires, fiche],
    }));
    notifier(beneficiaire ? `« ${fiche.nom} » modifié.` : `« ${fiche.nom} » ajouté.`);
    onClose();
  }

  return (
    <Modal title={beneficiaire ? 'Modifier le bénéficiaire' : 'Ajouter un bénéficiaire'} onClose={onClose} width={480}>
      <p className="-mt-2 mb-3 text-body text-muted-foreground">Fournisseur ou salarié : un nom et un RIB.</p>
      <form onSubmit={enregistrer}>
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="be-nom">Nom</FieldLabel>
            <Input id="be-nom" value={nom} onChange={(e) => setNom(e.target.value)} autoFocus required />
            <p className="text-micro text-muted-foreground">
              Pour un salarié, tapez la civilité avec le nom (« Monsieur Othman DIOURI ») : elle est imprimée telle quelle.
            </p>
          </FormField>
          <FormField>
            <FieldLabel htmlFor="be-rib">RIB</FieldLabel>
            <Input id="be-rib" className="font-mono" value={rib} onChange={(e) => setRib(e.target.value)} required />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="be-nature">Nature</FieldLabel>
            <ChoixSimple id="be-nature" items={NATURE_ITEMS} value={nature} onChange={setNature} />
            <p className="text-micro text-muted-foreground">
              Décide dans quelle liste ce bénéficiaire est proposé : les fournisseurs pour un règlement, les salariés pour une
              paie.
            </p>
          </FormField>
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
