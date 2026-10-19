import { useState } from 'react';
import { BellRing, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { creerNote, listNotes, supprimerNote } from '../../lib/apiAudit';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/confirmContext';
import { formatDate, formatDateTime, toApiDateTime } from '../../lib/format';
import { estAdministrateur } from '../../lib/roles';
import { errorMessage, useApi } from '../../lib/useApi';
import type { NoteDto, Porteur } from '../../types/audit';

function SaisieNote({ porteur, id, onAjoutee }: Readonly<{ porteur: Porteur; id: string; onAjoutee: () => void }>) {
  const [texte, setTexte] = useState('');
  const [rappel, setRappel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ajouter() {
    setBusy(true);
    setError(null);
    try {
      await creerNote({ porteur, id, texte, rappel: toApiDateTime(rappel) });
      setTexte('');
      setRappel('');
      onAjoutee();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void ajouter();
      }}
    >
      <Textarea aria-label="Nouvelle note" rows={3} placeholder="Saisir une note…" value={texte} onChange={(e) => setTexte(e.target.value)} />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`rappel-${id}`} className="text-micro text-muted-foreground">Rappel le</label>
        <Input id={`rappel-${id}`} type="date" className="w-40" value={rappel} onChange={(e) => setRappel(e.target.value)} />
        <Button type="submit" size="sm" className="ml-auto" disabled={busy || !texte.trim()}>Ajouter la note</Button>
      </div>
      {error && <p role="alert" className="text-micro text-destructive">{error}</p>}
    </form>
  );
}

function LigneNote({ note, admin, onSupprimee }: Readonly<{ note: NoteDto; admin: boolean; onSupprimee: () => void }>) {
  const confirm = useConfirm();
  const [error, setError] = useState<string | null>(null);

  async function supprimer() {
    const ok = await confirm({ title: 'Supprimer la note', message: 'Cette note sera supprimée définitivement.', confirmLabel: 'Supprimer' });
    if (!ok) return;
    try {
      await supprimerNote(note.id);
      onSupprimee();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <li className="flex flex-col gap-1 border-b border-border py-2 last:border-b-0">
      <div className="flex items-center gap-2 text-micro text-muted-foreground">
        <span className="font-medium text-foreground">{note.auteur || '—'}</span>
        <span className="tabular-nums">{formatDateTime(note.date)}</span>
        {note.rappel && (
          <span className="flex items-center gap-1">
            <BellRing className="size-3" aria-hidden /> Rappel le {formatDate(note.rappel)}
          </span>
        )}
        {admin && (
          <Button type="button" variant="ghost" size="icon-sm" className="ml-auto" aria-label="Supprimer la note" onClick={() => void supprimer()}>
            <Trash2 />
          </Button>
        )}
      </div>
      <p className="whitespace-pre-wrap text-body text-foreground">{note.texte}</p>
      {error && <p role="alert" className="text-micro text-destructive">{error}</p>}
    </li>
  );
}

/** Notes (AdmMessage) de l'objet : texte brut à l'écran, jamais du HTML (FEATURE-patrimoine-audit-actions.md §11.8). */
export default function PanneauNotes({ porteur, id }: Readonly<{ porteur: Porteur; id: string }>) {
  const { user } = useAuth();
  const admin = estAdministrateur(user);
  const notes = useApi(() => listNotes(porteur, id), [porteur, id]);
  const relire = () => void notes.refetch();

  return (
    <div className="flex flex-col gap-3">
      {admin && <SaisieNote porteur={porteur} id={id} onAjoutee={relire} />}
      {notes.error && <ErrorState message={notes.error} />}
      {!notes.error && !notes.data && <LoadingState />}
      {!notes.error && notes.data?.length === 0 && <EmptyState title="Aucune note" message="Aucune note n'a été saisie sur cet objet." />}
      {!notes.error && notes.data && notes.data.length > 0 && (
        <ul>
          {notes.data.map((n) => (
            <LigneNote key={n.id} note={n} admin={admin} onSupprimee={relire} />
          ))}
        </ul>
      )}
    </div>
  );
}
