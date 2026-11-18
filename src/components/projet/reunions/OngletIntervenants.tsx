import { useState } from 'react';
import { ClipboardPlus, Pencil, Plus, Trash2, Users } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import type { SearchableSelectOption } from '../../SearchableSelect';
import { Button } from '../../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import DialogueDecision from './DialogueDecision';
import DialogueIntervenant from './DialogueIntervenant';
import TableContacts from './TableContacts';
import {
  creerContactIntervenant, creerDecision, creerIntervenant, getReunion, modifierContactIntervenant, modifierIntervenant,
  supprimerContactIntervenant, supprimerIntervenant,
} from '../../../lib/apiReunions';
import { useConfirm } from '../../../lib/confirmContext';
import { MESSAGE_SUPPRESSION, type EcrireFiche } from '../../../lib/saisieReunion';
import type { ObservationDto, ReunionFicheDto } from '../../../types/reunions';

type Dialogue = 'nouveau' | 'modifier' | 'decision' | 'contacts' | null;

/** Les contacts choisis sont ajoutés un à un : chaque appel renvoie la fiche, la dernière fait foi. */
async function ajouterContacts(id: string, intervenantId: string, ids: string[]): Promise<ReunionFicheDto> {
  let fiche: ReunionFicheDto | null = null;
  for (const contactId of ids) {
    fiche = await creerContactIntervenant(id, intervenantId, { contactId, present: false, aNotifier: false });
  }
  if (!fiche) throw new Error('Aucun contact choisi.');
  return fiche;
}

export default function OngletIntervenants({ fiche, ecrire, lots, fournisseurs, statuts }: Readonly<{
  fiche: ReunionFicheDto;
  ecrire: EcrireFiche;
  lots: SearchableSelectOption[];
  fournisseurs: SearchableSelectOption[];
  statuts: ObservationDto[];
}>) {
  const confirmer = useConfirm();
  const [selection, setSelection] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<Dialogue>(null);
  const choisi = fiche.intervenants.find((i) => i.id === selection) ?? null;
  const fermer = () => setDialogue(null);

  async function supprimer() {
    if (!choisi || !(await confirmer({ title: 'Supprimer', message: MESSAGE_SUPPRESSION, confirmLabel: 'Supprimer' }))) return;
    if (await ecrire(() => supprimerIntervenant(fiche.id, choisi.id))) setSelection(null);
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setDialogue('nouveau')}><Plus data-icon="inline-start" /> Ajouter</Button>
        <Button type="button" variant="ghost" size="sm" disabled={!choisi} onClick={() => setDialogue('modifier')}><Pencil data-icon="inline-start" /> Éditer</Button>
        <Button type="button" variant="ghost" size="sm" disabled={!choisi} onClick={() => void supprimer()}><Trash2 data-icon="inline-start" /> Supprimer</Button>
        <Button type="button" variant="ghost" size="sm" disabled={!choisi} onClick={() => setDialogue('contacts')}><Users data-icon="inline-start" /> Contacts</Button>
        <Button type="button" variant="ghost" size="sm" disabled={!choisi} onClick={() => setDialogue('decision')}>
          <ClipboardPlus data-icon="inline-start" /> Ajouter une décision pour un fournisseur
        </Button>
      </BarreIcones>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><span className="sr-only">Choix</span></TableHead>
            <TableHead>O.D.T.</TableHead>
            <TableHead>Effectif</TableHead>
            <TableHead>Lot</TableHead>
            <TableHead>Fournisseur</TableHead>
            <TableHead>Note</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fiche.intervenants.map((i) => (
            <TableRow key={i.id} data-state={i.id === selection ? 'selected' : undefined}>
              <TableCell>
                <input type="radio" name="intervenant" aria-label={`Choisir ${i.fournisseur ?? i.lot ?? 'cet intervenant'}`}
                  checked={i.id === selection} onChange={() => setSelection(i.id)} />
              </TableCell>
              <TableCell>{i.ordre ?? ''}</TableCell>
              <TableCell>{i.effectif ?? ''}</TableCell>
              <TableCell>{i.lot ?? '—'}</TableCell>
              <TableCell>{i.fournisseur ?? '—'}</TableCell>
              <TableCell className="whitespace-pre-wrap">{i.note ?? ''}</TableCell>
            </TableRow>
          ))}
          {fiche.intervenants.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-muted-foreground">Aucun intervenant</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      {(dialogue === 'nouveau' || (dialogue === 'modifier' && choisi)) && (
        <DialogueIntervenant
          intervenant={dialogue === 'modifier' ? choisi : null}
          lots={lots}
          fournisseurs={fournisseurs}
          onAnnuler={fermer}
          onValider={(corps) => ecrire(() => (dialogue === 'modifier' && choisi
            ? modifierIntervenant(fiche.id, choisi.id, corps)
            : creerIntervenant(fiche.id, corps)))}
        />
      )}
      {dialogue === 'decision' && choisi && (
        <DialogueDecision
          decision={{ lotId: choisi.lotId, fournisseurId: choisi.fournisseurId }}
          statuts={statuts}
          lots={lots}
          fournisseurs={fournisseurs}
          onAnnuler={fermer}
          onValider={(corps) => ecrire(() => creerDecision(fiche.id, corps), 'Décision ajoutée.')}
        />
      )}
      {dialogue === 'contacts' && choisi && (
        <Dialog open onOpenChange={(ouvert) => !ouvert && fermer()}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Contacts de {choisi.fournisseur ?? "l'intervenant"}</DialogTitle>
            </DialogHeader>
            <TableContacts
              contacts={choisi.contacts}
              onAjouter={(ids) => void ecrire(() => ajouterContacts(fiche.id, choisi.id, ids)).then((ok) => ok || ecrire(() => getReunion(fiche.id)))}
              onMaj={(ligneId, corps) => void ecrire(() => modifierContactIntervenant(fiche.id, choisi.id, ligneId, corps))}
              onSupprimer={(ligneId) => void ecrire(() => supprimerContactIntervenant(fiche.id, choisi.id, ligneId))}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
