import { Suspense, lazy, useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus, X } from 'lucide-react';
import CadreFiche, { EnteteFiche } from '../../components/CadreFiche';
import CoqueFiche, { type VarianteCoque } from '../../components/CoqueFiche';
import ChampFiche, { BandeFiche } from '../../components/fiche/ChampFiche';
import ClasseurBas from '../../components/fiche/ClasseurBas';
import ClasseurEntete from '../../components/fiche/ClasseurEntete';
import FenetreFiche from '../../components/fiche/FenetreFiche';
import PiedAudit from '../../components/fiche/PiedAudit';
import RubanFiche from '../../components/fiche/RubanFiche';
import { LigneActivite } from '../../components/FicheShell';
import { Badge, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import Pagination from '../../components/Pagination';
import HistoriqueStatuts from '../../components/HistoriqueStatuts';
import { Button } from '../../components/ui/button';
import { Field as FormField, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
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
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import { usePreview, type FicheCible } from '../../lib/previewContext';
import { useToast } from '../../lib/toastContext';
import { CODE_PRE_PROSPECTION } from '../../lib/parcours';
import LienFiche from '../../components/LienFiche';
import { personDisplayName, etapeBadgeTone, prospectionDisplayName } from '../../lib/domain';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import { formatCurrency, formatDate, formatFourchetteMontant, formatFourchetteSurface, formatPercent, formatPercentValue, formatTelephone } from '../../lib/format';
import TelephoneField from '../../components/TelephoneField';
import ContactsProspect from '../../components/ContactsProspect';
import type { DossierListItemDto, ModifierProspectRequest, ProspectDetailDto, ProspectionDetailDto, ProspectionListItemDto } from '../../types';

const NouvelleProspectionDialog = lazy(() => import('../prospections/NewProspection'));

type ProspectTab = 'contacts' | 'prospections' | 'dossiers' | 'reglements' | 'historique';

function FormulaireCoordonnees({
  form,
  onChange,
  erreur,
}: Readonly<{ form: ModifierProspectRequest; onChange: (f: ModifierProspectRequest) => void; erreur: string | null }>) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      <FormField>
        <FieldLabel htmlFor="e-prenom">Prénom</FieldLabel>
        <Input id="e-prenom" value={form.prenom ?? ''} onChange={(e) => onChange({ ...form, prenom: e.target.value })} />
      </FormField>
      <FormField>
        <FieldLabel htmlFor="e-nom">Nom</FieldLabel>
        <Input id="e-nom" value={form.nom ?? ''} onChange={(e) => onChange({ ...form, nom: e.target.value })} />
      </FormField>
      <TelephoneField
        id="e-telephone"
        label="Téléphone"
        numero={form.telephone ?? ''}
        indicatif={form.indicatifTelephone ?? null}
        onNumeroChange={(v) => onChange({ ...form, telephone: v })}
        onIndicatifChange={(v) => onChange({ ...form, indicatifTelephone: v ?? undefined })}
      />
      <TelephoneField
        id="e-mobile"
        label="Mobile"
        numero={form.mobile ?? ''}
        indicatif={form.indicatifMobile ?? null}
        onNumeroChange={(v) => onChange({ ...form, mobile: v })}
        onIndicatifChange={(v) => onChange({ ...form, indicatifMobile: v ?? undefined })}
      />
      <FormField>
        <FieldLabel htmlFor="e-email">Email</FieldLabel>
        <Input id="e-email" type="email" value={form.email ?? ''} onChange={(e) => onChange({ ...form, email: e.target.value })} />
      </FormField>
      <FormField>
        <FieldLabel htmlFor="e-ville">Ville</FieldLabel>
        <Input id="e-ville" value={form.ville ?? ''} onChange={(e) => onChange({ ...form, ville: e.target.value })} />
      </FormField>
      <FormField className="sm:col-span-2">
        <FieldLabel htmlFor="e-adresse">Adresse</FieldLabel>
        <Input id="e-adresse" value={form.adresse ?? ''} onChange={(e) => onChange({ ...form, adresse: e.target.value })} />
      </FormField>
      <FormField>
        <FieldLabel htmlFor="e-codePostal">Code postal</FieldLabel>
        <Input id="e-codePostal" value={form.codePostal ?? ''} onChange={(e) => onChange({ ...form, codePostal: e.target.value })} />
      </FormField>
      {erreur && <p className="text-body text-destructive sm:col-span-2">{erreur}</p>}
    </div>
  );
}

function BandeProspect({ person }: Readonly<{ person: ProspectDetailDto }>) {
  return (
    <BandeFiche>
      <ChampFiche libelle="Code" valeur={person.code} />
      <ChampFiche libelle="Type" type="liste" valeur={person.type} />
      <ChampFiche libelle="Commercial" valeur={person.commercialNom} />
      <ChampFiche libelle="Titre" valeur={person.titre} />
      <ChampFiche libelle="Sexe" valeur={person.sexe} />
      <ChampFiche libelle="Ancien client" type="case" valeur={!!person.estAncienClient} />
      {person.notes && <ChampFiche libelle="Notes" large valeur={person.notes} />}
    </BandeFiche>
  );
}

