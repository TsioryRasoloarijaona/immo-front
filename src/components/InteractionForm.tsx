import { useMemo, useState } from 'react';
import Modal from './Modal';
import type { CreerInteractionRequest } from '../types';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from './ui/field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import SearchableSelect from './SearchableSelect';
import { toApiDateTime } from '../lib/format';
import { referentielItems, useResultatsInteraction, useTypesContactProspection } from '../lib/referentiels';

// Champs obligatoires : règle OMRAN GEN0005, la même que le serveur — les garder alignés.

// Le référentiel ne porte pas le sens de l'échange : on le déduit du libellé.
function entranteFromActionLabel(label: string | undefined): boolean {
  return /entrant/i.test(label ?? '');
}

function estUneNote(code: string | undefined): boolean {
  return (code ?? '').trim().toLowerCase() === 'note';
}

function Exigence({ requis }: Readonly<{ requis: boolean }>) {
  return (
    <span className="ml-1.5 text-micro font-normal text-muted-foreground">{requis ? '(obligatoire)' : '(facultatif)'}</span>
  );
}

function Indication({ children }: Readonly<{ children: string }>) {
  return <p className="mt-1 text-micro text-muted-foreground">{children}</p>;
}

export default function InteractionForm({
  onClose,
  onSubmit,
}: Readonly<{
  onClose: () => void;
  /** Rejette en cas d'échec : le formulaire reste ouvert, saisie conservée, et affiche le message. */
  onSubmit: (input: CreerInteractionRequest) => Promise<void>;
}>) {
  const actionTypes = useTypesContactProspection();
  const resultats = useResultatsInteraction();

  const [actionTypeId, setActionTypeId] = useState('');
  const [resultatId, setResultatId] = useState('');
  const [dateAlerte, setDateAlerte] = useState('');
  const [dateRdv, setDateRdv] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const actionItems = referentielItems(actionTypes.data);
  const resultatItems = [{ label: '— Non renseigné —', value: '' }, ...referentielItems(resultats.data)];

  const selectedAction = useMemo(() => actionTypes.data.find((a) => a.id === actionTypeId), [actionTypes.data, actionTypeId]);
  const selectedResultat = useMemo(() => resultats.data.find((r) => r.id === resultatId), [resultats.data, resultatId]);
  const isNote = estUneNote(selectedAction?.code);
  const isRdv = !!selectedResultat?.necessiteDateRdv;
  const alerteRequise = !!selectedResultat?.alerteRecommandee;

  const resultatManquant = !!actionTypeId && !isNote && !resultatId;
  const messageManquant = isNote && !description.trim();
  const alerteManquante = alerteRequise && !dateAlerte;
  const rdvManquant = isRdv && !dateRdv;
  const incomplet = !actionTypeId || resultatManquant || messageManquant || alerteManquante || rdvManquant;

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (incomplet || busy) return;

    setBusy(true);
    setErreur(null);
    try {
      await onSubmit({
        description: description.trim() || undefined,
        entrante: entranteFromActionLabel(selectedAction?.description),
        actionTypeId,
        resultatId: resultatId || undefined,
        dateAlerte: dateAlerte ? toApiDateTime(dateAlerte) : undefined,
        dateRdv: isRdv && dateRdv ? toApiDateTime(dateRdv) : undefined,
      });
      onClose();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'enregistrement de l'action.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Ajouter une action" onClose={onClose} width={480}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="action-type">
              Action
              <Exigence requis />
            </FieldLabel>
            <SearchableSelect
              id="action-type"
              items={actionItems}
              value={actionTypeId || null}
              onValueChange={(v) => setActionTypeId(v || '')}
              placeholder="Sélectionner…"
              className="w-full"
            />
          </FormField>

          <FormField>
            <FieldLabel htmlFor="action-resultat">
              Résultat
              {actionTypeId && <Exigence requis={!isNote} />}
            </FieldLabel>
            <SearchableSelect
              id="action-resultat"
              items={resultatItems}
              value={resultatId || null}
              onValueChange={(v) => setResultatId(v || '')}
              placeholder="— Non renseigné —"
              className="w-full"
            />
            {resultatManquant && <Indication>Le résultat est obligatoire pour une action autre qu'une note.</Indication>}
          </FormField>

          {isRdv && (
            <FormField>
              <FieldLabel htmlFor="action-date-rdv">
                Date et heure du rendez-vous
                <Exigence requis />
              </FieldLabel>
              {/* `datetime-local` et non `date` : le calendrier affiche l'heure du RDV. */}
              <Input id="action-date-rdv" type="datetime-local" value={dateRdv} onChange={(e) => setDateRdv(e.target.value)} required />
            </FormField>
          )}

          <FormField>
            <FieldLabel htmlFor="action-date-alerte">
              Date alerte
              <Exigence requis={alerteRequise} />
            </FieldLabel>
            <Input id="action-date-alerte" type="date" value={dateAlerte} onChange={(e) => setDateAlerte(e.target.value)} />
            {alerteManquante && <Indication>Ce résultat est paramétré avec alerte : la date d'alerte est obligatoire.</Indication>}
          </FormField>

          <FormField>
            <FieldLabel htmlFor="description">
              Message
              {actionTypeId && <Exigence requis={isNote} />}
            </FieldLabel>
            <Textarea
              id="description"
              placeholder="Compte-rendu de l'appel / de la visite…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {messageManquant && <Indication>Le message est obligatoire pour une note.</Indication>}
          </FormField>

          {erreur && (
            <p role="alert" className="text-label text-destructive">
              {erreur}
            </p>
          )}
        </FieldGroup>

        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={incomplet || busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
