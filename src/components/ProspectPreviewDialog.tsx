import { ArrowUpRight } from 'lucide-react';
import Modal from './Modal';
import { Field, FieldGrid } from './ui';
import { Button } from './ui/button';
import { usePreview } from '../lib/previewContext';
import type { Person } from '../types';

// Fiche Prospect (contact) — the innermost link of the origin chain shown
// from DossierDetail/ProspectionDetail. A contact has no route of its own
// (it only exists embedded on a Prospection/Dossier — see
// instructions/FEATURE-transformation-prospect.md §5), so there's no
// "Ouvrir la fiche complète" here; "Voir la prospection" is offered instead
// when the caller knows which prospection this contact came from.
export default function ProspectPreviewDialog({
  person,
  prospectionId,
  onClose,
}: {
  person: Person;
  prospectionId?: string;
  onClose: () => void;
}) {
  const { previewProspection } = usePreview();
  return (
    <Modal title={person.name || 'Fiche prospect'} onClose={onClose} width={460}>
      <div className="flex flex-col gap-4">
        <FieldGrid>
          <Field label="Titre" value={person.title} />
          <Field label="Sexe" value={person.gender} />
          <Field label="Téléphone" value={person.phone} />
          <Field label="Mobile" value={person.mobile} />
          <Field label="Email" value={person.email} />
          <Field label="Ville" value={person.city} />
          <Field label="Adresse" value={person.address} />
          <Field label="Nationalité" value={person.nationality} />
          <Field label="Pièce d'identité" value={person.idNumber} />
          <Field label="Profession" value={person.profession} />
          <Field label="Enfants" value={person.nbrChildren ? String(person.nbrChildren) : undefined} />
        </FieldGrid>
        <div className="flex justify-end gap-2 border-t border-border pt-3.5">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          {prospectionId && (
            <Button onClick={() => previewProspection(prospectionId)}>
              Voir la prospection <ArrowUpRight data-icon="inline-end" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
