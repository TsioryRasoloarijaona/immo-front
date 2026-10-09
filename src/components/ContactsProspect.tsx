import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState } from './ui';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import TelephoneField, { INDICATIF_MAROC } from './TelephoneField';
import { listProspects } from '../lib/api';
import { useApi, useDebouncedValue } from '../lib/useApi';
import { formatTelephone } from '../lib/format';
import { personDisplayName } from '../lib/domain';
import { referentielItems, useTypesRelationContact } from '../lib/referentiels';
import type { ContactProspectDto, CreerContactProspectRequest, CreerProspectRequest, ProspectListItemDto } from '../types';

// Type de relation obligatoire (400 sans lui) : pas d'option « non renseigné ».
export default function ContactsProspect({
  contacts,
  onAdd,
  onRemove,
}: {
  contacts: { data: ContactProspectDto[] | null; loading: boolean; error: string | null };
  onAdd: (body: CreerContactProspectRequest) => Promise<void>;
  /** `linkId` est l'id du lien CfgTierContact (`ContactProspectDto.id`), pas celui de la personne. */
  onRemove?: (linkId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'existant' | 'nouveau'>('existant');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [selected, setSelected] = useState<ProspectListItemDto | null>(null);
  const [newForm, setNewForm] = useState<CreerProspectRequest>({
    indicatifTelephone: INDICATIF_MAROC,
    indicatifMobile: INDICATIF_MAROC,
  });
  const [relationTypeId, setRelationTypeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const relationTypes = useTypesRelationContact();
  const relationItems = referentielItems(relationTypes.data);

  const results = useApi(
    () =>
      open && mode === 'existant' && !selected && debouncedSearch.trim()
        ? listProspects({ search: debouncedSearch.trim() }, { page: 0, size: 20 })
        : Promise.resolve(null),
    [open, mode, selected, debouncedSearch],
  );

  function setNew<K extends keyof CreerProspectRequest>(key: K, value: CreerProspectRequest[K]) {
    setNewForm((f) => ({ ...f, [key]: value }));
  }

  function fermer() {
    setOpen(false);
    setSearch('');
    setSelected(null);
    setNewForm({ indicatifTelephone: INDICATIF_MAROC, indicatifMobile: INDICATIF_MAROC });
    setRelationTypeId(null);
    setErreur(null);
  }

  // « Au moins nom ou raisonSociale » — la règle du backend, appliquée avant lui.
  const nouveauOk = !!newForm.nom?.trim() || !!newForm.raisonSociale?.trim();
  const canAdd = !!relationTypeId && (mode === 'existant' ? !!selected : nouveauOk);

  async function ajouter() {
    if (!canAdd || !relationTypeId) return;
    setBusy(true);
    setErreur(null);
    try {
      await onAdd(
        mode === 'existant'
          ? { contactProspectId: selected!.id, relationTypeId }
          : { nouveauContact: newForm, relationTypeId },
      );
      fermer();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Échec de l'ajout du contact.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {!open && (
        <div>
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Plus data-icon="inline-start" /> Ajouter un contact
          </Button>
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant={mode === 'existant' ? 'default' : 'outline'} onClick={() => setMode('existant')}>
              Tiers existant
            </Button>
            <Button type="button" size="sm" variant={mode === 'nouveau' ? 'default' : 'outline'} onClick={() => setMode('nouveau')}>
              Nouvelle personne
            </Button>
            <div className="ml-auto flex flex-col gap-1">
              <label className="text-micro text-muted-foreground" htmlFor="ct-relation">Relation *</label>
              <Select items={relationItems} value={relationTypeId ?? ''} onValueChange={(v) => setRelationTypeId((v as string) || null)}>
                <SelectTrigger id="ct-relation" size="sm" className="w-45">
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {relationItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === 'existant' && (
            selected ? (
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-muted/40 px-3 py-2 text-label">
                <span className="font-medium text-foreground">{personDisplayName(selected)}</span>
                <span className="text-muted-foreground">{selected.mobile || selected.telephone || '—'}</span>
                <span className="text-muted-foreground">{selected.email || '—'}</span>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Changer de personne" onClick={() => setSelected(null)}>
                  <X className="text-destructive" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-micro text-muted-foreground" htmlFor="ct-search">Rechercher un tiers</label>
                  <Input id="ct-search" placeholder="Nom, téléphone, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {results.loading && search.trim() && <LoadingState />}
                {!results.loading && search.trim() && (results.data?.content.length ?? 0) === 0 && (
                  <EmptyState title="Aucun résultat" message="Essayez un autre terme, ou basculez sur « Nouvelle personne »." />
                )}
                {results.data && results.data.content.length > 0 && (
                  <div className="max-h-60 overflow-y-auto rounded-md border border-border">
                    <Table>
                      <TableHeader className="sticky top-0 z-1 bg-card">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-9"><Search className="size-3.5 text-muted-foreground" /></TableHead>
                          <TableHead>Nom</TableHead>
                          <TableHead>Téléphone</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.data.content.map((p) => (
                          <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                            <TableCell />
                            <TableCell className="font-medium text-foreground">{personDisplayName(p)}</TableCell>
                            <TableCell className="text-muted-foreground">{p.mobile || p.telephone || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{p.email || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )
          )}

          {mode === 'nouveau' && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-micro text-muted-foreground" htmlFor="ct-prenom">Prénom</label>
                <Input id="ct-prenom" value={newForm.prenom ?? ''} onChange={(e) => setNew('prenom', e.target.value || undefined)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-micro text-muted-foreground" htmlFor="ct-nom">Nom {!newForm.raisonSociale?.trim() && '*'}</label>
                <Input id="ct-nom" value={newForm.nom ?? ''} onChange={(e) => setNew('nom', e.target.value || undefined)} />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-micro text-muted-foreground" htmlFor="ct-raisonSociale">Raison sociale (si personne morale)</label>
                <Input id="ct-raisonSociale" value={newForm.raisonSociale ?? ''} onChange={(e) => setNew('raisonSociale', e.target.value || undefined)} />
              </div>
              <TelephoneField
                id="ct-mobile"
                label="Mobile"
                numero={newForm.mobile ?? ''}
                indicatif={newForm.indicatifMobile ?? null}
                onNumeroChange={(v) => setNew('mobile', v || undefined)}
                onIndicatifChange={(v) => setNew('indicatifMobile', v ?? undefined)}
              />
              <TelephoneField
                id="ct-telephone"
                label="Téléphone"
                numero={newForm.telephone ?? ''}
                indicatif={newForm.indicatifTelephone ?? null}
                onNumeroChange={(v) => setNew('telephone', v || undefined)}
                onIndicatifChange={(v) => setNew('indicatifTelephone', v ?? undefined)}
              />
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-micro text-muted-foreground" htmlFor="ct-email">Email</label>
                <Input id="ct-email" type="email" value={newForm.email ?? ''} onChange={(e) => setNew('email', e.target.value || undefined)} />
              </div>
            </div>
          )}

          {erreur && <p className="text-body text-destructive">{erreur}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={fermer} disabled={busy}>Annuler</Button>
            <Button type="button" size="sm" disabled={busy || !canAdd} onClick={() => void ajouter()}>
              {busy ? 'Ajout…' : 'Ajouter'}
            </Button>
          </div>
        </div>
      )}

      {contacts.loading && !contacts.data && <LoadingState />}
      {contacts.error && <ErrorState message={contacts.error} />}
      {contacts.data && contacts.data.length === 0 && <EmptyState title="Aucun contact lié" />}
      {contacts.data && contacts.data.length > 0 && (
        <div className="flex flex-col gap-2">
          {contacts.data.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-label">
              <span className="font-medium text-foreground">{c.nomContact || '—'}</span>
              {c.relationType && <Badge tone="info">{c.relationType}</Badge>}
              <span className="text-muted-foreground">{formatTelephone(c.mobileContact) || formatTelephone(c.telephoneContact) || '—'}</span>
              <span className="min-w-0 truncate text-muted-foreground">{c.emailContact || '—'}</span>
              {onRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Retirer"
                  className="ml-auto"
                  onClick={() => void onRemove(c.id)}
                >
                  <X className="text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
