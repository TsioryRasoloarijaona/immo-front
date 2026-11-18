import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import type { SearchableSelectOption } from '../../SearchableSelect';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import DialogueDecision from './DialogueDecision';
import { creerDecision, modifierDecision, supprimerDecision } from '../../../lib/apiReunions';
import { useConfirm } from '../../../lib/confirmContext';
import { formatDate } from '../../../lib/format';
import { MESSAGE_SUPPRESSION, type EcrireFiche } from '../../../lib/saisieReunion';
import type { ObservationDto, ReunionFicheDto } from '../../../types/reunions';

function Observation({ observation }: Readonly<{ observation: ObservationDto | null }>) {
  if (!observation) return <>—</>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className="size-2.5 shrink-0 rounded-full border border-border" style={{ backgroundColor: observation.couleur?.toLowerCase() || 'transparent' }} />
      {observation.libelle ?? '—'}
    </span>
  );
}

export default function OngletDecisions({ fiche, ecrire, lots, fournisseurs, statuts }: Readonly<{
  fiche: ReunionFicheDto;
  ecrire: EcrireFiche;
  lots: SearchableSelectOption[];
  fournisseurs: SearchableSelectOption[];
  statuts: ObservationDto[];
}>) {
  const confirmer = useConfirm();
  const [selection, setSelection] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<'nouveau' | 'modifier' | null>(null);
  const choisie = fiche.decisions.find((d) => d.id === selection) ?? null;
  const edition = dialogue === 'modifier' ? choisie : null;

  async function supprimer() {
    if (!choisie || !(await confirmer({ title: 'Supprimer', message: MESSAGE_SUPPRESSION, confirmLabel: 'Supprimer' }))) return;
    if (await ecrire(() => supprimerDecision(fiche.id, choisie.id))) setSelection(null);
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setDialogue('nouveau')}><Plus data-icon="inline-start" /> Ajouter</Button>
        <Button type="button" variant="ghost" size="sm" disabled={!choisie} onClick={() => setDialogue('modifier')}><Pencil data-icon="inline-start" /> Éditer</Button>
        <Button type="button" variant="ghost" size="sm" disabled={!choisie} onClick={() => void supprimer()}><Trash2 data-icon="inline-start" /> Supprimer</Button>
      </BarreIcones>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><span className="sr-only">Choix</span></TableHead>
            <TableHead>O.D.T.</TableHead>
            <TableHead>Lot</TableHead>
            <TableHead>Fournisseur</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Observation</TableHead>
            <TableHead>Objectif</TableHead>
            <TableHead>Note</TableHead>
            <TableHead>Fermé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fiche.decisions.map((d) => (
            <TableRow key={d.id} data-state={d.id === selection ? 'selected' : undefined}>
              <TableCell>
                <input type="radio" name="decision" aria-label={`Choisir la décision ${d.ordre ?? ''}`}
                  checked={d.id === selection} onChange={() => setSelection(d.id)} />
              </TableCell>
              <TableCell>{d.ordre ?? ''}</TableCell>
              <TableCell>{d.lot ?? '—'}</TableCell>
              <TableCell>{d.nousMemes ? 'Nous mêmes' : d.fournisseur ?? '—'}</TableCell>
              <TableCell className="whitespace-pre-wrap">{d.description ?? ''}</TableCell>
              <TableCell><Observation observation={d.observation} /></TableCell>
              <TableCell>{formatDate(d.objectif)}</TableCell>
              <TableCell className="whitespace-pre-wrap">{d.note ?? ''}</TableCell>
              <TableCell><input type="checkbox" aria-label="Fermé" checked={d.fermee} disabled readOnly /></TableCell>
            </TableRow>
          ))}
          {fiche.decisions.length === 0 && (
            <TableRow><TableCell colSpan={9} className="text-muted-foreground">Aucune décision</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      {(dialogue === 'nouveau' || edition) && (
        <DialogueDecision
          decision={edition ?? {}}
          statuts={statuts}
          lots={lots}
          fournisseurs={fournisseurs}
          onAnnuler={() => setDialogue(null)}
          onValider={(corps) => ecrire(() => (edition ? modifierDecision(fiche.id, edition.id, corps) : creerDecision(fiche.id, corps)))}
        />
      )}
    </div>
  );
}
