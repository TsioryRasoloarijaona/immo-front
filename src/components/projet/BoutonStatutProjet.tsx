import { useState } from 'react';
import { ArrowRightLeft, Check, X } from 'lucide-react';
import BarreIcones from '../BarreIcones';
import SearchableSelect from '../SearchableSelect';
import { Button } from '../ui/button';
import { Field, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { executeTransitionProjet, listTransitionsProjet } from '../../lib/apiProjetConfig';
import { useSaisie } from '../../lib/saisiePatrimoine';
import { toApiDateTime } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import type { UUID } from '../../types';
import type { ProjetConfigDto } from '../../types/projetConfig';

/** Statut courant et changement de statut : seules les transitions renvoyées par le serveur sont proposées. */
export default function BoutonStatutProjet({ projetId, statut, onChange }: Readonly<{
  projetId: UUID;
  statut?: string | null;
  onChange: (projet: ProjetConfigDto) => void;
}>) {
  const transitions = useApi(() => listTransitionsProjet(projetId), [projetId]);
  const [ouvert, setOuvert] = useState(false);
  const [transitionId, setTransitionId] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [date, setDate] = useState('');
  const { envoi, erreur, envoyer } = useSaisie([], {});
  const liste = transitions.data ?? [];
  const choisie = liste.find((t) => t.id === transitionId);
  const aucune = transitions.data !== null && liste.length === 0;

  function fermer() {
    setOuvert(false);
    setTransitionId('');
    setCommentaire('');
    setDate('');
  }

  function valider() {
    void envoyer(
      () => executeTransitionProjet(projetId, {
        transitionId,
        commentaire: commentaire.trim() || null,
        dateUtilisateur: toApiDateTime(date) ?? null,
      }),
      (projet) => { fermer(); onChange(projet); void transitions.refetch(); },
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="text-label text-muted-foreground">Statut</span>
        <span className="text-body font-semibold text-foreground">{statut ?? '—'}</span>
        <BarreIcones className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" disabled={aucune || transitions.data === null}
            title={aucune ? 'Aucune transition autorisée' : undefined} onClick={() => setOuvert(true)}>
            <ArrowRightLeft /> Changer de statut
          </Button>
        </BarreIcones>
        {transitions.error && <span className="text-micro text-destructive">{transitions.error}</span>}
      </div>
      {ouvert && (
        <div className="flex flex-col gap-2.5 rounded-lg border border-border p-2.5">
          <Field>
            <FieldLabel htmlFor="statut-transition">Transition</FieldLabel>
            <SearchableSelect id="statut-transition" value={transitionId || null} placeholder="Choisir…"
              emptyMessage="Aucune transition" className="w-full min-w-0" onValueChange={(v) => setTransitionId(v ?? '')}
              items={liste.map((t) => ({ value: t.id, label: t.description ?? t.statutCible?.description ?? t.code ?? '—' }))} />
          </Field>
          {choisie?.secondUtilisateur && (
            <p className="text-body text-destructive">Cette transition exige un second utilisateur : le serveur la refusera.</p>
          )}
          {choisie?.avecDateUtilisateur && (
            <Field>
              <FieldLabel htmlFor="statut-date">Date</FieldLabel>
              <Input id="statut-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          )}
          {choisie && (
            <Field>
              <FieldLabel htmlFor="statut-commentaire">Commentaire{choisie.commentaireObligatoire ? ' *' : ''}</FieldLabel>
              <Textarea id="statut-commentaire" rows={2} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
            </Field>
          )}
          {erreur && <p className="text-body text-destructive">{erreur}</p>}
          <BarreIcones className="flex items-center justify-end gap-1">
            <Button type="button" size="sm" disabled={envoi || !choisie} onClick={valider}><Check /> Valider</Button>
            <Button type="button" variant="outline" size="sm" disabled={envoi} onClick={fermer}><X /> Annuler</Button>
          </BarreIcones>
        </div>
      )}
    </div>
  );
}
