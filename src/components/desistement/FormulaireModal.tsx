import { useState, type ReactNode } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { errorMessage } from '../../lib/useApi';

/** Dialogue à un envoi : `onSubmit` rejeté, le message du serveur (400/409) s'affiche sous le formulaire. */
export default function FormulaireModal({
  title,
  libelle,
  valide,
  onClose,
  onSubmit,
  children,
}: Readonly<{
  title: string;
  libelle: string;
  valide: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  children: ReactNode;
}>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function soumettre() {
    if (!valide || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} width={560}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void soumettre();
        }}
        className="flex flex-col gap-3">
        {children}
        {error && <p role="alert" className="text-micro text-destructive">{error}</p>}
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={busy || !valide}>{busy ? 'Envoi…' : libelle}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
