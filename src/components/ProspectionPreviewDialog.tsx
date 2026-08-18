import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Modal from './Modal';
import { Badge, Field, FieldGrid } from './ui';
import { Button } from './ui/button';
import { formatDate } from '../lib/format';
import { isPreProspection, natureBadgeTone, prospectionDisplayName } from '../lib/domain';
import { usePreview } from '../lib/previewContext';
import { useStore } from '../lib/storeContext';
import type { Prospection } from '../types';

// Reciprocal-access preview: lets any list row or linked-record button in
// the app show a Prospection's key facts without leaving the current page.
// If this prospection already has a dossier, "Voir le dossier de vente"
// swaps this dialog for DossierPreviewDialog in place — no navigation, no
// need to open the full page first. See DossierPreviewDialog for the mirror
// direction and lib/previewContext.ts for how the swap works.
export default function ProspectionPreviewDialog({
  prospection,
  onClose,
}: {
  prospection: Prospection;
  onClose: () => void;
}) {
  const p = prospection;
  const { dossiers } = useStore();
  const { previewDossier } = usePreview();
  const linkedDossier = dossiers.find((d) => d.prospectionId === p.id);

  return (
    <Modal title={p.code ? `Prospection ${p.code}` : prospectionDisplayName(p)} onClose={onClose} width={460}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {isPreProspection(p) && <Badge tone="amber">Pré-prospection · Non qualifiée</Badge>}
          <Badge tone={natureBadgeTone(p.nature, p.isClosed)}>{p.isClosed ? 'Clôturée' : p.nature}</Badge>
          {linkedDossier && <Badge tone="success">Dossier ouvert</Badge>}
        </div>
        <FieldGrid>
          <Field label="Contact" value={prospectionDisplayName(p)} />
          <Field label="Téléphone" value={p.prospect?.phone || p.phone} />
          <Field label="Origine" value={p.origin} />
          <Field label="Commercial" value={p.commercial} />
          <Field label="Article visé" value={p.article?.code} />
          <Field label="Créée le" value={formatDate(p.date)} />
        </FieldGrid>
        {linkedDossier && (
          <button
            type="button"
            onClick={() => previewDossier(linkedDossier.id)}
            className="inline-flex w-fit items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline"
          >
            Voir le dossier de vente <ArrowUpRight className="size-2.5" />
          </button>
        )}
        <div className="flex justify-end gap-2 border-t border-border pt-3.5">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <Button render={<Link to={`/prospections/${p.id}`} />}>
            Ouvrir la fiche complète <ArrowUpRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
