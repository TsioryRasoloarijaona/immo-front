import { Suspense, lazy, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Contact, Plus, UserCheck } from 'lucide-react';
import CadreFiche, { EnteteFiche, type VarianteFiche } from '../../components/CadreFiche';
import { LigneActivite, OngletsLigne } from '../../components/FicheShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import HistoriqueTiersTable from '../../components/HistoriqueTiersTable';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent } from '../../components/ui/tabs';
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
import { usePreview } from '../../lib/previewContext';
import { useToast } from '../../lib/toastContext';
import { routeFicheProspection } from '../../lib/parcours';
import { personDisplayName, etapeBadgeTone, prospectionDisplayName } from '../../lib/domain';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import { formatCurrency, formatDate, formatFourchetteSurface, formatPercent, formatTelephone } from '../../lib/format';
import TelephoneField from '../../components/TelephoneField';
import ContactsProspect from '../../components/ContactsProspect';
import type { DossierListItemDto, ModifierProspectRequest, ProspectionDetailDto, ProspectionListItemDto } from '../../types';

const NouvelleProspectionDialog = lazy(() => import('../prospections/NewProspection'));

type ProspectTab = 'general' | 'contacts' | 'prospections' | 'dossiers' | 'reglements' | 'historique';

// Sert `/prospects/:id` et `/clients/:id` : `GET /api/clients/{id}` renvoie le même `ProspectDetailDto`.
export default function ProspectDetail() {
  const { id } = useParams();
  const location = useLocation();
  return <FicheProspect key={id} id={id!}client={location.pathname.startsWith('/clients')} />;
}

