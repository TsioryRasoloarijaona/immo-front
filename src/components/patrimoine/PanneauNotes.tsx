import { useState } from 'react';
import { BellRing, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Field as FormField, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { createNote, deleteNote, listNotes } from '../../lib/api';
import { useConfirm } from '../../lib/confirmContext';
import { formatDate, formatDateTime, toApiDateTime } from '../../lib/format';
import { texteVersHtml } from '../../lib/notesAudit';
import { errorMessage, useApi } from '../../lib/useApi';
import type { NoteDto, PorteurNote, UUID } from '../../types';

function SaisieNote({ porteur, id, onCreee }: Readonly<{ porteur: PorteurNote; id: UUID; onCreee: () => void }>) {
  const [texte, setTexte] = useState('');
  const [rappel, setRappel] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer(e: React.SyntheticEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErreur(null);
    try {
      await createNote({ porteur, id, texteHtml: texteVersHtml(texte), rappel: toApiDateTime(rappel) });
      setTexte('');
      setRappel('');
      onCreee();
    } catch (err) {
      setErreur(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void enregistrer(e)} className="mb-3 flex flex-col gap-2 rounded-lg border border-border p-3">
      <FormField>
        <FieldLabel htmlFor={`note-${id}`}>Nouvelle note</FieldLabel>
        <Textarea id={`note-${id}`} value={texte} placeholder="Saisir la note…" onChange={(e) => setTexte(e.target.value)} />
      </FormField>
      <div className="flex flex-wrap items-end gap-2">
        <FormField className="w-auto">
          <FieldLabel htmlFor={`rappel-${id}`}>Rappel (facultatif)</FieldLabel>
          <Input id={`rappel-${id}`} type="date" value={rappel} onChange={(e) => setRappel(e.target.value)} />
        </FormField>
        <Button type="submit" size="sm" className="ml-auto" disabled={busy || !texte.trim()}>
          {busy ? 'Enregistrement…' : 'Ajouter la note'}
        </Button>
      </div>
      {erreur && <p role="alert" className="text-body text-destructive">{erreur}</p>}
    </form>
  );
}

function CarteNote({ note, admin, onSupprimer }: Readonly<{ note: NoteDto; admin: boolean; onSupprimer: (n: NoteDto) => void }>) {
  return (
    <article className="rounded-lg bg-muted/30 px-3 py-2">
      <header className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-muted-foreground">
        <span className="font-medium text-foreground">{note.auteur || '—'}</span>
        <span className="tabular-nums">{formatDateTime(note.date)}</span>
        {note.rappel && (
          <span className="inline-flex items-center gap-1">
            <BellRing aria-hidden className="size-3" /> Rappel le {formatDate(note.rappel)}
          </span>
        )}
        {admin && (
          <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => onSupprimer(note)}>
            <Trash2 data-icon="inline-start" /> Supprimer
          </Button>
        )}
      </header>
      {/* HTML assaini par le serveur (liste blanche sans attribut, scripts retirés) : sûr à injecter. */}
      <div
        className="text-body text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: note.texteHtml ?? '' }}
      />
    </article>
  );
}

/** Notes OMRAN (`AdmMessage`) d'une fiche ; saisie et suppression réservées à l'administrateur. */
export default function PanneauNotes({ porteur, id, admin }: Readonly<{ porteur: PorteurNote; id: UUID; admin: boolean }>) {
  const { data, error, refetch } = useApi(() => listNotes(porteur, id), [porteur, id]);
  const confirm = useConfirm();
  const [erreur, setErreur] = useState<string | null>(null);

  async function supprimer(note: NoteDto) {
    if (!note.id) return;
    const ok = await confirm({
      title: 'Supprimer la note',
      message: 'Voulez-vous vraiment supprimer cet enregistrement ?',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
    if (!ok) return;
    setErreur(null);
    try {
      await deleteNote(note.id);
      await refetch();
    } catch (err) {
      setErreur(errorMessage(err));
    }
  }

  return (
    <div>
      {admin && <SaisieNote porteur={porteur} id={id} onCreee={() => void refetch()} />}
      {erreur && <p role="alert" className="mb-2 text-body text-destructive">{erreur}</p>}
      {error && <ErrorState message={error} />}
      {!error && !data && <LoadingState />}
      {!error && data && data.length === 0 && <EmptyState title="Aucune note" />}
      {!error && data && data.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.map((n) => <CarteNote key={n.id} note={n} admin={admin} onSupprimer={(x) => void supprimer(x)} />)}
        </div>
      )}
    </div>
  );
}
