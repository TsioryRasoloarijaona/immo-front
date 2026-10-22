import { useState } from 'react';
import { ChevronDown, Workflow } from 'lucide-react';
import Modal from '../Modal';
import { Button, buttonVariants } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { executerTransitionProspectionTerrain, getTransitionsProspectionTerrain } from '../../lib/apiProspectionsTerrain';
import { useAuth } from '../../lib/auth';
import { toApiDateTime } from '../../lib/format';
import { estAdministrateur } from '../../lib/roles';
import { errorMessage, useApi } from '../../lib/useApi';
import type { TransitionProspectionTerrainDto } from '../../types/prospectionsTerrain';

const libelle = (t: TransitionProspectionTerrainDto) => t.description || t.code || 'Transition';

function DialogueTransition({ id, transition, onClose, onFait }: Readonly<{
  id: string;
  transition: TransitionProspectionTerrainDto;
  onClose: () => void;
  onFait: () => void;
}>) {
  const [commentaire, setCommentaire] = useState('');
  const [date, setDate] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const manquant = transition.commentaireObligatoire && commentaire.trim() === '';

  async function valider() {
    setEnvoi(true);
    setErreur(null);
    try {
      await executerTransitionProspectionTerrain(id, {
        transitionId: transition.id,
        commentaire: commentaire.trim() || undefined,
        dateUtilisateur: toApiDateTime(date),
      });
      onFait();
      onClose();
    } catch (err) {
      setErreur(errorMessage(err));
      setEnvoi(false);
    }
  }

  return (
    <Modal title={libelle(transition)} onClose={onClose} width={480}>
      <div className="flex flex-col gap-3">
        {transition.statutCible && (
          <p className="text-body text-muted-foreground">
            Nouveau statut : <span className="font-medium text-foreground">{transition.statutCible.description || transition.statutCible.code}</span>
          </p>
        )}
        <label htmlFor="commentaire-transition" className="text-label font-medium text-foreground">
          Commentaire{transition.commentaireObligatoire ? ' *' : ''}
        </label>
        <Textarea id="commentaire-transition" rows={4} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
        {transition.avecDateUtilisateur && (
          <>
            <label htmlFor="date-transition" className="text-label font-medium text-foreground">Date de la transition</label>
            <Input id="date-transition" type="datetime-local" className="w-56" value={date} onChange={(e) => setDate(e.target.value)} />
          </>
        )}
        {erreur && <p role="alert" className="text-micro text-destructive">{erreur}</p>}
      </div>
      <DialogFooter className="mt-4">
        <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
        <Button type="button" disabled={envoi || manquant} onClick={() => void valider()}>Valider</Button>
      </DialogFooter>
    </Modal>
  );
}

/** Menu « Changer de statut » : une action par transition sortante ; dialogue de commentaire si la transition l'exige. */
export default function TransitionsProspection({ id, statutId, onFait }: Readonly<{
  id: string;
  /** Change quand la prospection change de statut : relit les transitions. */
  statutId?: string | null;
  onFait: () => void;
}>) {
  const { user } = useAuth();
  const transitions = useApi(() => getTransitionsProspectionTerrain(id), [id, statutId]);
  const [choisie, setChoisie] = useState<TransitionProspectionTerrainDto | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  if (!estAdministrateur(user) || !transitions.data || transitions.data.length === 0) return null;

  async function lancer(t: TransitionProspectionTerrainDto) {
    setErreur(null);
    if (t.commentaireObligatoire || t.avecDateUtilisateur) {
      setChoisie(t);
      return;
    }
    try {
      await executerTransitionProspectionTerrain(id, { transitionId: t.id });
      onFait();
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Workflow data-icon="inline-start" /> Changer de statut <ChevronDown data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-56">
          {transitions.data.map((t) => (
            <DropdownMenuItem key={t.id} disabled={t.secondUtilisateur} onClick={() => void lancer(t)}>
              {libelle(t)}
              {t.statutCible && <span className="text-muted-foreground"> → {t.statutCible.description || t.statutCible.code}</span>}
              {t.secondUtilisateur && <span className="text-muted-foreground"> (second utilisateur : non pris en charge)</span>}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {erreur && <span role="alert" className="text-label text-destructive">{erreur}</span>}
      {choisie && <DialogueTransition id={id} transition={choisie} onClose={() => setChoisie(null)} onFait={onFait} />}
    </>
  );
}
