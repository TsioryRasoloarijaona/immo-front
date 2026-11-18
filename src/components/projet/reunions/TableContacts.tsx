import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import BarreIcones from '../../BarreIcones';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import ChoixContacts from './ChoixContacts';
import { useConfirm } from '../../../lib/confirmContext';
import { MESSAGE_SUPPRESSION } from '../../../lib/saisieReunion';
import type { ContactReunionDto, ContactSaisieDto } from '../../../types/reunions';

/** Contacts d'une réunion (maîtres d'ouvrage) ou d'un intervenant : cases Présent / À notifier éditables en direct. */
export default function TableContacts({ contacts, onAjouter, onMaj, onSupprimer }: Readonly<{
  contacts: ContactReunionDto[];
  onAjouter: (ids: string[]) => void;
  onMaj: (ligneId: string, corps: ContactSaisieDto) => void;
  onSupprimer: (ligneId: string) => void;
}>) {
  const confirmer = useConfirm();
  const [choix, setChoix] = useState(false);

  async function supprimer(ligneId: string) {
    if (await confirmer({ title: 'Supprimer', message: MESSAGE_SUPPRESSION, confirmLabel: 'Supprimer' })) onSupprimer(ligneId);
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <BarreIcones className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={() => setChoix(true)}>
          <Plus data-icon="inline-start" /> Ajouter des contacts
        </Button>
      </BarreIcones>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>O.D.T.</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Présent</TableHead>
            <TableHead>À notifier</TableHead>
            <TableHead><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => {
            const corps = { contactId: c.contactId, present: c.present, aNotifier: c.aNotifier };
            return (
              <TableRow key={c.id}>
                <TableCell>{c.ordre ?? ''}</TableCell>
                <TableCell>{c.contact ?? '—'}</TableCell>
                <TableCell>
                  <input type="checkbox" aria-label={`Présent : ${c.contact ?? ''}`} checked={c.present}
                    onChange={(e) => onMaj(c.id, { ...corps, present: e.target.checked })} />
                </TableCell>
                <TableCell>
                  <input type="checkbox" aria-label={`À notifier : ${c.contact ?? ''}`} checked={c.aNotifier}
                    onChange={(e) => onMaj(c.id, { ...corps, aNotifier: e.target.checked })} />
                </TableCell>
                <TableCell>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Supprimer ${c.contact ?? 'le contact'}`} title="Supprimer"
                    onClick={() => void supprimer(c.id)}>
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {contacts.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-muted-foreground">Aucun contact</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      {choix && (
        <ChoixContacts
          exclus={contacts.flatMap((c) => (c.contactId ? [c.contactId] : []))}
          onAnnuler={() => setChoix(false)}
          onValider={(ids) => { setChoix(false); onAjouter(ids); }}
        />
      )}
    </div>
  );
}
