import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import Modal from './Modal';
import { Field, FieldGrid, LoadingState, ErrorState } from './ui';
import { Button } from './ui/button';
import { getProspect } from '../lib/api';
import { useApi } from '../lib/useApi';
import { personDisplayName } from '../lib/domain';
import { formatTelephone } from '../lib/format';
import { formatDate } from '../lib/format';

export default function ProspectPreviewDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: person, loading, error } = useApi(() => getProspect(id), [id]);

  return (
    <Modal title={person ? personDisplayName(person) : 'Fiche prospect'} onClose={onClose} width={460}>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {person && (
        <div className="flex flex-col gap-3">
          <FieldGrid>
            <Field label="Code" value={person.code} />
            <Field label="Téléphone" value={formatTelephone(person.telephone, person.indicatifTelephone)} />
            <Field label="Mobile" value={formatTelephone(person.mobile, person.indicatifMobile)} />
            <Field label="Email" value={person.email} />
            <Field label="Ville" value={person.ville} />
            <Field label="Adresse" value={person.adresse} />
            <Field label="Profession" value={person.profession} />
            <Field label="Date de naissance" value={person.dateNaissance ? formatDate(person.dateNaissance) : undefined} />
            <Field label="Enfants" value={person.nombreEnfants ? String(person.nombreEnfants) : undefined} />
          </FieldGrid>
          <div className="flex justify-end gap-2 border-t border-border pt-3.5">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
            <Button render={<Link to={`/prospects/${person.id}`} onClick={onClose} />}>
              Ouvrir la fiche complète <ArrowUpRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
