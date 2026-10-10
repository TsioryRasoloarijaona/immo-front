import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { FieldDescription, FieldGroup } from '../../../components/ui/field';
import { modifierExerciceSyndic } from '../../../lib/syndic';
import { rafraichir } from '../virements/contexte';
import ModaleSaisie from '../virements/ModaleSaisie';
import ChampsPeriode from './ChampsPeriode';
import { montantPourSaisie, periodeLue, type Periode } from './periode';
import { texteErreur } from './donnees';
import type { ExerciceAppartement } from './types';

/** Corriger la période d'un exercice ordinaire : fin et dû se recalculent, les paiements ne bougent pas. */
export default function ExerciceDialog({
  code,
  exercice: e,
  onClose,
  onPhrase,
}: Readonly<{ code: string; exercice: ExerciceAppartement; onClose: () => void; onPhrase: (phrase: string) => void }>) {
  const depart: Periode = { debut: e.debut, duree: String(e.duree_mois), tarif: montantPourSaisie(e.tarif_mensuel) };
  const [periode, setPeriode] = useState<Periode>(depart);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const nbPaiements = e.paiements.filter((p) => !p.annule).length;

  async function envoyer(ev: React.SyntheticEvent) {
    ev.preventDefault();
    if (enCours) return;
    const lue = periodeLue(periode);
    if (lue.erreur !== null) return setErreur(lue.erreur);
    setEnCours(true);
    setErreur(null);
    try {
      onPhrase((await modifierExerciceSyndic(e.id, lue.periode)).phrase);
      rafraichir();
      onClose();
    } catch (err) {
      setErreur(texteErreur(err));
      setEnCours(false);
    }
  }

  const modifie = periode.debut !== depart.debut || periode.duree !== depart.duree || periode.tarif !== depart.tarif;
  return (
    <ModaleSaisie titre={`Corriger l’exercice ${e.label} — ${code}`} modifie={modifie} onClose={onClose} width={520}>
      {(fermer) => (
        <form onSubmit={envoyer} autoComplete="off" noValidate>
          <FieldGroup>
            <ChampsPeriode prefixe="sy-ex" valeur={periode} onChange={setPeriode} />
            <FieldDescription>
              La fin et le montant dû se recalculent.
              {nbPaiements > 0 && ` Les ${nbPaiements} paiement${nbPaiements > 1 ? 's' : ''} déjà enregistrés ne bougent pas : c’est le reste à payer qui s’ajuste.`}
            </FieldDescription>
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
            <Button type="submit" disabled={enCours || !modifie}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      )}
    </ModaleSaisie>
  );
}