export function FicheProspect({
  id,
  client: isClientContext,
  variante = 'page',
}: Readonly<{
  id: string;
  client: boolean;
  variante?: VarianteFiche;
}>) {
  const listPath = isClientContext ? '/clients' : '/prospects';
  const listLabel = isClientContext ? 'Clients' : 'Prospects';
  const { data: person, loading, error, refetch } = useApi(
    () => (isClientContext ? getClient(id) : getProspect(id)),
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
  const prospections = useApi(() => listProspectProspections(id, { page: prospectionsPage, size: 20 }), [id, prospectionsPage]);
  const [dossiersPage, setDossiersPage] = useState(0);
  const dossiers = useApi(() => listProspectDossiers(id, { page: dossiersPage, size: 20 }), [id, dossiersPage]);
  const [reglementsPage, setReglementsPage] = useState(0);
  const reglements = useApi(() => listProspectReglements(id, { page: reglementsPage, size: 20 }), [id, reglementsPage]);
  const [historiquePage, setHistoriquePage] = useState(0);
  const historique = useApi(() => listProspectHistorique(id, { page: historiquePage, size: 20 }), [id, historiquePage]);
  const [expandedProspectionId, setExpandedProspectionId] = useState<string | null>(null);
  const [expandedDossierId, setExpandedDossierId] = useState<string | null>(null);
  const [nouvelleProspection, setNouvelleProspection] = useState(false);
  const showToast = useToast();
  const { ouvrirFicheProspection } = usePreview();

  function prospectionCreee(p: ProspectionDetailDto) {
    setNouvelleProspection(false);
    setTab('prospections');
    if (prospectionsPage !== 0) setProspectionsPage(0);
    else void prospections.refetch();
    showToast({
      texte: p.code ? `Prospection ${p.code} créée.` : 'Prospection créée.',
      action: { libelle: 'Ouvrir', surClic: () => ouvrirFicheProspection(p.id, false) },
    });
  }

  if (loading) return <CadreFiche variante={variante} title={isClientContext ? 'Client' : 'Prospect'}><LoadingState /></CadreFiche>;
  if (error) return <CadreFiche variante={variante} title={isClientContext ? 'Client' : 'Prospect'}><ErrorState message={error} /></CadreFiche>;
  if (!person) {
    return (
      <CadreFiche variante={variante} title={`${isClientContext ? 'Client' : 'Prospect'} introuvable`} crumbs={[{ label: listLabel, to: listPath }]}>
        <p>Ce {isClientContext ? 'client' : 'prospect'} n'existe pas.</p>
      </CadreFiche>
    );
  }

  function startEdit() {
    const fiche = person;
    if (!fiche) return;
    setForm({
      prenom: fiche.prenom,
      nom: fiche.nom,
      telephone: fiche.telephone,
      // Reconduits explicitement : le corps est envoyé en entier, un indicatif omis
      // risquerait d'effacer celui enregistré.
      indicatifTelephone: fiche.indicatifTelephone,
      mobile: fiche.mobile,
      indicatifMobile: fiche.indicatifMobile,
      email: fiche.email,
      adresse: fiche.adresse,
      ville: fiche.ville,
      codePostal: fiche.codePostal,
    });
    setEditing(true);
  }

  async function save() {
    const fiche = person;
    if (!form || !fiche) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateProspect(fiche.id, form);
      await refetch();
      setEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CadreFiche
      variante={variante}
      title={personDisplayName(person)}
      crumbs={[{ label: listLabel, to: listPath }]}
      typeFiche={isClientContext ? 'Client' : 'Prospect'}
      icon={isClientContext ? <UserCheck /> : <Contact />}
      accent={isClientContext ? 'var(--sec-client)' : 'var(--sec-prospect)'}
      accentBg={isClientContext ? 'var(--sec-client-bg)' : 'var(--sec-prospect-bg)'}
      fullHeight
      entete={
        <EnteteFiche code={person.code} nom={personDisplayName(person)}>
          <span className="text-body text-muted-foreground">
            {person.type || 'Prospect'}
            {person.commercialNom && <> · commercial {person.commercialNom}</>}
          </span>
          {person.estAncienClient && <Badge tone="info">Ancien client</Badge>}
        </EnteteFiche>
      }
    >

      {nouvelleProspection && (
        <Suspense fallback={null}>
          <NouvelleProspectionDialog
            onClose={() => setNouvelleProspection(false)}
            prospectInitial={{
              id: person.id,
              code: person.code,
              prenom: person.prenom,
              nom: person.nom,
              raisonSociale: person.raisonSociale,
              telephone: person.telephone,
              mobile: person.mobile,
              email: person.email,
              ville: person.ville,
              type: person.type,
            }}
            onCree={prospectionCreee}
          />
        </Suspense>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as ProspectTab)} className="flex min-h-0 flex-1 flex-col gap-2.5">
        <OngletsLigne
          onglets={[
            { id: 'general', libelle: 'Général' },
            { id: 'contacts', libelle: 'Contacts', compteur: contacts.data?.length },
            { id: 'prospections', libelle: 'Prospections', compteur: prospections.data?.totalElements },
            { id: 'dossiers', libelle: 'Dossiers', compteur: dossiers.data?.totalElements },
            { id: 'reglements', libelle: 'Règlements', compteur: reglements.data?.totalElements },
            { id: 'historique', libelle: 'Historique', compteur: historique.data?.totalElements },
          ]}
        />

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
          <Card title="Contacts liés">
            <ContactsProspect
              contacts={contacts}
              onAdd={async (body) => {
                await addProspectContact(person.id, body);
                await contacts.refetch();
              }}
              onRemove={async (linkId) => {
                await removeProspectContact(person.id, linkId);
                contacts.refetch();
              }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="prospections" className="min-h-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-2.5 p-3">
            <LigneActivite
              action={
                <Button size="sm" onClick={() => setNouvelleProspection(true)}>
                  <Plus data-icon="inline-start" /> Nouvelle prospection
                </Button>
              }
            />
            {prospections.loading && <LoadingState />}
            {prospections.error && <ErrorState message={prospections.error} />}
            {prospections.data && prospections.data.content.length === 0 && <EmptyState title="Aucune prospection" />}
            {prospections.data && prospections.data.content.length > 0 && (
              <div>
                <Table containerClassName="overflow-visible">
                  <TableHeader className="sticky top-0 z-1">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-8" />
                      <TableHead>Code</TableHead>
                      <TableHead>Étape</TableHead>
                      <TableHead>Origine</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="w-20"><span className="sr-only">Ouvrir</span></TableHead>
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
          </div>
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
                      <TableHead className="w-20"><span className="sr-only">Ouvrir</span></TableHead>
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
              <HistoriqueTiersTable lignes={historique.data.content} />
            )}
            {historique.data && (
              <Pagination page={historique.data.page} totalPages={historique.data.totalPages} totalElements={historique.data.totalElements} onPageChange={setHistoriquePage} />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </CadreFiche>
  );
}

function ProspectionRow({
  prospection: p,
  expanded,
  onToggle,
}: Readonly<{
  prospection: ProspectionListItemDto;
  expanded: boolean;
  onToggle: () => void;
}>) {
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
        <TableCell><Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Archivée' : p.etape || '—'}</Badge></TableCell>
        <TableCell className="text-muted-foreground">{p.origine || '—'}</TableCell>
        <TableCell className="text-right tabular-nums">{p.prix ? formatCurrency(p.prix) : '—'}</TableCell>
        <TableCell className="text-muted-foreground">{formatDate(p.dateDocument)}</TableCell>
        <TableCell className="text-right">
          <LienOuvrir vers={routeFicheProspection(p.id, p.typeProspectionCode)} cible={`la prospection ${p.code || ''}`} />
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="bg-muted/30 py-3">
            {detail.loading && <LoadingState />}
            {detail.error && <ErrorState message={detail.error} />}
            {detail.data && (
              <div className="flex flex-col gap-2.5">
                <FieldGrid>
                  <Field label="Support" value={detail.data.origineSupport} />
                  <Field label="Vocation" value={detail.data.vocation} />
                  <Field label="Type de contact" value={detail.data.typeContact} />
                  <Field label="Action commerciale" value={detail.data.actionCommerciale} />
                  <Field label="Surface" value={formatFourchetteSurface(detail.data.surface, detail.data.surfaceJusqua)} />
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

function DossierRow({
  dossier: d,
  expanded,
  onToggle,
}: Readonly<{
  dossier: DossierListItemDto;
  expanded: boolean;
  onToggle: () => void;
}>) {
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
        <TableCell><Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge></TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(d.prix)}</TableCell>
        <TableCell className="text-right tabular-nums">{formatCurrency(d.totalAPayer)}</TableCell>
        <TableCell className="text-muted-foreground">{formatDate(d.dateDocument)}</TableCell>
        <TableCell className="text-right">
          <LienOuvrir vers={`/dossiers/${d.id}`} cible={`le dossier ${d.code || ''}`} />
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="bg-muted/30 py-3">
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
                  <Field label="Remise" value={detail.data.remise != null ? formatPercent(detail.data.remise, 0) : undefined} />
                  <Field label="Remise montant" value={detail.data.remiseMontant != null ? formatCurrency(detail.data.remiseMontant) : undefined} />
                  <Field label="Prix après remise" value={detail.data.prixApresRemise != null ? formatCurrency(detail.data.prixApresRemise) : undefined} />
                  <Field label="Avance" value={detail.data.montantAvance != null ? formatCurrency(detail.data.montantAvance) : undefined} />
                  <Field label="Mode de paiement" value={detail.data.modePaie} />
                  <Field label="Probabilité de finalisation" value={detail.data.probabiliteFinalisation != null ? formatPercent(detail.data.probabiliteFinalisation, 0) : undefined} />
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

// Dans une ligne dépliable : ne doit pas déclencher le dépliage (clic ni Entrée/Espace).
function LienOuvrir({ vers, cible }: Readonly<{ vers: string; cible: string }>) {
  return (
    <Link
      to={vers}
      aria-label={`Ouvrir ${cible.trim()}`}
      className="rounded font-medium whitespace-nowrap text-(--brand) underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      Ouvrir →
    </Link>
  );
}
