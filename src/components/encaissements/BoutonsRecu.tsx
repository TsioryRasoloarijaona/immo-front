import { useState } from 'react';
import { Download, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { downloadRecuReglement, viewRecuReglement } from '../../lib/api';

/** « Reçu » d'un règlement : document du dossier (`/dossiers/{id}/reglements/{id}/documents/recu`). */
export default function BoutonsRecu({
  dossierId,
  reglementId,
  reference,
}: Readonly<{ dossierId: string; reglementId: string; reference?: string }>) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function lancer(action: 'view' | 'download') {
    setBusy(action);
    setErreur(null);
    try {
      if (action === 'view') await viewRecuReglement(dossierId, reglementId);
      else await downloadRecuReglement(dossierId, reglementId, `recu-${(reference || reglementId).replaceAll(/[/\\]/g, '-')}.pdf`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <span className="flex items-center gap-1.5">
      {erreur && <span className="text-micro text-destructive">{erreur}</span>}
      <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={() => void lancer('view')}>
        <Eye data-icon="inline-start" /> Reçu
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Télécharger le reçu"
        aria-label="Télécharger le reçu"
        disabled={!!busy}
        onClick={() => void lancer('download')}
      >
        <Download />
      </Button>
    </span>
  );
}
