import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { creerBeneficiaire, modifierBeneficiaire } from '../../../lib/virements';
import { ChoixSimple } from './CadreVirements';
import { rafraichir } from './contexte';
import ModaleSaisie from './ModaleSaisie';
import type { Meta, TypeBeneficiaire } from './types';
import type { Notifications } from './useNotification';

/** Création = upsert sur le nom côté service : un nom existant ne voit que son RIB mis à jour, nature inchangée. */
export default function BeneficiaireDialog({
  beneficiaire,
  natureParDefaut,
  meta,
  onClose,
  toasts,
}: Readonly<{
  beneficiaire?: { id: number; nom: string; rib: string; type: TypeBeneficiaire };
  natureParDefaut: TypeBeneficiaire;
  meta: Meta;
  onClose: () => void;
  toasts: Notifications;
}>) {
  const initial = {
    nom: beneficiaire?.nom ?? '',
    rib: beneficiaire?.rib ?? '',
    type: beneficiaire?.type ?? natureParDefaut,
  };
  const [nom, setNom] = useState(initial.nom);
  const [rib, setRib] = useState(initial.rib);
  const [type, setType] = useState<TypeBeneficiaire>(initial.type);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const modifie = nom !== initial.nom || rib !== initial.rib || type !== initial.type;

  const natureItems = (Object.entries(meta.types_beneficiaire) as [TypeBeneficiaire, string][]).map(([v, l]) => ({ value: v, label: l }));

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (enCours) return;
    if (!nom.trim() || !rib.trim()) return setErreur('Le nom et le RIB sont requis.');
    setErreur(null);
    setEnCours(true);
    const corps = { nom: nom.trim(), rib: rib.trim(), type };
    try {
      if (beneficiaire) {
        await modifierBeneficiaire(beneficiaire.id, corps);
        toasts.notifier(`Bénéficiaire « ${corps.nom} » modifié avec succès.`);
      } else {
        const { cree } = await creerBeneficiaire(corps);
        toasts.notifier(
          cree
            ? `Bénéficiaire « ${corps.nom} » ajouté avec succès.`
            : `« ${corps.nom} » existait déjà : son RIB a été mis à jour, sa nature est inchangée.`,
          cree ? 'succes' : 'avertissement',
        );
      }
      rafraichir();
      onClose();
    } catch (err) {
      setErreur(err instanceof Error ? `Impossible d'enregistrer le bénéficiaire : ${err.message}` : 'Erreur inconnue.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <ModaleSaisie titre={beneficiaire ? 'Modifier le bénéficiaire' : 'Ajouter un bénéficiaire'} modifie={modifie} onClose={onClose} width={480}>
      {(fermer) => (
        <form onSubmit={enregistrer} autoComplete="off" noValidate>
          <FieldGroup>
            <FormField>
              <FieldLabel htmlFor="be-nom">Nom</FieldLabel>
              <Input id="be-nom" value={nom} maxLength={200} onChange={(e) => setNom(e.target.value)} autoFocus />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="be-rib">RIB</FieldLabel>
              <Input id="be-rib" className="font-mono" value={rib} maxLength={60} onChange={(e) => setRib(e.target.value)} />
            </FormField>
            <FormField>
              <FieldLabel htmlFor="be-nature">Nature</FieldLabel>
              <ChoixSimple id="be-nature" items={natureItems} value={type} onChange={setType} />
              <p className="text-micro text-muted-foreground">
                Décide dans quelle liste ce bénéficiaire est proposé : les fournisseurs pour un règlement, les salariés pour une paie.
              </p>
            </FormField>
          </FieldGroup>
          {erreur && (
            <p role="alert" className="mt-3 text-body text-destructive">
              {erreur}
            </p>
          )}
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={fermer}>
              Annuler
            </Button>
            <Button type="submit" disabled={enCours}>
              {enCours ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      )}
    </ModaleSaisie>
  );
}
