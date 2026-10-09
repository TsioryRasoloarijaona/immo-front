import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Modal from './Modal';
import { Badge, Field, FieldGrid, LoadingState, ErrorState } from './ui';
import { Button } from './ui/button';
import { formatDate } from '../lib/format';
import { etapeBadgeTone, prospectionDisplayName } from '../lib/domain';
import { getProspection } from '../lib/api';
import { useApi } from '../lib/useApi';
import { routeFicheProspection } from '../lib/parcours';

export default function ProspectionPreviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: p, loading, error } = useApi(() => getProspection(id), [id]);

  return (
    <Modal title={p?.code ? `Prospection ${p.code}` : 'Prospection'} onClose={onClose} width={460}>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {p && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Archivée' : p.etape || '—'}</Badge>
          </div>
          <FieldGrid>
            <Field label="Contact" value={prospectionDisplayName(p)} />
            <Field label="Origine" value={p.origine} />
            <Field label="Commercial" value={p.commercialNom} />
            <Field label="Créée le" value={formatDate(p.dateDocument)} />
          </FieldGrid>
          <div className="flex justify-end gap-2 border-t border-border pt-3.5">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
            {/* L'hôte des aperçus est au-dessus des routes : sans `onClose`, le dialogue resterait ouvert sur la page d'arrivée. */}
            <Button render={<Link to={routeFicheProspection(p.id, p.typeProspectionCode)} onClick={onClose} />}>
              Ouvrir la fiche complète <ArrowUpRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
