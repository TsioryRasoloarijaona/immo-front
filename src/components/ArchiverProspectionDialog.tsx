import { useState } from 'react';
import { Archive } from 'lucide-react';
import Modal from './Modal';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import RefSelect from './RefSelect';
import { referentielItems, useRaisonsCloture } from '../lib/referentiels';
import type { ArchiverProspectionRequest } from '../types';

/** L'archivage en boîte — le même contenu que le panneau sur place de la
 * fiche (Raison + Détail, tous deux optionnels côté serveur), pour les
 * contextes sans fiche ouverte : le menu Actions des listes.
 *
 * `PATCH /api/prospections/{id}/archiver` reste au parent — la boîte ne
 * connaît que le corps, comme `TransformerProspectionDialog`, et affiche
 * l'erreur sur place plutôt que de se fermer sur un échec. */
export default function ArchiverProspectionDialog({
  titre,
  onClose,
  onSubmit,
}: {
  /** Nom de la prospection, pour que la boîte dise qui elle archive — depuis
   * une liste, la ligne d'origine peut être hors écran sous le voile. */
  titre?: string;
  onClose: () => void;
  onSubmit: (body: ArchiverProspectionRequest) => Promise<void>;
}) {
  const raisons = useRaisonsCloture();
  const [raisonId, setRaisonId] = useState<string | null>(null);
  const [raisonTexte, setRaisonTexte] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function archiver() {
    setBusy(true);
    setErreur(null);
    try {
      await onSubmit({ raisonId: raisonId ?? undefined, raisonTexte: raisonTexte.trim() || undefined });
      onClose();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'archivage.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Archiver la prospection" onClose={onClose} width={480}>
      <div className="flex flex-col gap-3.5">
        {titre && <p className="text-body text-muted-foreground">{titre}</p>}
        <FormField>
          <FieldLabel htmlFor="archiver-raison">Raison</FieldLabel>
          <RefSelect id="archiver-raison" value={raisonId} onChange={setRaisonId} items={referentielItems(raisons.data)} />
        </FormField>
        <FormField>
          <FieldLabel htmlFor="archiver-detail">Détail (optionnel)</FieldLabel>
          <Input id="archiver-detail" value={raisonTexte} onChange={(e) => setRaisonTexte(e.target.value)} />
        </FormField>

        {erreur && <p className="text-body text-destructive">{erreur}</p>}
      </div>

      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button type="button" variant="destructive" onClick={() => void archiver()} disabled={busy}>
          <Archive data-icon="inline-start" /> {busy ? 'Archivage…' : "Confirmer l'archivage"}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