function EnteteProspect({ person, client }: Readonly<{ person: ProspectDetailDto; client: boolean }>) {
  const piece = person.pieceIdentite;
  const aPiece = !!piece && !!(piece.numero || piece.type);
  return (
    <ClasseurEntete
      type={client ? 'client' : 'prospect'}
      onglets={[
        {
          id: 'coordonnees',
          titre: 'Coordonnées',
          contenu: (
            <BandeFiche>
              <ChampFiche libelle="Téléphone" valeur={formatTelephone(person.telephone, person.indicatifTelephone)} />
              <ChampFiche libelle="Téléphone 2" valeur={person.telephone2} />
              <ChampFiche libelle="Mobile" valeur={formatTelephone(person.mobile, person.indicatifMobile)} />
              <ChampFiche libelle="Email" valeur={person.email} />
              <ChampFiche libelle="Ville" valeur={person.ville} />
              <ChampFiche libelle="Adresse" valeur={person.adresse} />
              <ChampFiche libelle="Code postal" valeur={person.codePostal} />
              <ChampFiche libelle="Pays" valeur={person.pays} />
              <ChampFiche libelle="Pays de résidence" valeur={person.paysResidence} />
            </BandeFiche>
          ),
        },
        {
          id: 'identite',
          titre: 'Identité (suite)',
          contenu: (
            <BandeFiche>
              <ChampFiche libelle="Nationalité" valeur={person.nationalite} />
              <ChampFiche libelle="Date de naissance" valeur={person.dateNaissance ? formatDate(person.dateNaissance) : undefined} />
              <ChampFiche libelle="Lieu de naissance" valeur={person.lieuNaissance} />
              <ChampFiche libelle="Situation familiale" valeur={person.situationFamiliale} />
              <ChampFiche libelle="Enfants" valeur={person.nombreEnfants ? String(person.nombreEnfants) : undefined} />
              <ChampFiche libelle="Type de résidence" valeur={person.typeResidence} />
              <ChampFiche libelle="Régime matrimonial" valeur={person.regimeMatrimonial} />
              <ChampFiche libelle="Fils de" valeur={person.filsDe} />
              <ChampFiche libelle="Et de" valeur={person.etDe} />
            </BandeFiche>
          ),
        },
        ...(piece && aPiece
          ? [
              {
                id: 'piece',
                titre: "Pièce d'identité",
                contenu: (
                  <BandeFiche>
                    <ChampFiche libelle="Type" valeur={piece.type} />
                    <ChampFiche libelle="Numéro" valeur={piece.numero} />
                    <ChampFiche libelle="Délivrée le" valeur={piece.delivreeLe ? formatDate(piece.delivreeLe) : undefined} />
                    <ChampFiche libelle="Lieu de délivrance" valeur={piece.lieuDelivrance} />
                    <ChampFiche libelle="Valide jusqu'au" valeur={piece.valideJusquau ? formatDate(piece.valideJusquau) : undefined} />
                    <ChampFiche libelle="Lieu de validité" valeur={piece.lieuValidite} />
                  </BandeFiche>
                ),
              },
            ]
          : []),
        {
          id: 'professionnelle',
          titre: 'Situation professionnelle',
          contenu: (
            <BandeFiche>
              <ChampFiche libelle="Profession" valeur={person.profession} />
              <ChampFiche libelle="Salaire" valeur={person.salaire} />
              <ChampFiche libelle="Employeur" valeur={person.employeur} />
              <ChampFiche libelle="Ancienneté" valeur={person.anciennete ? `${person.anciennete} ans` : undefined} />
            </BandeFiche>
          ),
        },
      ]}
    />
  );
}

