import { useState } from 'react';
import Modal from '../Modal';
import { ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getTranchesReferentiel } from '../../lib/api';
import { chargerDepuisTranche } from '../../lib/apiPatrimoine';
import { useConfirm } from '../../lib/confirmContext';
import { referentielItems } from '../../lib/referentiels';
import { useApi } from '../../lib/useApi';
import { useEcriture } from '../../lib/useEcriture';

/** « Charger à partir d'une autre tranche » (Administrateur) : choix de la source, confirmation, puis copie côté serveur. */
export default function DialogueChargerDepuisTranche({ trancheId, onClose, onCharge }: Readonly<{
  trancheId: string;
  onClose: () => void;
  onCharge: () => void;
}>) {
  const { data, error } = useApi(() => getTranchesReferentiel(), []);
  const confirm = useConfirm();
  const { occupe, executer } = useEcriture();
  const [sourceId, setSourceId] = useState<string | null>(null);
  const items = referentielItems((data ?? []).filter((t) => t.id !== trancheId))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  const source = items.find((i) => i.value === sourceId);

  async function charger() {
    if (!sourceId || !source) return;
    const oui = await confirm({
      title: 'Charger à partir d\'une autre tranche',
      message: `Les paramètres de la tranche ${source.label} vont remplacer ceux de la tranche en cours. Continuer ?`,
      confirmLabel: 'Charger',
    });
    if (!oui) return;
    const ok = await executer(() => chargerDepuisTranche(trancheId, sourceId), 'Paramètres chargés depuis la tranche.');
    if (ok) {
      onCharge();
      onClose();
    }
  }

  return (
    <Modal title="Charger à partir d'une autre tranche" onClose={onClose} width={520}>
      <div className="flex flex-col gap-3">
        <p className="text-label text-muted-foreground">
          Copie les règles, coordonnées et listes (étages, plancher couvert, frais de vente, finalisations) de la tranche choisie.
          Le code, les dates, le programme et les seuils de versement ne sont pas copiés.
        </p>
        {error && <ErrorState message={error} />}
        {!error && !data && <LoadingState />}
        {!error && data && (
          <Field>
            <FieldLabel htmlFor="tranche-source">Tranche source *</FieldLabel>
            <Select items={items} value={sourceId} onValueChange={(v) => setSourceId(v || null)}>
              <SelectTrigger id="tranche-source" className="w-full"><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>{items.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        )}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="button" disabled={!sourceId || occupe} onClick={() => void charger()}>Charger…</Button>
      </DialogFooter>
    </Modal>
  );
}
