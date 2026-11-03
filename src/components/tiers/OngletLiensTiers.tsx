import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { getTypesRelationContact, oublierLecturesRecentes } from '../../lib/api';
import { ajouterLienTiers, listLiensTiers, listTiers, supprimerLienTiers } from '../../lib/apiAdministration';
import { useConfirm } from '../../lib/confirmContext';
import { errorMessage, useApi } from '../../lib/useApi';
import { useToast } from '../../lib/toastContext';
import type { UUID } from '../../types';

const TAILLE_CHOIX = 200;

function ChoixListe({ libelle, items, valeur, onChange }: Readonly<{
  libelle: string;
  items: { label: string; value: string }[];
  valeur: string | null;
  onChange: (v: string | null) => void;
}>) {
  return (
    <Select items={items} value={valeur} onValueChange={onChange}>
      <SelectTrigger aria-label={libelle} className="w-64"><SelectValue placeholder={libelle} /></SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Onglet Contacts : les contacts liés au tiers et leur type de relation. */
export default function OngletLiensTiers({ tiersId }: Readonly<{ tiersId: UUID }>) {
  const confirmer = useConfirm();
  const toast = useToast();
  const [version, setVersion] = useState(0);
  const [contactId, setContactId] = useState<string | null>(null);
  const [relationId, setRelationId] = useState<string | null>(null);
  const liens = useApi(() => listLiensTiers(tiersId), [tiersId, version]);
  const contacts = useApi(() => listTiers('contacts', { size: TAILLE_CHOIX }), []);
  const relations = useApi(() => getTypesRelationContact(), []);

  const choixContacts = (contacts.data?.content ?? []).map((c) => ({ value: c.id, label: c.description || c.code || c.id }));
  const choixRelations = (relations.data ?? []).map((r) => ({ value: r.id, label: r.description || r.code || r.id }));

  async function agir(action: () => Promise<unknown>) {
    try {
      await action();
    } catch (err) {
      toast({ texte: errorMessage(err), variante: 'erreur' });
    }
    oublierLecturesRecentes();
    setVersion((n) => n + 1);
  }

  function ajouter() {
    if (!contactId) return;
    void agir(async () => {
      await ajouterLienTiers(tiersId, { contactId, relationTypeId: relationId });
      setContactId(null);
      setRelationId(null);
    });
  }

  async function retirer(lienId: UUID, contact: string | null) {
    const message = `Retirer le lien avec ${contact ?? 'ce contact'} ?`;
    if (await confirmer({ message, confirmLabel: 'Retirer', cancelLabel: 'Annuler' })) {
      await agir(() => supprimerLienTiers(tiersId, lienId));
    }
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <ChoixListe libelle="Contact" items={choixContacts} valeur={contactId} onChange={setContactId} />
        <ChoixListe libelle="Relation" items={choixRelations} valeur={relationId} onChange={setRelationId} />
        <Button type="button" size="sm" disabled={!contactId} onClick={ajouter}>
          <Plus data-icon="inline-start" /> Ajouter
        </Button>
      </div>
      {liens.loading && !liens.data && <LoadingState />}
      {liens.error && <ErrorState message={liens.error} />}
      {!liens.error && liens.data?.length === 0 && <EmptyState title="Aucun contact lié" />}
      {!liens.error && liens.data && liens.data.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {liens.data.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-3 py-1.5 text-body">
              <span className="font-medium text-foreground">{l.contact ?? '—'}</span>
              <span className="text-muted-foreground">{l.relation ?? '—'}</span>
              <Button type="button" variant="ghost" size="icon-sm" className="ml-auto" aria-label={`Retirer ${l.contact ?? 'le lien'}`}
                onClick={() => void retirer(l.id, l.contact)}>
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
