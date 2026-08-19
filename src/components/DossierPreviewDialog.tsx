import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Modal from './Modal';
import { Badge, Field, FieldGrid, LoadingState, ErrorState } from './ui';
import { Button } from './ui/button';
import { formatCurrency, formatDate } from '../lib/format';
import { toneForStatus } from '../lib/dossierStatus';
import { getDossier } from '../lib/api';
import { useApi } from '../lib/useApi';

// Reciprocal-access preview: lets any list row or linked-record button in
// the app show a Dossier's key facts without leaving the current page.
// See ProspectionPreviewDialog for the mirror direction.
export default function DossierPreviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: d, loading, error } = useApi(() => getDossier(id), [id]);

  return (
    <Modal title={d?.code ? `Dossier ${d.code}` : 'Dossier'} onClose={onClose} width={460}>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {d && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={toneForStatus(d.statut)}>{d.statut || '—'}</Badge>
          </div>
          <FieldGrid>
            <Field label="Client" value={d.clientNom} />
            <Field label="Prix retenu" value={d.prix ? formatCurrency(d.prix) : undefined} />
            <Field label="Total à payer" value={d.totalAPayer ? formatCurrency(d.totalAPayer) : undefined} />
            <Field label="Commercial" value={d.commercialNom} />
            <Field label="Créé le" value={formatDate(d.dateDocument)} />
          </FieldGrid>
          <div className="flex justify-end gap-2 border-t border-border pt-3.5">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
            <Button render={<Link to={`/dossiers/${d.id}`} />}>
              Ouvrir la fiche complète <ArrowUpRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
