import { useState } from 'react';
import { PastilleCouleur } from '../configuration/SelecteurCouleur';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { EmptyState, ErrorState } from '../ui';
import { Input } from '../ui/input';
import { ApiError } from '../../lib/api';
import { executerTransitionLot, getTransitionsLot } from '../../lib/apiProjet';
import { useApi } from '../../lib/useApi';
import type { LotListItemDto } from '../../types/projet';

/** Transitions de statut permises au lot (selon le rôle) ; l'exécution renvoie le lot à jour. */
export default function ModaleTransitionLot({
  lot,
  onAnnuler,
  onFait,
  onSansDroit,
  onIntrouvable,
}: Readonly<{ lot: LotListItemDto; onAnnuler: () => void; onFait: () => void; onSansDroit: () => void; onIntrouvable: () => void }>) {
  const transitions = useApi(() => getTransitionsLot(lot.id), [lot.id]);
  const [choisie, setChoisie] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  function executer() {
    if (!choisie) return;
    setEnCours(true);
    setErreur(null);
    executerTransitionLot(lot.id, { transitionId: choisie, notes: notes.trim() || null })
      .then(onFait)
      .catch((err: unknown) => {
        setEnCours(false);
        if (err instanceof ApiError && err.status === 403) onSansDroit();
        else if (err instanceof ApiError && err.status === 404) onIntrouvable();
        else setErreur(err instanceof Error ? err.message : 'Le changement de statut a échoué.');
      });
  }

  const liste = transitions.data ?? [];
  return (
    <Dialog open onOpenChange={(ouvert) => !ouvert && onAnnuler()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer de statut — {lot.code ?? 'lot'}</DialogTitle>
          <DialogDescription>Statut actuel : {lot.statutDescription ?? lot.statutCode ?? '—'}.</DialogDescription>
        </DialogHeader>
        {transitions.error && <ErrorState message={transitions.error} />}
        {!transitions.error && transitions.loading && !transitions.data && <p className="text-body text-muted-foreground">Chargement…</p>}
        {!transitions.error && transitions.data && liste.length === 0 && <EmptyState title="Aucune transition possible depuis ce statut" />}
        {!transitions.error && liste.length > 0 && (
          <div className="flex flex-col gap-1" role="radiogroup" aria-label="Transitions">
            {liste.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-body hover:bg-muted">
                <input type="radio" name="transition" className="accent-(--brand)" checked={choisie === t.id} onChange={() => setChoisie(t.id)} />
                {t.statutArriveeCouleur && <PastilleCouleur nom={t.statutArriveeCouleur} />}
                <span>{t.libelle ?? t.statutArriveeLibelle ?? '—'}</span>
                {t.statutArriveeLibelle && t.libelle !== t.statutArriveeLibelle && (
                  <span className="text-muted-foreground">→ {t.statutArriveeLibelle}</span>
                )}
              </label>
            ))}
            <Input aria-label="Notes" placeholder="Notes (facultatif)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        )}
        {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button type="button" disabled={enCours || !choisie} onClick={executer}>
            Changer de statut
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
