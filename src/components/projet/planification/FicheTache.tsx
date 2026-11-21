import { useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import Modal from '../../Modal';
import { Button } from '../../ui/button';
import { Field, FieldLabel } from '../../ui/field';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { oublierLecturesRecentes } from '../../../lib/api';
import { modifierTachePlanification } from '../../../lib/apiPlanification';
import { listLignesReferentiel } from '../../../lib/apiReferentielsAdmin';
import { LIBELLES_CONTRAINTE, LIBELLES_DEPENDANCE, libelleTache, valeurDate } from '../../../lib/planification';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { UUID } from '../../../types';
import type {
  ContrainteTache,
  PlanificationDetailDto,
  PredecesseurDto,
  TacheEcritureDto,
  TachePlanificationDto,
  TypeDependance,
} from '../../../types/planification';

const CLASSE_SELECT =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-body text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-60';

const nombre = (v: string): number | undefined => (v === '' ? undefined : Number(v));
const texte = (v: unknown): string => (typeof v === 'string' ? v : '');
const sansVide =(v: string): string | undefined => (v === '' ? undefined : v);

/** Fiche d'une tâche : modification (PATCH) ou lecture seule ; un champ vide n'est pas envoyé (inchangé). */
export default function FicheTache({ planification, tache, lectureSeule, onClose, onEnregistre }: Readonly<{
  planification: PlanificationDetailDto;
  tache: TachePlanificationDto;
  lectureSeule: boolean;
  onClose: () => void;
  onEnregistre: (detail: PlanificationDetailDto) => void;
}>) {
  const types = useApi(() => listLignesReferentiel('types-tache-planification'), [], 'planification-types-tache');
  const [code, setCode] = useState(tache.code);
  const [description, setDescription] = useState(tache.description ?? '');
  const [notes, setNotes] = useState(tache.notes ?? '');
  const [dateDebut, setDateDebut] = useState(valeurDate(tache.dateDebut));
  const [duree, setDuree] = useState(String(tache.duree ?? ''));
  const [avancement, setAvancement] = useState(String(tache.avancement ?? ''));
  const [alerte, setAlerte] = useState(String(tache.alerteAvantJours ?? ''));
  const [contrainte, setContrainte] = useState<ContrainteTache>(tache.contrainte);
  const [dateContrainte, setDateContrainte] = useState(valeurDate(tache.dateContrainte));
  const [echeance, setEcheance] = useState(valeurDate(tache.echeance));
  const [jalon, setJalon] = useState(tache.jalon ?? false);
  const [typeTacheId, setTypeTacheId] = useState<string>(tache.typeTacheId ?? '');
  const [predecesseurs, setPredecesseurs] = useState<PredecesseurDto[]>(tache.predecesseurs);
  const [intervenants, setIntervenants] = useState<UUID[]>(tache.intervenants);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const autres = planification.taches.filter((t) => t.id !== tache.id);

  const changerPredecesseur = (i: number, p: PredecesseurDto) => setPredecesseurs(predecesseurs.map((x, j) => (j === i ? p : x)));
  const basculerIntervenant = (id: UUID) =>
    setIntervenants(intervenants.includes(id) ? intervenants.filter((x) => x !== id) : [...intervenants, id]);

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    const corps: TacheEcritureDto = {
      code: sansVide(code.trim()),
      description: sansVide(description.trim()),
      notes: sansVide(notes.trim()),
      dateDebut: sansVide(dateDebut),
      duree: nombre(duree),
      avancement: nombre(avancement),
      alerteAvantJours: nombre(alerte),
      contrainte,
      dateContrainte: sansVide(dateContrainte),
      echeance: sansVide(echeance),
      jalon,
      typeTacheId: sansVide(typeTacheId),
      predecesseurs,
      intervenants,
    };
    setEnvoi(true);
    setErreur(null);
    try {
      const detail = await modifierTachePlanification(planification.id, tache.id, corps);
      oublierLecturesRecentes();
      onEnregistre(detail);
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal title={`Tâche ${libelleTache(tache)}`} onClose={onClose} width={720}>
      <form onSubmit={(e) => void enregistrer(e)} className="flex flex-col gap-3">
        {!lectureSeule && (
          <BarreIcones className="flex items-center gap-1">
            <Button type="submit" variant="ghost" size="sm" disabled={envoi}><Save /> Enregistrer</Button>
          </BarreIcones>
        )}
        <fieldset disabled={lectureSeule} className="grid grid-cols-3 gap-3">
          <Field>
            <FieldLabel htmlFor="ft-code">Code</FieldLabel>
            <Input id="ft-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field className="col-span-2">
            <FieldLabel htmlFor="ft-desc">Description</FieldLabel>
            <Input id="ft-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field className="col-span-3">
            <FieldLabel htmlFor="ft-notes">Notes</FieldLabel>
            <Textarea id="ft-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ft-debut">Date de début</FieldLabel>
            <Input id="ft-debut" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ft-duree">Durée (jours)</FieldLabel>
            <Input id="ft-duree" type="number" min={0} value={duree} onChange={(e) => setDuree(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ft-avanc">Avancement (%)</FieldLabel>
            <Input id="ft-avanc" type="number" min={0} max={100} value={avancement} onChange={(e) => setAvancement(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ft-contr">Contrainte</FieldLabel>
            <select id="ft-contr" className={CLASSE_SELECT} value={contrainte} onChange={(e) => setContrainte(e.target.value as ContrainteTache)}>
              {Object.entries(LIBELLES_CONTRAINTE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="ft-dcontr">Date de contrainte</FieldLabel>
            <Input id="ft-dcontr" type="date" value={dateContrainte} onChange={(e) => setDateContrainte(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ft-ech">Échéance</FieldLabel>
            <Input id="ft-ech" type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ft-alerte">Alerte avant (jours)</FieldLabel>
            <Input id="ft-alerte" type="number" min={0} value={alerte} onChange={(e) => setAlerte(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ft-type">Type de tâche</FieldLabel>
            <select id="ft-type" className={CLASSE_SELECT} value={typeTacheId} onChange={(e) => setTypeTacheId(e.target.value)}>
              <option value="" />
              {types.data?.flatMap((t) => (t.id ? [<option key={t.id} value={t.id}>{texte(t.description) || texte(t.code)}</option>] : []))}
            </select>
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-body">
            <input type="checkbox" checked={jalon} onChange={(e) => setJalon(e.target.checked)} /> Jalon
          </label>
        </fieldset>
        <fieldset disabled={lectureSeule} className="flex flex-col gap-2">
          <legend className="text-body font-medium">Prédécesseurs</legend>
          {predecesseurs.map((p, i) => (
            <div key={p.tacheId} className="flex items-center gap-2">
              <select aria-label="Tâche prédécesseur" className={CLASSE_SELECT} value={p.tacheId}
                onChange={(e) => changerPredecesseur(i, { ...p, tacheId: e.target.value })}>
                {autres.map((t) => <option key={t.id} value={t.id}>{libelleTache(t)}</option>)}
              </select>
              <select aria-label="Type de dépendance" className={CLASSE_SELECT} value={p.type ?? 'FIN_DEBUT'}
                onChange={(e) => changerPredecesseur(i, { ...p, type: e.target.value as TypeDependance })}>
                {Object.entries(LIBELLES_DEPENDANCE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <Button type="button" variant="ghost" size="sm" aria-label="Retirer le prédécesseur"
                onClick={() => setPredecesseurs(predecesseurs.filter((_, j) => j !== i))}><Trash2 /></Button>
            </div>
          ))}
          <Button type="button" variant="ghost" size="sm" className="self-start"
            disabled={autres.every((t) => predecesseurs.some((p) => p.tacheId === t.id))}
            onClick={() => {
              const libre = autres.find((t) => !predecesseurs.some((p) => p.tacheId === t.id));
              if (libre) setPredecesseurs([...predecesseurs, { tacheId: libre.id, type: 'FIN_DEBUT' }]);
            }}>
            <Plus /> Ajouter un prédécesseur
          </Button>
        </fieldset>
        <fieldset disabled={lectureSeule} className="flex flex-wrap gap-x-4 gap-y-1">
          <legend className="text-body font-medium">Intervenants</legend>
          {planification.intervenants.length === 0 && <span className="text-body text-muted-foreground">Aucun intervenant défini.</span>}
          {planification.intervenants.flatMap((i) => (i.id ? [(
            <label key={i.id} className="flex items-center gap-1.5 text-body">
              <input type="checkbox" checked={intervenants.includes(i.id)} onChange={() => basculerIntervenant(i.id as UUID)} />
              {i.code ?? i.description}
            </label>
          )] : []))}
        </fieldset>
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
      </form>
    </Modal>
  );
}
