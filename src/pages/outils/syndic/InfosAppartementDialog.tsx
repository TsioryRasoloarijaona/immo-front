import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { DialogFooter } from '../../../components/ui/dialog';
import { Field as FormField, FieldDescription, FieldGroup, FieldLabel } from '../../../components/ui/field';
import { Input } from '../../../components/ui/input';
import { modifierAppartementSyndic } from '../../../lib/syndic';
import { rafraichir } from '../virements/contexte';
import ModaleSaisie from '../virements/ModaleSaisie';
import { texteErreur } from './donnees';
import type { Appartement } from './types';

/** Les informations du bien (syndic-admod `modifier/`) ; le code ne change pas. */
export default function InfosAppartementDialog({
  appartement: a,
  onClose,
  onPhrase,
}: Readonly<{ appartement: Appartement; onClose: () => void; onPhrase: (phrase: string) => void }>) {
  const [dossier, setDossier] = useState(a.numero_dossier ?? '');
  const [contrat, setContrat] = useState(a.date_contrat ?? '');
  const [cles, setCles] = useState(a.date_remise_cles ?? '');
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const modifie = dossier !== (a.numero_dossier ?? '') || contrat !== (a.date_contrat ?? '') || cles !== (a.date_remise_cles ?? '');

  async function envoyer(e: React.SyntheticEvent) {
    e.preventDefault();
    if (enCours) return;
    setEnCours(true);
    setErreur(null);
    try {
      const r = await modifierAppartementSyndic(a.code, { numero_dossier: dossier.trim() || null, date_contrat: contrat || null, date_remise_cles: cles || null });
      onPhrase(r.phrase);
      rafraichir();
      onClose();
    } catch (err) {
      setErreur(texteErreur(err));
      setEnCours(false);
    }
  }

  return (
    <ModaleSaisie titre={`Modifier ${a.code}`} modifie={modifie} onClose={onClose} width={480}>
      {(fermer) => (
        <form onSubmit={envoyer} autoComplete="off" noValidate>
          <FieldGroup>
            <FormField>
              <FieldLabel htmlFor="sy-ap-dossier">N° de dossier</FieldLabel>
              <Input id="sy-ap-dossier" value={dossier} maxLength={50} onChange={(e) => setDossier(e.target.value)} />
            </FormField>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField>
                <FieldLabel htmlFor="sy-ap-contrat">Date du contrat</FieldLabel>
                <Input id="sy-ap-contrat" type="date" value={contrat} onChange={(e) => setContrat(e.target.value)} />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="sy-ap-cles">Date de remise des clés</FieldLabel>
                <Input id="sy-ap-cles" type="date" value={cles} onChange={(e) => setCles(e.target.value)} />
              </FormField>
            </div>
            <FieldDescription>Ces deux dates sont informatives : le syndic se compte à partir du début de l’exercice.</FieldDescription>
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
