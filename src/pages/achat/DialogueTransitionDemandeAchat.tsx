import { useState } from 'react';
import { PastilleCouleur } from '../../components/configuration/SelecteurCouleur';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { executerTransitionDemandeAchat, getTransitionsDemandeAchat } from '../../lib/apiDemandesAchat';
import { useApi } from '../../lib/useApi';
import type { DemandeAchatFiche, ExecutionTransitionDemandeAchat } from '../../types/demandesAchat';

/** `datetime-local` (yyyy-MM-ddTHH:mm) vers `yyyy-MM-dd'T'HH:mm:ss`. */
function versSecondes(v: string): string {
  return v.length === 16 ? `${v}:00` : v;
}

/** Transitions de statut permises à la demande d'achat ; l'exécution renvoie la fiche relue. */
export default function DialogueTransitionDemandeAchat({
  id,
  statut,
  onAnnuler,
  onFait,
}: Readonly<{ id: string; statut: string; onAnnuler: () => void; onFait: (fiche: DemandeAchatFiche) => void }>) {
  const transitions = useApi(() => getTransitionsDemandeAchat(id), [id]);
  const [choisie, setChoisie] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState('');
  const [dateUtilisateur, setDateUtilisateur] = useState('');
  const [login, setLogin] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const liste = transitions.data ?? [];
  const transition = liste.find((t) => t.id === choisie);
  const incomplet =
    !transition ||
    (transition.avecCommentaire && !commentaire.trim()) ||
    (transition.avecDateUtilisateur && !dateUtilisateur) ||
    (transition.avecSecondValideur && (!login.trim() || !motDePasse));

  function executer() {
    if (!transition) return;
    const corps: ExecutionTransitionDemandeAchat = {
      transitionId: transition.id,
      notes: commentaire.trim() || null,
      dateUtilisateur: transition.avecDateUtilisateur ? versSecondes(dateUtilisateur) : null,
      secondValideur: transition.avecSecondValideur ? { login: login.trim(), motDePasse } : null,
    };
    setEnCours(true);
    setErreur(null);
    executerTransitionDemandeAchat(id, corps)
      .then(onFait)
      .catch((err: unknown) => {
        setEnCours(false);
        setMotDePasse('');
        setErreur(err instanceof Error ? err.message : 'Le changement de statut a échoué.');
      });
  }

  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onAnnuler()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer de statut</DialogTitle>
          <DialogDescription>Statut actuel : {statut}.</DialogDescription>
        </DialogHeader>
        {transitions.error && <ErrorState message={transitions.error} />}
        {!transitions.error && !transitions.data && <LoadingState />}
        {!transitions.error && transitions.data && liste.length === 0 && <EmptyState title="Aucune transition possible depuis ce statut" />}
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
            {transition && (
              <>
                <Textarea
                  aria-label="Commentaire"
                  rows={2}
                  placeholder={transition.avecCommentaire ? 'Commentaire (obligatoire)' : 'Commentaire (facultatif)'}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                />
                {transition.avecDateUtilisateur && (
                  <Input type="datetime-local" aria-label="Date de l'opération" value={dateUtilisateur} onChange={(e) => setDateUtilisateur(e.target.value)} />
                )}
                {transition.avecSecondValideur && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input aria-label="Identifiant du second valideur" placeholder="Identifiant du second valideur" autoComplete="off"
                      value={login} onChange={(e) => setLogin(e.target.value)} />
                    <Input type="password" aria-label="Mot de passe du second valideur" placeholder="Mot de passe" autoComplete="off"
                      value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button type="button" disabled={enCours || incomplet} onClick={executer}>
            Changer de statut
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
