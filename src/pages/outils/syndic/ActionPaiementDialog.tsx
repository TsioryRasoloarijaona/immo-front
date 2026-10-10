import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { formatCurrency } from '../../../lib/format';
import { annulerPaiementSyndic, corrigerPaiementSyndic } from '../../../lib/syndic';
import { ChoixSimple } from '../virements/CadreVirements';
import { rafraichir } from '../virements/contexte';
import ModaleSaisie from '../virements/ModaleSaisie';
import type { Notifications } from '../virements/useNotification';
import { montantSaisi } from './donnees';
import type { PaiementListe } from './types';

export type ActionPaiement = 'corriger' | 'annuler';
type Sens = 'retirer' | 'ajouter';

const SENS_ITEMS: { value: Sens; label: string }[] = [
  { value: 'retirer', label: 'Retirer un montant' },
  { value: 'ajouter', label: 'Ajouter un montant' },
];

/** RM-10 : rien ne s'efface. Corriger = une correction motivée (le reçu ne change pas) ; annuler = statut ANNULE,
 * et un reçu groupé s'annule en entier. Réservé aux administrateurs du service. */
export default function ActionPaiementDialog({
  paiement: p,
  action,
  onClose,
  toasts,
}: Readonly<{ paiement: PaiementListe; action: ActionPaiement; onClose: () => void; toasts: Notifications }>) {
  const [sens, setSens] = useState<Sens>('retirer');
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const corriger = action === 'corriger';

  async function valider(e: React.SyntheticEvent) {
    e.preventDefault();
    if (enCours) return;
    const valeur = montantSaisi(montant);
    if (corriger && valeur === null) return setErreur('Le montant n’est pas lisible.');
    if (!motif.trim()) return setErreur('Dites pourquoi : c’est obligatoire.');
    setErreur(null);
    setEnCours(true);
    try {
      const delta = sens === 'retirer' ? -(valeur ?? 0) : (valeur ?? 0);
      const r = corriger ? await corrigerPaiementSyndic(p.id, delta, motif.trim()) : await annulerPaiementSyndic(p.id, motif.trim());
      toasts.notifier(r.phrase);
      rafraichir();
      onClose();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur inconnue.');
    } finally {
      setEnCours(false);
    }
  }

  const titre = corriger ? `Corriger ${p.numero}` : `Annuler ${p.numero}`;
  return (
    <ModaleSaisie titre={titre} modifie={montant !== '' || motif !== ''} onClose={onClose} width={480}>
      {(fermer) => (
        <form onSubmit={valider} autoComplete="off" noValidate>
          <FieldGroup>
            <p className="text-body text-muted-foreground">
              {p.appartement} · {p.exercice} · ce versement compte aujourd’hui {formatCurrency(p.montant_utile)}.
              {!corriger && p.recu_groupe && ` Son reçu ${p.recu_numero ?? ''} couvre plusieurs appartements : tous ses paiements seront annulés.`}
            </p>
            {corriger && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField>
                  <FieldLabel htmlFor="sy-sens">Correction</FieldLabel>
                  <ChoixSimple id="sy-sens" items={SENS_ITEMS} value={sens} onChange={setSens} />
                </FormField>
                <FormField>
                  <FieldLabel htmlFor="sy-delta">Montant (DH)</FieldLabel>
                  <Input id="sy-delta" inputMode="decimal" placeholder="0,00" value={montant} onChange={(e) => setMontant(e.target.value)} />
                </FormField>
              </div>
            )}
            <FormField>
              <FieldLabel htmlFor="sy-motif">Pourquoi ?</FieldLabel>
              <Textarea id="sy-motif" value={motif} maxLength={500} onChange={(e) => setMotif(e.target.value)} rows={3} />
            </FormField>
          </FieldGroup>
          {erreur && (
            <p role="alert" className="mt-3 text-body text-destructive">
              {erreur}
            </p>
          )}
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={fermer}>
              Fermer
            </Button>
            <Button type="submit" variant={corriger ? 'default' : 'destructive'} disabled={enCours}>
              {corriger ? 'Enregistrer la correction' : 'Annuler le paiement'}
            </Button>
          </DialogFooter>
        </form>
      )}
    </ModaleSaisie>
  );
}
