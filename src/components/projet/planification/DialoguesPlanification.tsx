import { useState } from 'react';
import { Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import BarreIcones from '../../BarreIcones';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { Field, FieldLabel } from '../../ui/field';
import { Input } from '../../ui/input';
import { oublierLecturesRecentes } from '../../../lib/api';
import { listVersionsPlanification, modifierDateDebutPlanification } from '../../../lib/apiPlanification';
import { formatDate } from '../../../lib/format';
import { valeurDate } from '../../../lib/planification';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { PlanificationDetailDto } from '../../../types/planification';

/** Décale la planification entière : le serveur recalcule les dates des tâches. */
export function DialogueDateDebut({ detail, onClose, onChange }: Readonly<{
  detail: PlanificationDetailDto;
  onClose: () => void;
  onChange: (detail: PlanificationDetailDto) => void;
}>) {
  const [date, setDate] = useState(valeurDate(detail.dateDebut));
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    setErreur(null);
    try {
      onChange(await modifierDateDebutPlanification(detail.id, date));
      oublierLecturesRecentes();
      onClose();
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  return (
    <Modal title="Modifier la date de début" onClose={onClose} width={380}>
      <form onSubmit={(e) => void enregistrer(e)} className="flex flex-col gap-3">
        <BarreIcones className="flex items-center gap-1">
          <Button type="submit" variant="ghost" size="sm" disabled={!date}><Save /> Enregistrer</Button>
        </BarreIcones>
        <Field>
          <FieldLabel htmlFor="dd-date">Date de début</FieldLabel>
          <Input id="dd-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </form>
    </Modal>
  );
}

export function DialogueVersions({ planificationId, onClose }: Readonly<{
  planificationId: string;
  onClose: () => void;
}>) {
  const { data, error } = useApi(() => listVersionsPlanification(planificationId), [planificationId]);
  const versions = data ?? [];
  return (
    <Modal title="Versions" onClose={onClose} width={480}>
      {error && <p role="alert" className="text-body text-destructive">{error}</p>}
      {!error && data?.length === 0 && <p className="text-body text-muted-foreground">Aucune version sauvegardée.</p>}
      <ul className="flex flex-col divide-y divide-border rounded-md border">
        {!error && versions.map((v) => (
          <li key={v.id}>
            <Link to={`/projet/planification/${v.id}`} onClick={onClose} className="flex justify-between px-2 py-1 text-body hover:bg-muted">
              <span>{v.code}{v.description ? ` — ${v.description}` : ''}</span>
              <span className="text-muted-foreground">{formatDate(v.dateVersion)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