// Sert `/prospects/:id` et `/clients/:id` : `GET /api/clients/{id}` renvoie le même `ProspectDetailDto`.
export function FicheProspect({
  id,
  client: isClientContext,
  variante = 'fenetre',
  voisins,
  onFermer = () => undefined,
}: Readonly<{
  id: string;
  client: boolean;
  variante?: VarianteCoque;
  voisins?: VoisinsFiche;
  onFermer?: () => void;
}>) {
  const { data: person, loading, error, refetch } = useApi(
    () => (isClientContext ? getClient(id) : getProspect(id)),
    [id, isClientContext],
  );
  const [tab, setTab] = useState<ProspectTab>('contacts');
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
  const { ouvrirFicheProspection, ouvrirFicheDossier } = usePreview();

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

  const nature = isClientContext ? 'Client' : 'Prospect';
  const coque = { variante, nature, voisins, onFermer };
  if (loading && !person) return <CoqueFiche {...coque} titre={nature}><LoadingState /></CoqueFiche>;
  if (error) return <CoqueFiche {...coque} titre={nature}><ErrorState message={error} /></CoqueFiche>;
  if (!person) {
    return (
      <CoqueFiche {...coque} titre={`${nature} introuvable`}>
        <p className="p-4">Ce {isClientContext ? 'client' : 'prospect'} n'existe pas.</p>
      </CoqueFiche>
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

  const nom = personDisplayName(person);
  const badges = (
    <>
      <span className="text-body text-muted-foreground">
        {person.type || 'Prospect'}
        {person.commercialNom && <> · commercial {person.commercialNom}</>}
      </span>
      {person.estAncienClient && <Badge tone="info">Ancien client</Badge>}
    </>
  );

  const corps = (
    <>
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

      <RubanFiche
        enregistrer={{ onClick: () => void save(), disabled: !editing || saving, aide: 'Enregistre les coordonnées modifiées.' }}
        propres={
          editing
            ? [{ id: 'annuler', libelle: 'Annuler', icone: X, onClick: () => setEditing(false), disabled: saving }]
            : [{ id: 'modifier', libelle: 'Modifier', icone: Pencil, onClick: startEdit }]
        }
      />

      <div className="max-h-[52%] shrink-0 overflow-auto border-b border-border px-4 py-3">
        {editing && form ? (
          <FormulaireCoordonnees form={form} onChange={setForm} erreur={saveError} />
        ) : (
          <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4">
            <BandeProspect person={person} />
            <EnteteProspect person={person} client={isClientContext} />
          </div>
        )}
      </div>

      <ClasseurBas
        actif={tab}
        onChange={(v) => setTab(v as ProspectTab)}
        onglets={[
          {
            id: 'contacts',
            libelle: 'Contacts',
            compteur: contacts.data?.length,
            contenu: (
              <div className="p-3">
                <ContactsProspect
                  contacts={contacts}
                  onAdd={async (body) => {
                    await addProspectContact(person.id, body);
                    await contacts.refetch();
                  }}
                  onRemove={async (linkId) => {
                    await removeProspectContact(person.id, linkId);
                    void contacts.refetch();
                  }}
                />
              </div>
            ),
          },
          {
            id: 'prospections',
            libelle: 'Prospections',
            compteur: prospections.data?.totalElements,
            contenu: (
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
            ),
          },
          {
            id: 'dossiers',
            libelle: 'Dossiers',
            compteur: dossiers.data?.totalElements,
            contenu: (
              <div className="flex flex-col gap-2.5 p-3">
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
              </div>
            ),
          },
          {
            id: 'reglements',
            libelle: 'Règlements',
            compteur: reglements.data?.totalElements,
            contenu: (
              <div className="flex flex-col gap-2.5 p-3">
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
                          <TableRow key={r.id} className={r.dossierId ? 'cursor-pointer' : ''} onClick={() => r.dossierId && ouvrirFicheDossier(r.dossierId)}>
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
              </div>
            ),
          },
          {
            id: 'historique',
            libelle: 'Historique',
            compteur: historique.data?.totalElements,
            contenu: (
              <div className="flex flex-col gap-2.5 p-3">
                {historique.loading && <LoadingState />}
                {historique.error && <ErrorState message={historique.error} />}
                {historique.data && historique.data.content.length === 0 && <EmptyState title="Aucun historique" />}
                {historique.data && historique.data.content.length > 0 && (
                  <HistoriqueStatuts lignes={historique.data.content} />
                )}
                {historique.data && (
                  <Pagination page={historique.data.page} totalPages={historique.data.totalPages} totalElements={historique.data.totalElements} onPageChange={setHistoriquePage} />
                )}
              </div>
            ),
          },
        ]}
      />
    </>
  );

  if (variante === 'dialogue') {
    return (
      <CadreFiche
        variante="dialogue"
        title={nom}
        typeFiche={nature}
        entete={
          <EnteteFiche code={person.code} nom={nom}>
            {badges}
          </EnteteFiche>
        }
      >
        {corps}
      </CadreFiche>
    );
  }
  return (
    <FenetreFiche
      nature={nature}
      titre={nom}
      badge={badges}
      voisins={voisins}
      onFermer={onFermer}
      enEdition={editing}
      pied={<PiedAudit creePar={person.creePar} creeLe={person.creeLe} modifiePar={person.modifiePar} modifieLe={person.modifieLe} />}
    >
      {corps}
    </FenetreFiche>
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
          <LienOuvrir
            fiche={{ type: 'prospection', id: p.id, pre: p.typeProspectionCode === CODE_PRE_PROSPECTION }}
            cible={`la prospection ${p.code || ''}`}
          />
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
                  <Field label="Budget" value={formatFourchetteMontant(detail.data.prix, detail.data.prixJusqua)} />
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
          <LienOuvrir fiche={{ type: 'dossier', id: d.id }} cible={`le dossier ${d.code || ''}`} />
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
                  <Field label="Remise" value={detail.data.remise != null ? formatPercentValue(detail.data.remise) : undefined} />
                  <Field label="Remise HT" value={detail.data.remiseMontant != null ? formatCurrency(detail.data.remiseMontant) : undefined} />
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
function LienOuvrir({ fiche, cible }: Readonly<{ fiche: FicheCible; cible: string }>) {
  return (
    <LienFiche
      cible={fiche}
      aria-label={`Ouvrir ${cible.trim()}`}
      className="rounded font-medium whitespace-nowrap text-(--brand) underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
      onKeyDown={(e) => e.stopPropagation()}
    >
      Ouvrir →
    </LienFiche>
  );
}
