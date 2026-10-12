import { useState } from 'react';
import Modal from '../Modal';
import { Button } from '../ui/button';
import { DialogFooter } from '../ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { cn } from '../../lib/utils';
import { jourISO, toApiDateTime } from '../../lib/format';
import { useResultatsInteraction, useTypesContactProspection } from '../../lib/referentiels';
import {
  ACTIONS_PROCHAINES,
  RACCOURCIS_DATE,
  dansJours,
  phraseProchaineAction,
  resoudreAction,
  type TypeProchaineAction,
} from '../../lib/kanban';
import type { ProchaineActionRequest } from '../../types';

const TYPES: TypeProchaineAction[] = ['appel', 'whatsapp', 'visite'];

function Choix({ actif, disabled, onClick, children }: Readonly<{ actif: boolean; disabled?: boolean; onClick: () => void; children: string }>) {
  return (
    <Button
      type="button"
      size="sm"
      variant={actif ? 'default' : 'outline'}
      aria-pressed={actif}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

/** Dialogue obligatoire du Kanban : une prospection ne change jamais d'étape sans prochaine action datée. */
export default function ProchaineActionDialog({
  nom,
  depuis,
  vers,
  onClose,
  onSubmit,
}: Readonly<{
  nom: string;
  depuis: string;
  vers: string;
  onClose: () => void;
  /** Rejette en cas d'échec : le dialogue reste ouvert et affiche le message du serveur. */
  onSubmit: (action: ProchaineActionRequest, phrase: string) => Promise<void>;
}>) {
  const types = useTypesContactProspection();
  const resultats = useResultatsInteraction();
  const [type, setType] = useState<TypeProchaineAction | null>(null);
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const ids = type ? resoudreAction(type, types.data, resultats.data) : null;
  const passee = !!date && date.slice(0, 10) < jourISO(new Date());
  const complet = !!ids && !!date && !passee;
  const phrase = type && date && !passee ? phraseProchaineAction(type, date) : null;

  async function enregistrer() {
    if (!complet || !type || busy) return;
    setBusy(true);
    setErreur(null);
    try {
      await onSubmit(
        { typeId: ids.typeId, sousCategorieId: ids.sousCategorieId, date: toApiDateTime(date) ?? date, message: message.trim() || undefined },
        phraseProchaineAction(type, date),
      );
      onClose();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Prochaine action" onClose={onClose} width={500}>
      <p className="mb-3 text-body text-muted-foreground">
        {nom} · passage de {depuis} à {vers}
      </p>
      <FieldGroup>
        <FormField>
          <span id="pa-type" className="text-label font-medium text-foreground">Prochaine action (obligatoire)</span>
          <div role="group" aria-labelledby="pa-type" className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <Choix key={t} actif={type === t} disabled={!resoudreAction(t, types.data, resultats.data)} onClick={() => setType(t)}>
                {ACTIONS_PROCHAINES[t].libelle}
              </Choix>
            ))}
          </div>
        </FormField>
        <FormField>
          <FieldLabel htmlFor="pa-date">Quand (obligatoire)</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {RACCOURCIS_DATE.map((r) => (
              <Choix key={r.jours} actif={date === dansJours(r.jours)} onClick={() => setDate(dansJours(r.jours))}>
                {r.libelle}
              </Choix>
            ))}
          </div>
          <Input id="pa-date" type="datetime-local" min={`${jourISO(new Date())}T00:00`} value={date} onChange={(e) => setDate(e.target.value)} />
          {passee && <p className="mt-1 text-micro text-destructive">La date ne peut pas être dans le passé.</p>}
        </FormField>
        <FormField>
          <FieldLabel htmlFor="pa-message">Message (facultatif)</FieldLabel>
          <Textarea id="pa-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ce qu'il faudra dire ou montrer…" />
        </FormField>
        <p className={cn('text-body', phrase ? 'text-foreground' : 'text-(--warning)')}>
          {phrase ?? 'Choisissez la prochaine action et sa date pour enregistrer : un client ne reste jamais sans suite.'}
        </p>
        {erreur && (
          <p role="alert" className="text-label text-destructive">
            {erreur}
          </p>
        )}
      </FieldGroup>
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button type="button" onClick={() => void enregistrer()} disabled={!complet || busy}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
