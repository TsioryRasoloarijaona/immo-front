import { useState } from 'react';
import Modal from '../Modal';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field as FormField, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { getCompteursDossier, modifierCompteursDossier } from '../../lib/api';
import { errorMessage, useApi } from '../../lib/useApi';
import type { CompteursDto } from '../../types';

type CleCompteur = keyof CompteursDto;

/** Masque « Compteur » d'OMRAN : un groupe par énergie. */
const GROUPES: { titre: string; champs: { cle: CleCompteur; libelle: string }[] }[] = [
  {
    titre: 'Électricité',
    champs: [
      { cle: 'referenceSteg', libelle: 'Référence STEG' },
      { cle: 'compteurElectricite', libelle: 'N° compteur' },
      { cle: 'releveElectricite', libelle: 'Arrêté du compteur' },
      { cle: 'policeElectricite', libelle: 'N° police' },
    ],
  },
  {
    titre: 'Eau',
    champs: [
      { cle: 'compteurEau', libelle: 'N° compteur' },
      { cle: 'releveEau', libelle: 'Arrêté du compteur' },
      { cle: 'policeEau', libelle: 'N° police' },
    ],
  },
  {
    titre: 'Gaz',
    champs: [
      { cle: 'compteurGaz', libelle: 'N° compteur' },
      { cle: 'releveGaz', libelle: 'Arrêté du compteur' },
      { cle: 'policeGaz', libelle: 'N° police' },
    ],
  },
];

function FormulaireCompteurs({
  dossierId,
  initial,
  onClose,
  onSaved,
}: Readonly<{ dossierId: string; initial: CompteursDto; onClose: () => void; onSaved: () => void }>) {
  const [valeurs, setValeurs] = useState<CompteursDto>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          // Chaîne vide envoyée telle quelle : le serveur efface le champ.
          const corps = Object.fromEntries(GROUPES.flatMap((g) => g.champs).map(({ cle }) => [cle, valeurs[cle] ?? ''])) as CompteursDto;
          await modifierCompteursDossier(dossierId, corps);
          onSaved();
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="flex flex-col gap-4">
        {GROUPES.map((g) => (
          <fieldset key={g.titre} className="grid gap-2.5 sm:grid-cols-2">
            <legend className="mb-1.5 text-label font-semibold text-foreground">{g.titre}</legend>
            {g.champs.map(({ cle, libelle }) => (
              <FormField key={cle}>
                <FieldLabel htmlFor={`cpt-${cle}`}>{libelle}</FieldLabel>
                <Input
                  id={`cpt-${cle}`}
                  maxLength={50}
                  value={valeurs[cle] ?? ''}
                  onChange={(e) => setValeurs((v) => ({ ...v, [cle]: e.target.value }))}
                />
              </FormField>
            ))}
          </fieldset>
        ))}
      </div>
      {error && <p role="alert" className="mt-3 text-micro text-destructive">{error}</p>}
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </DialogFooter>
    </form>
  );
}

/** Bouton « Compteurs » de la fiche : compteurs de l'article principal du dossier. */
export default function CompteursDialog({
  dossierId,
  onClose,
  onSaved,
}: Readonly<{ dossierId: string; onClose: () => void; onSaved: () => void }>) {
  const compteurs = useApi(() => getCompteursDossier(dossierId), [dossierId]);

  return (
    <Modal title="Compteurs de l'article" onClose={onClose} width={560}>
      {compteurs.error && <ErrorState message={compteurs.error} />}
      {!compteurs.error && !compteurs.data && <LoadingState />}
      {!compteurs.error && compteurs.data && (
        <FormulaireCompteurs dossierId={dossierId} initial={compteurs.data} onClose={onClose} onSaved={onSaved} />
      )}
    </Modal>
  );
}
