import { useState } from 'react';
import { PastilleCouleur } from '../../configuration/SelecteurCouleur';
import { EmptyState, ErrorState, LoadingState } from '../../ui';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { executerTransitionJourTravaille, getTransitionsJourTravaille } from '../../../lib/apiTravauxChantier';
import { errorMessage, useApi } from '../../../lib/useApi';
import type { ExecutionTransitionJourTravaille, JourTravailleFicheDto } from '../../../types/travauxChantier';

/** `datetime-local` (yyyy-MM-ddTHH:mm) vers `yyyy-MM-dd'T'HH:mm:ss`. */
function versSecondes(v: string): string {
  return v.length === 16 ? `${v}:00` : v;
}

/** Transitions de statut permises au jour travaillé ; l'exécution renvoie la fiche relue. */
export default function DialogueTransitionJourTravaille({
  id,
  statut,
  onAnnuler,
  onFait,
}: Readonly<{ id: string; statut: string; onAnnuler: () => void; onFait: (fiche: JourTravailleFicheDto) => void }>) {
  const transitions = useApi(() => getTransitionsJourTravaille(id), [id]);
  const [choisie, setChoisie] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [dateUtilisateur, setDateUtilisateur] = useState('');
  const [login, setLogin] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const liste = transitions.data ?? [];
  const transition = liste.find((t) => t.id === choisie);
  const avecNotes = !!transition && (transition.avecCommentaire || transition.avecDateUtilisateur);
  const incomplet =
    !transition ||
    (transition.avecCommentaire && !commentaire.trim()) ||
    (transition.avecDateUtilisateur && !dateUtilisateur) ||
    (transition.avecSecondValideur && (!login.trim() || !motDePasse));

  function executer() {
    if (!transition) return;
    const corps: ExecutionTransitionJourTravaille = {
      transitionId: transition.id,
      notes: avecNotes ? commentaire.trim() || null : null,
      dateUtilisateur: transition.avecDateUtilisateur ? versSecondes(dateUtilisateur) : null,
      secondValideur: transition.avecSecondValideur ? { login: login.trim(), motDePasse } : null,
    };
    setEnCours(true);
    setErreur(null);
    executerTransitionJourTravaille(id, corps)
      .then(onFait)
      .catch((err: unknown) => {
        setEnCours(false);
        setMotDePasse('');
        setErreur(errorMessage(err));
        setChoisie(null);
        void transitions.refetch();
      });
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onAnnuler()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le statut</DialogTitle>
          <DialogDescription>Statut actuel : {statut}.</DialogDescription>
        </DialogHeader>
        {transitions.error && <ErrorState message={transitions.error} />}
        {!transitions.error && !transitions.data && <LoadingState />}
        {!transitions.error && transitions.data && liste.length === 0 && <EmptyState title="Aucune transition disponible depuis ce statut." />}
        {!transitions.error && liste.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1" role="radiogroup" aria-label="Transitions">
              {liste.map((t) => (
                <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-body hover:bg-muted">
                  <input type="radio" name="transition" className="accent-(--brand)" checked={choisie === t.id} onChange={() => setChoisie(t.id)} />
                  {t.statutCible?.couleur && <PastilleCouleur nom={t.statutCible.couleur} />}
                  <span>{t.libelle ?? t.statutCible?.libelle ?? '—'}</span>
                  {t.statutCible?.libelle && t.libelle !== t.statutCible.libelle && (
                    <span className="text-muted-foreground">→ {t.statutCible.libelle}</span>
                  )}
                </label>
              ))}
            </div>
            {transition?.avecCommentaire && (
              <Textarea aria-label="Commentaire" rows={2} placeholder="Commentaire (obligatoire)" value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)} />
            )}
            {transition?.avecDateUtilisateur && (
              <Input type="datetime-local" aria-label="Date de l'opération" value={dateUtilisateur} onChange={(e) => setDateUtilisateur(e.target.value)} />
            )}
            {transition?.avecSecondValideur && (
              <div className="grid grid-cols-2 gap-2">
                <Input aria-label="Identifiant du second valideur" placeholder="Identifiant du second valideur" autoComplete="off"
                  value={login} onChange={(e) => setLogin(e.target.value)} />
                <Input type="password" aria-label="Mot de passe du second valideur" placeholder="Mot de passe" autoComplete="off"
                  value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
              </div>
            )}
          </div>
        )}
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button type="button" disabled={enCours || incomplet} onClick={executer}>
            Changer le statut
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
