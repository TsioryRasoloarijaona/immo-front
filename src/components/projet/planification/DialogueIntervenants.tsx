import { useState } from 'react';
import { Pencil, Plus, Save, Trash2 } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { Field, FieldLabel } from '../../ui/field';
import { Input } from '../../ui/input';
import { oublierLecturesRecentes } from '../../../lib/api';
import {
  creerIntervenantPlanification,
  modifierIntervenantPlanification,
  supprimerIntervenantPlanification,
} from '../../../lib/apiPlanification';
import { useConfirm } from '../../../lib/confirmContext';
import { errorMessage } from '../../../lib/useApi';
import type { IntervenantPlanificationDto, PlanificationDetailDto } from '../../../types/planification';

/** Intervenants de la planification : liste, création, modification, suppression ; chaque écriture renvoie le détail complet. */
export default function DialogueIntervenants({ detail, lectureSeule, onClose, onChange }: Readonly<{
  detail: PlanificationDetailDto;
  lectureSeule: boolean;
  onClose: () => void;
  onChange: (detail: PlanificationDetailDto) => void;
}>) {
  const confirm = useConfirm();
  const [edite, setEdite] = useState<IntervenantPlanificationDto | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ecrire(action: () => Promise<PlanificationDetailDto>): Promise<boolean> {
    setErreur(null);
    try {
      onChange(await action());
      oublierLecturesRecentes();
      return true;
    } catch (err) {
      setErreur(errorMessage(err));
      return false;
    }
  }

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!edite) return;
    const corps = { code: edite.code?.trim(), description: edite.description?.trim(), notes: edite.notes?.trim() };
    const ok = await ecrire(() => (edite.id
      ? modifierIntervenantPlanification(detail.id, edite.id, corps)
      : creerIntervenantPlanification(detail.id, corps)));
    if (ok) setEdite(null);
  }

  async function supprimer(i: IntervenantPlanificationDto) {
    if (!i.id) return;
    const ok = await confirm({ title: "Supprimer l'intervenant ?", message: `« ${i.code ?? ''} » sera supprimé.`, confirmLabel: 'Supprimer' });
    if (ok) await ecrire(() => supprimerIntervenantPlanification(detail.id, i.id as string));
  }

  return (
    <Modal title="Intervenants" onClose={onClose} width={560}>
      <div className="flex flex-col gap-3">
        {!lectureSeule && !edite && (
          <BarreIcones className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEdite({ code: '', description: '', notes: '' })}><Plus /> Nouvel intervenant</Button>
          </BarreIcones>
        )}
        {edite && (
          <form onSubmit={(e) => void enregistrer(e)} className="flex flex-col gap-2">
            <BarreIcones className="flex items-center gap-1">
              <Button type="submit" variant="ghost" size="sm"><Save /> Enregistrer</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEdite(null)}>Annuler</Button>
            </BarreIcones>
            <Field>
              <FieldLabel htmlFor="int-code">Code *</FieldLabel>
              <Input id="int-code" value={edite.code ?? ''} onChange={(e) => setEdite({ ...edite, code: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="int-desc">Description</FieldLabel>
              <Input id="int-desc" value={edite.description ?? ''} onChange={(e) => setEdite({ ...edite, description: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="int-notes">Notes</FieldLabel>
              <Input id="int-notes" value={edite.notes ?? ''} onChange={(e) => setEdite({ ...edite, notes: e.target.value })} />
            </Field>
          </form>
        )}
        {detail.intervenants.length === 0 && <p className="text-body text-muted-foreground">Aucun intervenant défini.</p>}
        <ul className="flex flex-col divide-y divide-border rounded-md border">
          {detail.intervenants.map((i) => (
            <li key={i.id ?? i.code} className="flex items-center justify-between gap-2 px-2 py-1 text-body">
              <span>{[i.code, i.description].filter(Boolean).join(' — ')}</span>
              {!lectureSeule && (
                <BarreIcones className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEdite(i)}><Pencil /> Modifier</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void supprimer(i)}><Trash2 /> Supprimer</Button>
                </BarreIcones>
              )}
            </li>
          ))}
        </ul>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </div>
    </Modal>
  );
}
