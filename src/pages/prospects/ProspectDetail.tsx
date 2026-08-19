import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  addProspectContact,
  getProspect,
  listProspectContacts,
  listProspectDossiers,
  listProspectHistorique,
  listProspectProspections,
  listProspectReglements,
  removeProspectContact,
  updateProspect,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { personDisplayName, etapeBadgeTone, prospectionDisplayName } from '../../lib/domain';
import { toneForStatus } from '../../lib/dossierStatus';
import { formatCurrency, formatDate } from '../../lib/format';
import { referentielItems, useTypesRelationContact } from '../../lib/referentiels';
import type { ModifierProspectRequest } from '../../types';

type ProspectTab = 'general' | 'contacts' | 'prospections' | 'dossiers' | 'reglements' | 'historique';

function AddContactRow({ onAdd }: { onAdd: (prospectId: string, relationTypeId: string | null) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState('');
  const [relationTypeId, setRelationTypeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const relationTypes = useTypesRelationContact();
  const relationItems = [{ label: '— Non renseigné —', value: '' }, ...referentielItems(relationTypes.data)];

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Lier un contact
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-muted/30 p-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground" htmlFor="contact-id">ID prospect à lier</label>
        <Input id="contact-id" className="w-[220px]" placeholder="UUID du prospect" value={contactId} onChange={(e) => setContactId(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground" htmlFor="relation-type">Relation</label>
        <Select items={relationItems} value={relationTypeId ?? ''} onValueChange={(v) => setRelationTypeId((v as string) || null)}>
          <SelectTrigger id="relation-type" size="sm" className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {relationItems.map((item) => (
                <SelectItem key={item.value || '__none'} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={busy || !contactId.trim()}
        onClick={async () => {
          setBusy(true);
          try {
            await onAdd(contactId.trim(), relationTypeId);
            setOpen(false);
            setContactId('');
            setRelationTypeId(null);
          } finally {
            setBusy(false);
          }
        }}
      >
        Ajouter
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
    </div>
  );
}

export default function ProspectDetail() {
  const { id } = useParams();
  const { data: person, loading, error, refetch } = useApi(() => getProspect(id!), [id]);
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProspectTab>('general');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ModifierProspectRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const contacts = useApi(() => (id ? listProspectContacts(id) : Promise.resolve([])), [id]);
  const [prospectionsPage, setProspectionsPage] = useState(0);
  const prospections = useApi(() => listProspectProspections(id!, { page: prospectionsPage, size: 20 }), [id, prospectionsPage]);
  const [dossiersPage, setDossiersPage] = useState(0);
  const dossiers = useApi(() => listProspectDossiers(id!, { page: dossiersPage, size: 20 }), [id, dossiersPage]);
  const [reglementsPage, setReglementsPage] = useState(0);
  const reglements = useApi(() => listProspectReglements(id!, { page: reglementsPage, size: 20 }), [id, reglementsPage]);
  const [historiquePage, setHistoriquePage] = useState(0);
  const historique = useApi(() => listProspectHistorique(id!, { page: historiquePage, size: 20 }), [id, historiquePage]);

  if (loading) return <PageShell title="Prospect"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Prospect"><ErrorState message={error} /></PageShell>;
  if (!person) {
    return (
      <PageShell title="Prospect introuvable" crumbs={[{ label: 'Prospects', to: '/prospects' }]}>
        <p>Ce prospect n'existe pas.</p>
      </PageShell>
    );
  }

  function startEdit() {
    setForm({
      prenom: person!.prenom,
      nom: person!.nom,
      telephone: person!.telephone,
      mobile: person!.mobile,
      email: person!.email,
      adresse: person!.adresse,
      ville: person!.ville,
      codePostal: person!.codePostal,
    });
    setEditing(true);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateProspect(person!.id, form);
      await refetch();
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title={personDisplayName(person)} crumbs={[{ label: 'Prospects', to: '/prospects' }, { label: person.code || personDisplayName(person) }]}>
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate('/prospects')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      <div className="mb-3.5">
        <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{personDisplayName(person)}</h1>
        <div className="mt-1 text-[13px] text-muted-foreground">
          {person.code && <>Code {person.code} · </>}
          {person.type || 'Prospect'}
          {person.commercialNom && <> · Commercial : {person.commercialNom}</>}
          {person.estAncienClient && <> · </>}
          {person.estAncienClient && <Badge tone="info" className="ml-1">Ancien client</Badge>}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ProspectTab)} className="gap-3">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="contacts">
            Contacts {contacts.data && contacts.data.length > 0 && <Badge tone="neutral" className="ml-1.5">{contacts.data.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="prospections">
            Prospections {prospections.data && prospections.data.totalElements > 0 && <Badge tone="neutral" className="ml-1.5">{prospections.data.totalElements}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="dossiers">
            Dossiers {dossiers.data && dossiers.data.totalElements > 0 && <Badge tone="neutral" className="ml-1.5">{dossiers.data.totalElements}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reglements">Règlements</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="flex flex-col gap-3">
            <Card
              title="Coordonnées"
              action={
                editing ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
                    <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={startEdit}>Modifier</Button>
                )
              }
            >
              {editing && form ? (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <FormField>
                    <FieldLabel htmlFor="e-prenom">Prénom</FieldLabel>
                    <Input id="e-prenom" value={form.prenom ?? ''} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="e-nom">Nom</FieldLabel>
                    <Input id="e-nom" value={form.nom ?? ''} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="e-telephone">Téléphone</FieldLabel>
                    <Input id="e-telephone" value={form.telephone ?? ''} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="e-mobile">Mobile</FieldLabel>
                    <Input id="e-mobile" value={form.mobile ?? ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="e-email">Email</FieldLabel>
                    <Input id="e-email" type="email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="e-ville">Ville</FieldLabel>
                    <Input id="e-ville" value={form.ville ?? ''} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
                  </FormField>
                  <FormField className="sm:col-span-2">
                    <FieldLabel htmlFor="e-adresse">Adresse</FieldLabel>
                    <Input id="e-adresse" value={form.adresse ?? ''} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
                  </FormField>
                  <FormField>
                    <FieldLabel htmlFor="e-codePostal">Code postal</FieldLabel>
                    <Input id="e-codePostal" value={form.codePostal ?? ''} onChange={(e) => setForm({ ...form, codePostal: e.target.value })} />
                  </FormField>
                  {saveError && <p className="text-[12.5px] text-destructive sm:col-span-2">{saveError}</p>}
                </div>
              ) : (
                <FieldGrid>
                  <Field label="Titre" value={person.titre} />
                  <Field label="Sexe" value={person.sexe} />
                  <Field label="Téléphone" value={person.telephone} />
                  <Field label="Téléphone 2" value={person.telephone2} />
                  <Field label="Mobile" value={person.mobile} />
                  <Field label="Email" value={person.email} />
                  <Field label="Ville" value={person.ville} />
                  <Field label="Adresse" value={person.adresse} />
                  <Field label="Code postal" value={person.codePostal} />
                  <Field label="Pays" value={person.pays} />
                  <Field label="Pays de résidence" value={person.paysResidence} />
                  <Field label="Nationalité" value={person.nationalite} />
                  <Field label="Date de naissance" value={person.dateNaissance ? formatDate(person.dateNaissance) : undefined} />
                  <Field label="Lieu de naissance" value={person.lieuNaissance} />
                  <Field label="Situation familiale" value={person.situationFamiliale} />
                  <Field label="Enfants" value={person.nombreEnfants ? String(person.nombreEnfants) : undefined} />
                  <Field label="Type de résidence" value={person.typeResidence} />
                  <Field label="Régime matrimonial" value={person.regimeMatrimonial} />
                  <Field label="Profession" value={person.profession} />
                  <Field label="Salaire" value={person.salaire} />
                  <Field label="Employeur" value={person.employeur} />
                  <Field label="Ancienneté" value={person.anciennete ? `${person.anciennete} ans` : undefined} />
                  <Field label="Fils de" value={person.filsDe} />
                  <Field label="Et de" value={person.etDe} />
                  <Field label="Ancien client" value={person.estAncienClient ? 'Oui' : 'Non'} />
                </FieldGrid>
              )}
            </Card>

            {person.pieceIdentite && (person.pieceIdentite.numero || person.pieceIdentite.type) && (
              <Card title="Pièce d'identité">
                <FieldGrid>
                  <Field label="Type" value={person.pieceIdentite.type} />
                  <Field label="Numéro" value={person.pieceIdentite.numero} />
                  <Field label="Délivrée le" value={person.pieceIdentite.delivreeLe ? formatDate(person.pieceIdentite.delivreeLe) : undefined} />
                  <Field label="Lieu de délivrance" value={person.pieceIdentite.lieuDelivrance} />
                  <Field label="Valide jusqu'au" value={person.pieceIdentite.valideJusquau ? formatDate(person.pieceIdentite.valideJusquau) : undefined} />
                  <Field label="Lieu de validité" value={person.pieceIdentite.lieuValidite} />
                </FieldGrid>
              </Card>
            )}

            {person.notes && (
              <Card title="Notes">
                <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground">
                  {person.notes}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <Card title="Contacts liés" action={<AddContactRow onAdd={async (contactId, relationTypeId) => { await addProspectContact(person.id, { contactProspectId: contactId, relationTypeId: relationTypeId ?? undefined }); await contacts.refetch(); }} />}>
            {contacts.loading && <LoadingState />}
            {contacts.error && <ErrorState message={contacts.error} />}
            {contacts.data && contacts.data.length === 0 && <EmptyState title="Aucun contact lié" />}
            {contacts.data && contacts.data.length > 0 && (
              <div className="flex flex-col gap-2">
                {contacts.data.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px]">
                    <span className="font-medium text-foreground">{c.nomContact}</span>
                    <span className="text-muted-foreground">{c.telephoneContact}</span>
                    {c.relationType && <Badge tone="info">{c.relationType}</Badge>}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Retirer"
                      onClick={async () => {
                        await removeProspectContact(person.id, c.id);
                        contacts.refetch();
                      }}
                    >
                      <X className="text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="prospections">
          <Card title={`Prospections (${prospections.data?.totalElements ?? 0})`}>
            {prospections.loading && <LoadingState />}
            {prospections.error && <ErrorState message={prospections.error} />}
            {prospections.data && prospections.data.content.length === 0 && <EmptyState title="Aucune prospection" />}
            {prospections.data && prospections.data.content.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Code</TableHead>
                      <TableHead>Étape</TableHead>
                      <TableHead>Origine</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospections.data.content.map((p) => (
                      <TableRow
                        key={p.id}
                        tabIndex={0}
                        role="link"
                        className="cursor-pointer"
                        onClick={() => navigate(`/prospections/${p.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/prospections/${p.id}`);
                        }}
                      >
                        <TableCell className="font-medium text-foreground">{p.code || prospectionDisplayName(p)}</TableCell>
                        <TableCell><Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{p.origine || '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{p.prix ? formatCurrency(p.prix) : '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(p.dateDocument)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {prospections.data && (
              <Pagination page={prospections.data.page} totalPages={prospections.data.totalPages} totalElements={prospections.data.totalElements} onPageChange={setProspectionsPage} />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="dossiers">
          <Card title={`Dossiers (${dossiers.data?.totalElements ?? 0})`}>
            {dossiers.loading && <LoadingState />}
            {dossiers.error && <ErrorState message={dossiers.error} />}
            {dossiers.data && dossiers.data.content.length === 0 && <EmptyState title="Aucun dossier" />}
            {dossiers.data && dossiers.data.content.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Code</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-right">Total à payer</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dossiers.data.content.map((d) => (
                      <TableRow
                        key={d.id}
                        tabIndex={0}
                        role="link"
                        className="cursor-pointer"
                        onClick={() => navigate(`/dossiers/${d.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/dossiers/${d.id}`);
                        }}
                      >
                        <TableCell className="font-medium text-foreground">{d.code}</TableCell>
                        <TableCell><Badge tone={toneForStatus(d.statut)}>{d.statut || '—'}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(d.prix)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(d.totalAPayer)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(d.dateDocument)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {dossiers.data && (
              <Pagination page={dossiers.data.page} totalPages={dossiers.data.totalPages} totalElements={dossiers.data.totalElements} onPageChange={setDossiersPage} />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="reglements">
          <Card title={`Règlements (${reglements.data?.totalElements ?? 0})`}>
            {reglements.loading && <LoadingState />}
            {reglements.error && <ErrorState message={reglements.error} />}
            {reglements.data && reglements.data.content.length === 0 && <EmptyState title="Aucun règlement" />}
            {reglements.data && reglements.data.content.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dossier</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Date de règlement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reglements.data.content.map((r) => (
                      <TableRow key={r.id} className={r.dossierId ? 'cursor-pointer' : ''} onClick={() => r.dossierId && navigate(`/dossiers/${r.dossierId}`)}>
                        <TableCell className="font-medium text-foreground">{r.code}</TableCell>
                        <TableCell className="text-muted-foreground">{r.type}</TableCell>
                        <TableCell className="text-muted-foreground">{r.dossierCode || '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(r.montant)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(r.dateReglement)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {reglements.data && (
              <Pagination page={reglements.data.page} totalPages={reglements.data.totalPages} totalElements={reglements.data.totalElements} onPageChange={setReglementsPage} />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="historique">
          <Card title="Historique">
            {historique.loading && <LoadingState />}
            {historique.error && <ErrorState message={historique.error} />}
            {historique.data && historique.data.content.length === 0 && <EmptyState title="Aucun historique" />}
            {historique.data && historique.data.content.length > 0 && (
              <div className="flex flex-col">
                {historique.data.content.map((h, i) => (
                  <div className="relative flex gap-3 pb-4.5 last:pb-0" key={h.id}>
                    <div className="flex shrink-0 flex-col items-center">
                      <div className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                      {i < historique.data!.content.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-border" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-0.5">
                      <div className="text-[13px] font-semibold text-foreground">{h.workflowDescription || h.statutDescription || 'Événement'}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(h.date)} · {h.utilisateur || 'Système'}</div>
                      {h.description && <div className="mt-1 text-[12.5px] text-foreground">{h.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {historique.data && (
              <Pagination page={historique.data.page} totalPages={historique.data.totalPages} totalElements={historique.data.totalElements} onPageChange={setHistoriquePage} />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
