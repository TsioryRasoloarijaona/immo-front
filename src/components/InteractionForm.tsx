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

// Reproduit la boîte de dialogue "Action" de l'ancien système (Action /
// Résultat / Date alerte, + un sélecteur de date de RDV quand le résultat
// en implique un) — voir docs/api-docsV4.json : POST
// /api/prospections/{id}/interactions accepte désormais actionTypeId
// (référentiel /api/referentiels/types-contact-prospection, réutilisé —
// même liste que le "Type de contact" d'une prospection), resultatId
// (référentiel /api/referentiels/resultats-interaction, qui indique via
// necessiteDateRdv/alerteRecommandee comment adapter ce formulaire sans
// coder les libellés en dur), dateAlerte et dateRdv.

// Sens de l'échange déduit du libellé de l'action choisie, pour continuer à
// alimenter le champ directionnel `entrante` (et donc la bonne icône dans
// la timeline via interactionIcon()) — le référentiel ne porte pas cette
// info explicitement.
function entranteFromActionLabel(label: string | undefined): boolean {
  return /entrant/i.test(label ?? '');
}

export default function InteractionForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: CreerInteractionRequest) => void;
}) {
  const actionTypes = useTypesContactProspection();
  const resultats = useResultatsInteraction();

  const [actionTypeId, setActionTypeId] = useState('');
  const [resultatId, setResultatId] = useState('');
  const [dateAlerte, setDateAlerte] = useState('');
  const [dateRdv, setDateRdv] = useState('');
  const [description, setDescription] = useState('');

  const actionItems = referentielItems(actionTypes.data);
  const resultatItems = [{ label: '— Non renseigné —', value: '' }, ...referentielItems(resultats.data)];

  const selectedResultat = useMemo(() => resultats.data.find((r) => r.id === resultatId), [resultats.data, resultatId]);
  const isRdv = !!selectedResultat?.necessiteDateRdv;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actionTypeId || !description.trim()) return;
    if (isRdv && !dateRdv) return;

    const actionLabel = actionTypes.data.find((a) => a.id === actionTypeId)?.description;
    onSubmit({
      description: description.trim(),
      entrante: entranteFromActionLabel(actionLabel),
      actionTypeId,
      resultatId: resultatId || undefined,
      dateAlerte: dateAlerte ? toApiDateTime(dateAlerte) : undefined,
      dateRdv: isRdv && dateRdv ? toApiDateTime(dateRdv) : undefined,
    });
    onClose();
  }

  return (
    <Modal title="Ajouter une action" onClose={onClose} width={480}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="action-type">Action</FieldLabel>
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
            <FieldLabel htmlFor="action-resultat">Résultat</FieldLabel>
            <SearchableSelect
              id="action-resultat"
              items={resultatItems}
              value={resultatId || null}
              onValueChange={(v) => setResultatId(v || '')}
              placeholder="— Non renseigné —"
              className="w-full"
            />
          </FormField>

          {isRdv && (
            <FormField>
              <FieldLabel htmlFor="action-date-rdv">Date du rendez-vous</FieldLabel>
              <Input id="action-date-rdv" type="date" value={dateRdv} onChange={(e) => setDateRdv(e.target.value)} required />
            </FormField>
          )}

          <FormField>
            <FieldLabel htmlFor="action-date-alerte">
              Date alerte
              {selectedResultat?.alerteRecommandee && <span className="ml-1.5 text-micro font-normal text-muted-foreground">(recommandée pour ce résultat)</span>}
            </FieldLabel>
            <Input id="action-date-alerte" type="date" value={dateAlerte} onChange={(e) => setDateAlerte(e.target.value)} />
          </FormField>

          <FormField>
            <FieldLabel htmlFor="description">Notes</FieldLabel>
            <Textarea
              id="description"
              placeholder="Compte-rendu de l'appel / de la visite…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </FormField>
        </FieldGroup>

        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
          <Button type="submit" disabled={!actionTypeId || !description.trim() || (isRdv && !dateRdv)}>Enregistrer</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}
