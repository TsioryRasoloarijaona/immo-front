import { useState } from 'react';
import { Workflow } from 'lucide-react';
import Modal from '../Modal';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { executerTransitionEtude, listTransitionsEtude } from '../../lib/apiFaisabilite';
import { useAuth } from '../../lib/auth';
import { estExempte } from '../../lib/roles';
import { errorMessage, useApi } from '../../lib/useApi';
import { prerequisManquants, transitionsPermises } from '../../lib/workflowFaisabilite';

function DialogueTransition({ etudeId, onClose, onFait }: Readonly<{ etudeId: string; onClose: () => void; onFait: () => void }>) {
  const transitions = useApi(() => listTransitionsEtude(etudeId), [etudeId]);
  const [choisie, setChoisie] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [permises, setPermises] = useState<string[]>([]);
  const transition = transitions.data?.find((t) => t.id === choisie);
  const manquants = transition ? prerequisManquants(transition) : [];

  async function valider() {
    if (!transition) return;
    setEnvoi(true);
    setErreur(null);
    setPermises([]);
    try {
      await executerTransitionEtude(etudeId, { transitionId: transition.id });
      onFait();
      onClose();
    } catch (err) {
      setErreur(errorMessage(err));
      setPermises(transitionsPermises(err));
      setEnvoi(false);
    }
  }

  return (
    <Modal title="Changer de statut" onClose={onClose} width={560}>
      <div className="flex flex-col gap-3">
        {transitions.error && <ErrorState message={transitions.error} />}
        {!transitions.error && !transitions.data && <LoadingState />}
        {!transitions.error && transitions.data?.length === 0 && (
          <EmptyState title="Aucune transition possible" message="Votre rôle ne permet aucune transition depuis le statut courant." />
        )}
        {!transitions.error && transitions.data && transitions.data.length > 0 && (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1 text-label font-medium text-foreground">Transition à effectuer</legend>
            {transitions.data.map((t) => (
              <label key={t.id} className="flex items-start gap-2 rounded-md border border-border p-2 text-body text-foreground">
                <input type="radio" name="transition-etude" className="mt-1" checked={choisie === t.id} onChange={() => setChoisie(t.id)} />
                {`${t.description || 'Transition'} — ${t.statutDepartLibelle ?? '?'} → ${t.statutArriveeLibelle ?? '?'}`}
              </label>
            ))}
          </fieldset>
        )}
        {transition && (
          <div className="rounded-md bg-muted/40 p-2.5 text-body">
            {manquants.length === 0 ? <p>Tous les prérequis sont remplis.</p> : (
              <>
                <p className="mb-1 font-medium text-foreground">Prérequis manquants (le serveur refusera la transition) :</p>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {manquants.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
        {erreur && <p role="alert" className="whitespace-pre-line text-body text-destructive">{erreur}</p>}
        {permises.length > 0 && (
          <div className="text-body">
            <p className="font-medium text-foreground">Transitions permises depuis ce statut :</p>
            <ul className="list-disc pl-5 text-muted-foreground">{permises.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        )}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={envoi}>Annuler</Button>
        <Button type="button" disabled={envoi || !transition} onClick={() => void valider()}>Confirmer la transition</Button>
      </DialogFooter>
    </Modal>
  );
}

/** Bouton « Changer de statut » : Administrateur et Direction Générale ; désactivé si l'étude est bloquée. */
export default function ChangerStatutEtude({ etudeId, bloquee, onFait }: Readonly<{ etudeId: string; bloquee: boolean; onFait: () => void }>) {
  const { user } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  if (!estExempte(user)) return null;
  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={bloquee} title={bloquee ? 'Étude bloquée : débloquez-la pour changer de statut.' : undefined}
        onClick={() => setOuvert(true)}>
        <Workflow data-icon="inline-start" /> Changer de statut
      </Button>
      {ouvert && <DialogueTransition etudeId={etudeId} onClose={() => setOuvert(false)} onFait={onFait} />}
    </>
  );
}
