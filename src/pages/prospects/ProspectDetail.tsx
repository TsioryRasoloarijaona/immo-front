import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Contact, Plus, UserCheck, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { TimelineList, TimelineRow } from '../../components/Timeline';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  addProspectContact,
  getClient,
  getDossier,
  getProspect,
  getProspection,
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
import { formatCurrency, formatDate, formatDateTime, formatTelephone } from '../../lib/format';
import { referentielItems, useTypesRelationContact } from '../../lib/referentiels';
import TelephoneField from '../../components/TelephoneField';
import type { DossierListItemDto, ModifierProspectRequest, ProspectionListItemDto } from '../../types';

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
    <div className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/40 p-3">
      <div className="flex flex-col gap-1">
        <label className="text-micro text-muted-foreground" htmlFor="contact-id">ID prospect à lier</label>
        <Input id="contact-id" className="w-55" placeholder="UUID du prospect" value={contactId} onChange={(e) => setContactId(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-micro text-muted-foreground" htmlFor="relation-type">Relation</label>
        <Select items={relationItems} value={relationTypeId ?? ''} onValueChange={(v) => setRelationTypeId((v as string) || null)}>
          <SelectTrigger id="relation-type" size="sm" className="w-45">
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
  // Reused verbatim for both `/prospects/:id` and `/clients/:id` — GET
  // /api/clients/{id} returns the same ProspectDetailDto shape as
  // /api/prospects/{id} (see ClientsList.tsx's comment), so rather than
  // duplicating this whole page for "Clients", detect the entry point from
  // the URL and swap only the fetch call + breadcrumb/back-link labels.
  // This is the fix for the earlier behavior where opening a client always
  // redirected into /prospects/:id, losing the "Clients" context.
  const location = useLocation();
  const isClientContext = location.pathname.startsWith('/clients');
  const listPath = isClientContext ? '/clients' : '/prospects';
  const listLabel = isClientContext ? 'Clients' : 'Prospects';
  const { data: person, loading, error, refetch } = useApi(
    () => (isClientContext ? getClient(id!) : getProspect(id!)),
    [id, isClientContext],
  );
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
  // Prospections/Dossiers rows expand in place instead of navigating away —
  // this page is reached from Clients as much as from Prospects, and
  // leaving it to open /prospections/:id or /dossiers/:id was reported as
  // an unwanted "redirect" out of the client's fiche.
  const [expandedProspectionId, setExpandedProspectionId] = useState<string | null>(null);
  const [expandedDossierId, setExpandedDossierId] = useState<string | null>(null);

  if (loading) return <PageShell title={isClientContext ? 'Client' : 'Prospect'}><LoadingState /></PageShell>;
  if (error) return <PageShell title={isClientContext ? 'Client' : 'Prospect'}><ErrorState message={error} /></PageShell>;
  if (!person) {
    return (
      <PageShell title={`${isClientContext ? 'Client' : 'Prospect'} introuvable`} crumbs={[{ label: listLabel, to: listPath }]}>
        <p>Ce {isClientContext ? 'client' : 'prospect'} n'existe pas.</p>
      </PageShell>
    );
  }

  function startEdit() {
    setForm({
      prenom: person!.prenom,
      nom: person!.nom,
      telephone: person!.telephone,
      // Reconduits explicitement : le formulaire renvoie tout le corps, donc
      // un indicatif omis ici serait absent de la requête et risquerait
      // d’effacer celui déjà enregistré.
      indicatifTelephone: person!.indicatifTelephone,
      mobile: person!.mobile,
      indicatifMobile: person!.indicatifMobile,
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
    <PageShell
      title={personDisplayName(person)}
      crumbs={[{ label: listLabel, to: listPath }, { label: person.code || personDisplayName(person) }]}
      icon={isClientContext ? <UserCheck /> : <Contact />}
      accent={isClientContext ? 'var(--sec-client)' : 'var(--sec-prospect)'}
      accentBg={isClientContext ? 'var(--sec-client-bg)' : 'var(--sec-prospect-bg)'}
      fullHeight
    >
      {/* Redesign 20/09 : cette fiche était la seule fiche à onglets qui
          défilait en pleine page (ni FicheShell ni fullHeight), avec un
          bouton « Retour » et un bloc titre hero qui redisaient le fil
          d'Ariane (~90px). Même géométrie que Dossier/Prospection désormais :
          identité sur une ligne, seuls les onglets défilent. */}
      <div className="flex shrink-0 flex-wrap items-baseline gap-x-2 gap-y-1 pt-1 pb-3">
        <h2 className="text-title font-semibold tracking-tight text-foreground">{personDisplayName(person)}</h2>
        <span className="text-body text-muted-foreground">
          {person.code && <>Code {person.code} · </>}
          {person.type || 'Prospect'}
          {person.commercialNom && <> · Commercial : {person.commercialNom}</>}
        </span>
        {person.estAncienClient && <Badge tone="info">Ancien client</Badge>}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ProspectTab)} className="flex min-h-0 flex-1 flex-col gap-3">
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

        <TabsContent value="general" className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3">
            <Card
              title="Coordonnées"
              accent={isClientContext ? 'var(--sec-client)' : 'var(--sec-prospect)'}
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
                  <TelephoneField
                    id="e-telephone"
                    label="Téléphone"
                    numero={form.telephone ?? ''}
                    indicatif={form.indicatifTelephone ?? null}
                    onNumeroChange={(v) => setForm({ ...form, telephone: v })}
                    onIndicatifChange={(v) => setForm({ ...form, indicatifTelephone: v ?? undefined })}
                  />
                  <TelephoneField
                    id="e-mobile"
                    label="Mobile"
                    numero={form.mobile ?? ''}
                    indicatif={form.indicatifMobile ?? null}
                    onNumeroChange={(v) => setForm({ ...form, mobile: v })}
                    onIndicatifChange={(v) => setForm({ ...form, indicatifMobile: v ?? undefined })}
                  />
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
                  {saveError && <p className="text-body text-destructive sm:col-span-2">{saveError}</p>}
                </div>
              ) : (
                <FieldGrid>
                  <Field label="Titre" value={person.titre} />
                  <Field label="Sexe" value={person.sexe} />
                  <Field label="Téléphone" value={formatTelephone(person.telephone, person.indicatifTelephone)} />
                  <Field label="Téléphone 2" value={person.telephone2} />
                  <Field label="Mobile" value={formatTelephone(person.mobile, person.indicatifMobile)} />
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
                <div className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-label leading-relaxed text-foreground">
                  {person.notes}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contacts" className="min-h-0 flex-1 overflow-y-auto">
          <Card title="Contacts liés" action={<AddContactRow onAdd={async (contactId, relationTypeId) => { await addProspectContact(person.id, { contactProspectId: contactId, relationTypeId: relationTypeId ?? undefined }); await contacts.refetch(); }} />}>
            {contacts.loading && <LoadingState />}
            {contacts.error && <ErrorState message={contacts.error} />}
            {contacts.data && contacts.data.length === 0 && <EmptyState title="Aucun contact lié" />}
            {contacts.data && contacts.data.length > 0 && (
              <div className="flex flex-col gap-2">
                {contacts.data.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-label">
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

        <TabsContent value="prospections" className="min-h-0 flex-1 overflow-y-auto">
          <Card title={`Prospections (${prospections.data?.totalElements ?? 0})`}>
            {prospections.loading && <LoadingState />}
            {prospections.error && <ErrorState message={prospections.error} />}
            {prospections.data && prospections.data.content.length === 0 && <EmptyState title="Aucune prospection" />}
            {prospections.data && prospections.data.content.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-8" />
                      <TableHead>Code</TableHead>
                      <TableHead>Étape</TableHead>
                      <TableHead>Origine</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospections.data.content.map((p) => (
                      <ProspectionRow
                        key={p.id}
                        prospection={p}
                        expanded={expandedProspectionId === p.id}
                        onToggle={() => setExpandedProspectionId(expandedProspectionId === p.id ? null : p.id)}
                      />
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

        <TabsContent value="dossiers" className="min-h-0 flex-1 overflow-y-auto">
          <Card title={`Dossiers (${dossiers.data?.totalElements ?? 0})`}>
            {dossiers.loading && <LoadingState />}
            {dossiers.error && <ErrorState message={dossiers.error} />}
            {dossiers.data && dossiers.data.content.length === 0 && <EmptyState title="Aucun dossier" />}
            {dossiers.data && dossiers.data.content.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-8" />
                      <TableHead>Code</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-right">Total à payer</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dossiers.data.content.map((d) => (
                      <DossierRow
                        key={d.id}
                        dossier={d}
                        expanded={expandedDossierId === d.id}
                        onToggle={() => setExpandedDossierId(expandedDossierId === d.id ? null : d.id)}
                      />
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

        <TabsContent value="reglements" className="min-h-0 flex-1 overflow-y-auto">
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

        <TabsContent value="historique" className="min-h-0 flex-1 overflow-y-auto">
          <Card title="Historique">
            {historique.loading && <LoadingState />}
            {historique.error && <ErrorState message={historique.error} />}
            {historique.data && historique.data.content.length === 0 && <EmptyState title="Aucun historique" />}
            {historique.data && historique.data.content.length > 0 && (
              <TimelineList>
                {historique.data.content.map((h, i) => (
                  <TimelineRow
                    key={h.id}
                    dernier={i === historique.data!.content.length - 1}
                    titre={h.workflowDescription || h.statutDescription || 'Événement'}
                    meta={`${formatDateTime(h.date)} · ${h.utilisateur || 'Système'}`}
                    note={h.description}
                  />
                ))}
              </TimelineList>
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

/** One row of the "Prospections" tab — clicking toggles a detail panel open
 * in place instead of navigating to `/prospections/:id` (this page's own
 * list rows already do that; the Prospect/Client fiche is meant to stay put
 * while browsing what's linked to it). The list row (`ProspectionListItemDto`)
 * only carries a handful of fields, so the full detail (`ProspectionDetailDto`)
 * is fetched lazily via `getProspection`, once, the first time the row opens. */
function ProspectionRow({
  prospection: p,
  expanded,
  onToggle,
}: {
  prospection: ProspectionListItemDto;
  expanded: boolean;
  onToggle: () => void;
}) {
  const detail = useApi(() => (expanded ? getProspection(p.id) : Promise.resolve(null)), [expanded, p.id]);

  return (
    <>
      <TableRow
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Replier' : 'Déplier'} la prospection ${p.code || ''}`}
        className="cursor-pointer"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
        }}
      >
        <TableCell>
          {expanded ? <ChevronDown className="size-4 text-(--brand)" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="font-medium text-foreground">{p.code || prospectionDisplayName(p)}</TableCell>
        <TableCell><Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge></TableCell>
        <TableCell className="text-muted-foreground">{p.origine || '—'}</TableCell>
        <TableCell className="text-right tabular-nums">{p.prix ? formatCurrency(p.prix) : '—'}</TableCell>
        <TableCell className="text-muted-foreground">{formatDate(p.dateDocument)}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="bg-muted/30 py-3">
            {detail.loading && <LoadingState />}
            {detail.error && <ErrorState message={detail.error} />}
            {detail.data && (
              <div className="flex flex-col gap-2.5">
                <FieldGrid>
                  <Field label="Support" value={detail.data.origineSupport} />
                  <Field label="Vocation" value={detail.data.vocation} />
                  <Field label="Type de contact" value={detail.data.typeContact} />
                  <Field label="Action commerciale" value={detail.data.actionCommerciale} />
                  <Field label="Surface" value={detail.data.surface != null ? `${detail.data.surface}${detail.data.surfaceJusqua ? ` à ${detail.data.surfaceJusqua}` : ''} m²` : undefined} />
                  <Field label="Budget" value={detail.data.prix != null ? `${formatCurrency(detail.data.prix)}${detail.data.prixJusqua ? ` à ${formatCurrency(detail.data.prixJusqua)}` : ''}` : undefined} />
                  <Field label="Avance" value={detail.data.avance != null ? formatCurrency(detail.data.avance) : undefined} />
                  <Field label="Financement fonds propres" value={detail.data.financementFondsPropres != null ? formatCurrency(detail.data.financementFondsPropres) : undefined} />
                  <Field label="Financement crédit" value={detail.data.financementCredit != null ? formatCurrency(detail.data.financementCredit) : undefined} />
                  <Field label="Proposeur" value={detail.data.proposeurNom} />
                  {detail.data.fermee && <Field label="Raison de fermeture" value={detail.data.raisonFermeture || detail.data.raisonFermetureTexte} />}
                </FieldGrid>
                {detail.data.notes && (
                  <div className="whitespace-pre-wrap rounded-lg bg-muted/40 p-2.5 text-body text-foreground">
                    {detail.data.notes}
                  </div>
                )}
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/** One row of the "Dossiers" tab — same expand-in-place pattern as
 * `ProspectionRow` above, fetching the full `DossierDetailDto` (articles,
 * pricing breakdown) lazily via `getDossier` on first expand. */
function DossierRow({
  dossier: d,
  expanded,
  onToggle,
}: {
  dossier: DossierListItemDto;
  expanded: boolean;
  onToggle: () => void;
}) {
  const detail = useApi(() => (expanded ? getDossier(d.id) : Promise.resolve(null)), [expanded, d.id]);

  return (
    <>
      <TableRow
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Replier' : 'Déplier'} le dossier ${d.code || ''}`}
        className="cursor-pointer"
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); }
        }}
      >
        <TableCell>
          {expanded ? <ChevronDown className="size-4 text-(--brand)" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </TableCell>
        <TableCell className="font-medium text-foreground">{d.code}</TableCell>
        <TableCell><Badge tone={toneForStatus(d.statut)}>{d.statut || '—'}</Badge></TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(d.prix)}</TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(d.totalAPayer)}</TableCell>
        <TableCell className="text-muted-foreground">{formatDate(d.dateDocument)}</TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="bg-muted/30 py-3">
            {detail.loading && <LoadingState />}
            {detail.error && <ErrorState message={detail.error} />}
            {detail.data && (
              <div className="flex flex-col gap-2.5">
                {detail.data.articles && detail.data.articles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.data.articles.map((a) => (
                      <Badge key={a.id} tone="neutral">{a.code || a.description || '—'}</Badge>
                    ))}
                  </div>
                )}
                <FieldGrid>
                  <Field label="Commercial" value={detail.data.commercialNom} />
                  <Field label="Avocat" value={detail.data.avocatNom} />
                  <Field label="Prix avant remise" value={detail.data.prixAvantRemise != null ? formatCurrency(detail.data.prixAvantRemise) : undefined} />
                  <Field label="Remise" value={detail.data.remise != null ? `${Math.round(detail.data.remise * 100)} %` : undefined} />
                  <Field label="Remise montant" value={detail.data.remiseMontant != null ? formatCurrency(detail.data.remiseMontant) : undefined} />
                  <Field label="Prix après remise" value={detail.data.prixApresRemise != null ? formatCurrency(detail.data.prixApresRemise) : undefined} />
                  <Field label="Avance" value={detail.data.montantAvance != null ? formatCurrency(detail.data.montantAvance) : undefined} />
                  <Field label="Mode de paiement" value={detail.data.modePaie} />
                  <Field label="Probabilité de finalisation" value={detail.data.probabiliteFinalisation != null ? `${Math.round(detail.data.probabiliteFinalisation * 100)} %` : undefined} />
                </FieldGrid>
                {detail.data.notes && (
                  <div className="whitespace-pre-wrap rounded-lg bg-muted/40 p-2.5 text-body text-foreground">
                    {detail.data.notes}
                  </div>
                )}
              </div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
