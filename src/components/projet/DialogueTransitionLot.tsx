import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { oublierLecturesRecentes } from '../../lib/api';
import { listStatutsLot, saveTransitionLot } from '../../lib/apiProjetConfig';
import { listerRoles } from '../../lib/apiRoles';
import { errorMessage, useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { StatutLotDto, TransitionLotEcritureDto, TransitionStatutLotDto } from '../../types/projetConfig';

const CLASSE_SELECT =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-body text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none';

function Case({ libelle, coche, onChange }: Readonly<{ libelle: string; coche: boolean; onChange: (v: boolean) => void }>) {
  return (
    <label className="flex w-fit items-center gap-2 text-label text-foreground">
      <input type="checkbox" className="accent-(--brand)" checked={coche} onChange={(e) => onChange(e.target.checked)} />
      {libelle}
    </label>
  );
}

function ChoixStatut({ id, libelle, valeur, statuts, onChange }: Readonly<{
  id: string; libelle: string; valeur: string; statuts: StatutLotDto[]; onChange: (v: string) => void;
}>) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{libelle} *</FieldLabel>
      <select id={id} className={CLASSE_SELECT} value={valeur} onChange={(e) => onChange(e.target.value)}>
        <option value="">Choisir…</option>
        {statuts.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
      </select>
    </Field>
  );
}

/** Création (`transition` absente) ou modification d'une transition de lot du genre `genreId` (le genre ne change pas). */
export default function DialogueTransitionLot({ transition, genreId, genreLibelle, ordreDefaut, onClose, onEnregistre }: Readonly<{
  transition: TransitionStatutLotDto | null;
  genreId: UUID;
  genreLibelle: string;
  ordreDefaut: number;
  onClose: () => void;
  onEnregistre: () => void;
}>) {
  const statuts = useApi(listStatutsLot, [], 'projet-config-statuts-lot');
  const catalogue = useApi(listerRoles, [], 'achat-config-roles-transition');
  const [ordre, setOrdre] = useState(String(transition?.ordre ?? ordreDefaut));
  const [code, setCode] = useState(transition?.code ?? '');
  const [description, setDescription] = useState(transition?.description ?? '');
  const [depart, setDepart] = useState<string>(transition?.statutDepartId ?? '');
  const [arrivee, setArrivee] = useState<string>(transition?.statutArriveeId ?? '');
  const [commentaire, setCommentaire] = useState(transition?.avecCommentaire ?? false);
  const [motDePasse, setMotDePasse] = useState(transition?.avecMotDePasse ?? false);
  const [automatique, setAutomatique] = useState(transition?.transitionAutomatique ?? false);
  const [roleIds, setRoleIds] = useState<UUID[]>((transition?.roles ?? []).map((r) => r.id));
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const roles = [...new Map([...(transition?.roles ?? []), ...(catalogue.data ?? [])].map((r) => [r.id, r])).values()];
  const duGenre = (statuts.data ?? []).filter((s) => s.groupeId === genreId);

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    const corps: TransitionLotEcritureDto = {
      genreId, ordre: Number(ordre), code: code.trim(), description: description.trim(),
      statutDepartId: depart, statutArriveeId: arrivee,
      avecCommentaire: commentaire, avecMotDePasse: motDePasse, transitionAutomatique: automatique, roleIds,
    };
    setEnvoi(true);
    setErreur(null);
    try {
      await saveTransitionLot(corps, transition?.id);
      oublierLecturesRecentes();
      onEnregistre();
    } catch (err) {
      oublierLecturesRecentes();
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal title={transition ? 'Modifier la transition' : `Nouvelle transition — ${genreLibelle}`} onClose={onClose} width={560}>
      <form onSubmit={(e) => void enregistrer(e)} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <ChoixStatut id="tl-depart" libelle="De" valeur={depart} statuts={duGenre} onChange={setDepart} />
          <ChoixStatut id="tl-arrivee" libelle="À" valeur={arrivee} statuts={duGenre} onChange={setArrivee} />
          <Field>
            <FieldLabel htmlFor="tl-ordre">O.D.T.</FieldLabel>
            <Input id="tl-ordre" type="number" min={0} value={ordre} onChange={(e) => setOrdre(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="tl-code">Code</FieldLabel>
            <Input id="tl-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field className="col-span-2">
            <FieldLabel htmlFor="tl-desc">Description *</FieldLabel>
            <Input id="tl-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <Case libelle="Avec commentaire" coche={commentaire} onChange={setCommentaire} />
        <Case libelle="Avec mot de passe" coche={motDePasse} onChange={setMotDePasse} />
        <Case libelle="Transition automatique" coche={automatique} onChange={setAutomatique} />
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-label font-medium text-foreground">Rôles autorisés</legend>
          {roles.length === 0 && <p className="text-micro text-muted-foreground">Aucun rôle disponible.</p>}
          <div className="grid max-h-40 grid-cols-2 gap-x-4 gap-y-1 overflow-auto">
            {roles.map((r) => (
              <Case key={r.id} libelle={r.code ?? ''} coche={roleIds.includes(r.id)}
                onChange={(v) => setRoleIds(v ? [...roleIds, r.id] : roleIds.filter((i) => i !== r.id))} />
            ))}
          </div>
        </fieldset>
        {statuts.error && <p role="alert" className="text-body text-destructive">{statuts.error}</p>}
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
          <Button type="submit" disabled={envoi || !depart || !arrivee || !description.trim()}>Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
