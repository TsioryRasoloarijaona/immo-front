import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Modal from './Modal';
import { Badge, Field, FieldGrid } from './ui';
import { Button } from './ui/button';
import { formatCurrency, formatDate } from '../lib/format';
import { isPreProspection } from '../lib/domain';
import { usePreview } from '../lib/previewContext';
import { useStore } from '../lib/storeContext';
import type { DerivedDossierStatus, Dossier } from '../types';

// Reciprocal-access preview: lets any list row or linked-record button in
// the app show a Dossier's key facts without leaving the current page. If
// this dossier came from a prospection, "Voir la prospection d'origine"
// swaps this dialog for ProspectionPreviewDialog in place — no navigation.
// See ProspectionPreviewDialog for the mirror direction.
export default function DossierPreviewDialog({
  dossier,
  status,
  onClose,
}: {
  dossier: Dossier;
  status: DerivedDossierStatus;
  onClose: () => void;
}) {
  const { prospections } = useStore();
  const { previewProspection } = usePreview();
  const prospection = dossier.prospectionId ? prospections.find((p) => p.id === dossier.prospectionId) : undefined;

  return (
    <Modal title={`Dossier ${dossier.code}`} onClose={onClose} width={460}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          {dossier.isOldCustomer && <Badge tone="info">Ancien client</Badge>}
        </div>
        <FieldGrid>
          <Field label="Client" value={dossier.client?.name} />
          <Field label="Article" value={dossier.article?.code} />
          <Field label="Prix retenu" value={dossier.price ? formatCurrency(dossier.price) : undefined} />
          <Field label="Total à payer" value={dossier.totalToPay ? formatCurrency(dossier.totalToPay) : undefined} />
          <Field label="Commercial" value={dossier.commercial} />
          <Field label="Créé le" value={formatDate(dossier.date)} />
        </FieldGrid>
        {prospection && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => previewProspection(prospection.id)}
              className="inline-flex w-fit items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline"
            >
              Voir la prospection d'origine <ArrowUpRight className="size-2.5" />
            </button>
            {isPreProspection(prospection) && <Badge tone="amber">Née pré-prospection</Badge>}
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-3.5">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button render={<Link to={`/dossiers/${dossier.id}`} />}>
            Ouvrir la fiche complète <ArrowUpRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
