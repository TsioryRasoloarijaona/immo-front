import { useState } from 'react';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { affecterReglement } from '../../../lib/api';
import { formatCurrency } from '../../../lib/format';
import { repartitionValide, versAffectations, type Saisies } from '../../../lib/repartitionReglement';
import type { EcheanceDto, ReglementDossierDto } from '../../../types';
import ChargementEcheancesAffectables from './ChargementEcheancesAffectables';
import TableauAffectations from './TableauAffectations';

function FormulaireAffecterReste({
  dossierId,
  reglement,
  echeances,
  onAnnuler,
  onAffecte,
}: Readonly<{
  dossierId: string;
  reglement: ReglementDossierDto;
  echeances: EcheanceDto[];
  onAnnuler: () => void;
  onAffecte: () => Promise<void>;
}>) {
  const dejaAffectees = new Set((reglement.affectations ?? []).map((a) => a.echeanceId));
  // Une échéance déjà dans ce règlement est refusée par le serveur (400) : elle n'est pas proposée.
  const proposables = echeances.filter((e) => !dejaAffectees.has(e.id));
  const reste = reglement.resteAAffecter ?? 0;
  const [saisies, setSaisies] = useState<Saisies>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valide = repartitionValide(proposables, saisies, reste);

  async function enregistrer() {
    setBusy(true);
    setError(null);
    try {
      await affecterReglement(dossierId, reglement.id, { affectations: versAffectations(saisies) });
      await onAffecte();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valide) void enregistrer();
      }}
      className="flex flex-col gap-4"
    >
      <TableauAffectations
        echeances={proposables}
        saisies={saisies}
        onChange={setSaisies}
        montant={reste}
        libelleMontant="À répartir"
      />
      {error && <p className="text-micro text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onAnnuler}>Annuler</Button>
        <Button type="submit" disabled={busy || !valide}>Enregistrer</Button>
      </DialogFooter>
    </form>
  );
}

/** « Affecter le reste » d'un règlement : même tableau que le nouveau règlement, sans en-tête. */
export default function AffecterReste({
  dossierId,
  reglement,
  onAffecte,
}: Readonly<{
  dossierId: string;
  reglement: ReglementDossierDto;
  onAffecte: () => Promise<void>;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Affecter le reste
      </Button>
      {open && (
        <Modal
          title={`Affecter le reste (${formatCurrency(reglement.resteAAffecter)})`}
          onClose={() => setOpen(false)}
          width={640}
        >
          <ChargementEcheancesAffectables dossierId={dossierId}>
            {(echeances) => (
              <FormulaireAffecterReste
                dossierId={dossierId}
                reglement={reglement}
                echeances={echeances}
                onAnnuler={() => setOpen(false)}
                onAffecte={async () => {
                  setOpen(false);
                  await onAffecte();
                }}
              />
            )}
          </ChargementEcheancesAffectables>
        </Modal>
      )}
    </>
  );
}
