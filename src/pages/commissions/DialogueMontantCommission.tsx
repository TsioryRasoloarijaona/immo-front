import { useState } from 'react';
import Modal from '../../components/Modal';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { modifierMontantCommission } from '../../lib/apiCommissions';
import { formatDate } from '../../lib/format';
import { errorMessage } from '../../lib/useApi';
import type { LigneCommissionCalculeeDto } from '../../types/commissions';

function Lecture({ libelle, valeur }: Readonly<{ libelle: string; valeur: string | null }>) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-micro text-muted-foreground">{libelle}</span>
      <span className="text-body text-foreground">{valeur || '—'}</span>
    </div>
  );
}

export default function DialogueMontantCommission({
  ligne,
  onClose,
  onEnregistre,
}: Readonly<{ ligne: LigneCommissionCalculeeDto; onClose: () => void; onEnregistre: () => void }>) {
  const [montant, setMontant] = useState(String(ligne.montant));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function enregistrer() {
    const valeur = Number(montant.replace(',', '.'));
    if (montant.trim() === '' || Number.isNaN(valeur)) {
      setErreur('Saisissez un montant valide.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      await modifierMontantCommission(ligne.id, { montant: valeur });
      onEnregistre();
    } catch (err) {
      setErreur(errorMessage(err));
      setEnCours(false);
    }
  }

  return (
    <Modal title="Modifier le montant de la commission" onClose={onClose} width={520}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enregistrer();
        }}
        className="flex flex-col gap-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <Lecture libelle="Commercial / Gestionnaire" valeur={ligne.commercial} />
          <Lecture libelle="Dossier" valeur={ligne.dossierCode} />
          <Lecture libelle="Type" valeur={ligne.type} />
          <Lecture libelle="Date" valeur={ligne.date ? formatDate(ligne.date) : null} />
          <Lecture libelle="Mode de calcul" valeur={ligne.modeCalcul} />
          <Lecture libelle="Article" valeur={ligne.articleCode} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="montant-commission" className="text-label">
            Montant
          </label>
          <Input id="montant-commission" inputMode="decimal" value={montant} onChange={(e) => setMontant(e.target.value)} />
        </div>
        {erreur && (
          <p role="alert" className="text-body text-destructive">
            {erreur}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={enCours}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
