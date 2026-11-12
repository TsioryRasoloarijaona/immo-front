import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { oublierLecturesRecentes } from '../../lib/api';
import { creerTransitionAchat, listStatutsAchat, modifierTransitionAchat } from '../../lib/apiAchatConfig';
import { listRoles } from '../../lib/apiRoles';
import { errorMessage, useApi } from '../../lib/useApi';
import type { RoleTransitionDto, TransitionAchatDto, TransitionAchatEcritureDto } from '../../types/achatConfig';

const CLASSE_SELECT =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-body text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none';

/** Le catalogue des rôles est réservé aux administrateurs : sans lui, seuls les rôles déjà liés restent proposés. */
async function listerRoles(): Promise<RoleTransitionDto[]> {
  try {
    return (await listRoles({ size: 200 })).content.map((r) => ({ id: r.id, code: r.code }));
  } catch {
    return [];
  }
}

/** Création (`transition` absente, sans gestion) ou modification d'une transition sans gestion. */
export default function DialogueTransitionAchat({ transition, onClose, onEnregistre }: Readonly<{
  transition: TransitionAchatDto | null;
  onClose: () => void;
  onEnregistre: () => void;
}>) {
  const statuts = useApi(listStatutsAchat, [], 'achat-config-statuts');
  const catalogue = useApi(listerRoles, [], 'achat-config-roles-transition');
  const [ordre, setOrdre] = useState(String(transition?.ordre ?? 0));
  const [description, setDescription] = useState(transition?.description ?? '');
  const [depart, setDepart] = useState(transition?.statutDepartId ?? '');
  const [arrivee, setArrivee] = useState(transition?.statutArriveeId ?? '');
  const [note, setNote] = useState(transition?.noteObligatoire ?? false);
  const [declencheur, setDeclencheur] = useState(transition?.valideeParDeclencheur ?? false);
  const [roleIds, setRoleIds] = useState((transition?.roles ?? []).map((r) => r.id));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const roles = [...new Map([...(transition?.roles ?? []), ...(catalogue.data ?? [])].map((r) => [r.id, r])).values()];

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    const corps: TransitionAchatEcritureDto = {
      ordre: Number(ordre), description: description.trim(), statutDepartId: depart, statutArriveeId: arrivee,
      noteObligatoire: note, valideeParDeclencheur: declencheur, roleIds,
    };
    setEnvoi(true);
    setErreur(null);
    try {
      await (transition ? modifierTransitionAchat(transition.id, corps) : creerTransitionAchat(corps));
      oublierLecturesRecentes();
      onEnregistre();
    } catch (err) {
      oublierLecturesRecentes();
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  const choixStatut = (id: string, valeur: string, onChange: (v: string) => void, libelle: string) => (
    <Field>
      <FieldLabel htmlFor={id}>{libelle} *</FieldLabel>
      <select id={id} className={CLASSE_SELECT} value={valeur} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choisir…</option>
        {statuts.data?.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
      </select>
    </Field>
  );

  return (
    <Modal title={transition ? 'Modifier la transition' : 'Nouvelle transition'} onClose={onClose} width={560}>
      <form onSubmit={(e) => void enregistrer(e)} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="tr-ordre">Ordre</FieldLabel>
            <Input id="tr-ordre" type="number" min={0} value={ordre} onChange={(e) => setOrdre(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tr-desc">Description</FieldLabel>
            <Input id="tr-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          {choixStatut('tr-depart', depart, setDepart, 'De')}
          {choixStatut('tr-arrivee', arrivee, setArrivee, 'À')}
        </div>
        <label className="flex w-fit items-center gap-2 text-label text-foreground">
          <input type="checkbox" className="accent-(--brand)" checked={note} onChange={(e) => setNote(e.target.checked)} />
          Commentaire obligatoire
        </label>
        <label className="flex w-fit items-center gap-2 text-label text-foreground">
          <input type="checkbox" className="accent-(--brand)" checked={declencheur} onChange={(e) => setDeclencheur(e.target.checked)} />
          Validée par le déclencheur
        </label>
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-label font-medium text-foreground">Rôles autorisés</legend>
          {roles.length === 0 && <p className="text-micro text-muted-foreground">Aucun rôle disponible.</p>}
          <div className="grid max-h-40 grid-cols-2 gap-x-4 gap-y-1 overflow-auto">
            {roles.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-label text-foreground">
                <input type="checkbox" className="accent-(--brand)" checked={roleIds.includes(r.id)}
                  onChange={(e) => setRoleIds(e.target.checked ? [...roleIds, r.id] : roleIds.filter((i) => i !== r.id))} />
                {r.code}
              </label>
            ))}
          </div>
        </fieldset>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
          <Button type="submit" disabled={envoi || !depart || !arrivee}>Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
