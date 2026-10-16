import { useState } from 'react';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { DialogFooter } from '../../ui/dialog';
import { createReglementDossier } from '../../../lib/api';
import { corpsEnTete, enTeteValide, enTeteVide, useReferentielsReglement, type EnTete } from '../../../lib/reglementEnTete';
import { montantSaisi, repartitionValide, versAffectations, type Saisies } from '../../../lib/repartitionReglement';
import type { EcheanceDto } from '../../../types';
import ChargementEcheancesAffectables from './ChargementEcheancesAffectables';
import EnTeteReglement from './EnTeteReglement';
import TableauAffectations from './TableauAffectations';

function FormulaireNouveauReglement({
  dossierId,
  echeances,
  echeanceInitiale,
  onAnnuler,
  onCree,
}: Readonly<{
  dossierId: string;
  echeances: EcheanceDto[];
  echeanceInitiale?: string;
  onAnnuler: () => void;
  onCree: () => Promise<void>;
}>) {
  const [enTete, setEnTete] = useState<EnTete>(enTeteVide);
  const [saisies, setSaisies] = useState<Saisies>(() => {
    const initiale = echeances.find((e) => e.id === echeanceInitiale);
    return initiale ? { [initiale.id]: String(initiale.reste ?? '') } : {};
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refs = useReferentielsReglement(dossierId, enTete.typeId);
  const montant = montantSaisi(enTete.montant);
  const valide = enTeteValide(enTete, refs) && repartitionValide(echeances, saisies, montant);

  async function enregistrer() {
    setBusy(true);
    setError(null);
    try {
      await createReglementDossier(dossierId, { ...corpsEnTete(enTete, refs), affectations: versAffectations(saisies) });
      await onCree();
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
      <EnTeteReglement valeur={enTete} refs={refs} onChange={setEnTete} />
      <TableauAffectations
        echeances={echeances}
        saisies={saisies}
        onChange={setSaisies}
        montant={montant}
        libelleMontant="Montant"
      />
      {error && <p className="text-micro text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onAnnuler}>Annuler</Button>
        <Button type="submit" disabled={busy || !valide}>Enregistrer</Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Dialogue « Nouveau règlement » : un règlement réparti sur une ou plusieurs échéances (FEATURE-reglement-multi-echeances.md
 * §3.1). Ouvert depuis l'en-tête de l'onglet (rien de coché) ou depuis une ligne (`echeanceInitiale` cochée).
 */
export default function AjoutReglement({
  dossierId,
  echeanceInitiale,
  variante = 'ligne',
  onCree,
}: Readonly<{
  dossierId: string;
  echeanceInitiale?: string;
  variante?: 'ligne' | 'entete';
  onCree: () => Promise<void>;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant={variante === 'entete' ? 'outline' : 'ghost'} size="sm" onClick={() => setOpen(true)}>
        + Règlement
      </Button>
      {open && (
        <Modal title="Nouveau règlement" onClose={() => setOpen(false)} width={720}>
          <ChargementEcheancesAffectables dossierId={dossierId}>
            {(echeances) => (
              <FormulaireNouveauReglement
                dossierId={dossierId}
                echeances={echeances}
                echeanceInitiale={echeanceInitiale}
                onAnnuler={() => setOpen(false)}
                onCree={async () => {
                  setOpen(false);
                  await onCree();
                }}
              />
            )}
          </ChargementEcheancesAffectables>
        </Modal>
      )}
    </>
  );
}
