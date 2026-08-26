import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Coins, Download, Eye, FileText, Plus, TrendingUp, Wallet } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState, StatCard } from '../../components/ui';
import DossierStatusStepper from '../../components/DossierStatusStepper';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { referentielItems, useCategoriesEcheance } from '../../lib/referentiels';
import { formatCurrency, formatDate, formatPercent, toApiDateTime, todayISO } from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import {
  addEcheance,
  addReglement,
  changerStatutDossier,
  getDossier,
  getMontantsDossier,
  listEcheances,
  downloadActeReservation,
  downloadFicheReservation,
  downloadPieceJointe,
  getEtapesSuivantes,
  listHistoriqueDossier,
  listPiecesJointes,
  viewActeReservation,
  viewFicheReservation,
  viewPieceJointe,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import type { CreerEcheanceRequest, CreerReglementRequest, PieceJointeDto } from '../../types';

type DossierTab = 'apercu' | 'financier' | 'documents' | 'historique' | 'admin';

function AddEcheanceRow({
  onAdd,
  initialOpen,
  initialMontant,
  initialDate,
}: {
  onAdd: (body: CreerEcheanceRequest) => Promise<void>;
  initialOpen?: boolean;
  initialMontant?: number;
  initialDate?: string;
}) {
  const [open, setOpen] = useState(!!initialOpen);
  const [categorieId, setCategorieId] = useState<string | null>(null);
  const [montant, setMontant] = useState(initialMontant ? String(initialMontant) : '');
  const [dateEcheance, setDateEcheance] = useState(initialDate ?? '');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const categoriesEcheance = useCategoriesEcheance();
  const categorieItems = referentielItems(categoriesEcheance.data);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Ajouter une échéance
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-muted/30 p-3">
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground" htmlFor="new-cat">Catégorie</label>
        <Select items={categorieItems} value={categorieId} onValueChange={(v) => setCategorieId((v as string) || null)}>
          <SelectTrigger id="new-cat" className="w-[180px]">
            <SelectValue placeholder="Choisir…" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categorieItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground" htmlFor="new-montant">Montant</label>
        <Input id="new-montant" type="number" className="w-[130px]" value={montant} onChange={(e) => setMontant(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground" htmlFor="new-date">Échéance</label>
        <Input id="new-date" type="date" className="w-[145px]" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-muted-foreground" htmlFor="new-desc">Description</label>
        <Input id="new-desc" className="w-[180px]" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <Button
        type="button"
        size="sm"
        disabled={busy || !montant}
        onClick={async () => {
          setBusy(true);
          try {
            await onAdd({
              categorieId: categorieId || undefined,
              montant: Number(montant) || 0,
              // CreerEcheanceRequest.dateEcheance is `format: date-time` — a
              // bare "YYYY-MM-DD" from the date input 400s (same issue fixed
              // for ChangerStatutRequest.date), so pad it to midnight ISO.
              dateEcheance: toApiDateTime(dateEcheance) ?? null,
              description: description || undefined,
            });
            setOpen(false);
            setCategorieId(null);
            setMontant('');
            setDateEcheance('');
            setDescription('');
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

function PieceJointeRow({ dossierId, piece }: { dossierId: string; piece: PieceJointeDto }) {
  const [busyAction, setBusyAction] = useState<'view' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ext = piece.extension?.replace(/^\./, '') || '';
  const filename = `${piece.description || 'document'}${ext ? `.${ext}` : ''}`;

  async function handle(action: 'view' | 'download') {
    setBusyAction(action);
    setError(null);
    try {
      if (action === 'view') await viewPieceJointe(dossierId, piece.id, piece.extension);
      else await downloadPieceJointe(dossierId, piece.id, filename, piece.extension);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'opération.');
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px]">
      <span className="flex min-w-0 items-center gap-2">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium text-foreground">{filename}</span>
      </span>
      <span className="shrink-0 text-muted-foreground">{formatDate(piece.dateCreation)}</span>
      <div className="flex shrink-0 items-center gap-2">
        {error && <span className="text-[11.5px] text-destructive">{error}</span>}
        <Button type="button" variant="outline" size="sm" disabled={!!busyAction} onClick={() => handle('view')}>
          <Eye data-icon="inline-start" /> {busyAction === 'view' ? 'Ouverture…' : 'Voir'}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!!busyAction} onClick={() => handle('download')}>
          <Download data-icon="inline-start" /> {busyAction === 'download' ? 'Téléchargement…' : 'Télécharger'}
        </Button>
      </div>
    </div>
  );
}

type GeneratedDocKind = 'fiche-reservation' | 'acte-reservation';

const GENERATED_DOC_HANDLERS: Record<GeneratedDocKind, {
  title: string;
  view: (dossierId: string, format: 'pdf' | 'docx') => Promise<void>;
  download: (dossierId: string, filename: string, format: 'pdf' | 'docx') => Promise<void>;
}> = {
  'fiche-reservation': { title: 'Fiche de réservation', view: viewFicheReservation, download: downloadFicheReservation },
  'acte-reservation': { title: 'Acte de réservation', view: viewActeReservation, download: downloadActeReservation },
};

function GeneratedDocumentCard({ dossierId, code, kind }: { dossierId: string; code?: string | null; kind: GeneratedDocKind }) {
  const [busy, setBusy] = useState<'view' | 'pdf' | 'docx' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { title, view, download } = GENERATED_DOC_HANDLERS[kind];
  const filenameBase = code ? `${code}-${kind}` : kind;

  async function handle(action: 'view' | 'pdf' | 'docx') {
    setBusy(action);
    setError(null);
    try {
      if (action === 'view') await view(dossierId, 'pdf');
      else await download(dossierId, `${filenameBase}.${action}`, action);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card title={title}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <p className="text-[13px] text-muted-foreground">Document généré à partir des informations du dossier.</p>
        <div className="flex shrink-0 items-center gap-2">
          {error && <span className="text-[11.5px] text-destructive">{error}</span>}
          <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={() => handle('view')}>
            <Eye data-icon="inline-start" /> {busy === 'view' ? 'Ouverture…' : 'Voir'}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={() => handle('pdf')}>
            <Download data-icon="inline-start" /> {busy === 'pdf' ? 'Téléchargement…' : 'PDF'}
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={() => handle('docx')}>
            <Download data-icon="inline-start" /> {busy === 'docx' ? 'Téléchargement…' : 'Word'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function AddReglementRow({ echeanceId, onAdd }: { echeanceId: string; onAdd: (echeanceId: string, body: CreerReglementRequest) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [montant, setMontant] = useState('');
  const [dateReglement, setDateReglement] = useState('');
  const [typeId, setTypeId] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        + Règlement
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-md border border-border bg-muted/30 p-2.5">
      <Input type="number" placeholder="Montant" className="w-[110px]" value={montant} onChange={(e) => setMontant(e.target.value)} />
      <Input type="date" className="w-[140px]" value={dateReglement} onChange={(e) => setDateReglement(e.target.value)} />
      <Input placeholder="UUID type de règlement" className="w-[170px]" value={typeId} onChange={(e) => setTypeId(e.target.value)} />
      <Button
        type="button"
        size="sm"
        disabled={busy || !montant}
        onClick={async () => {
          setBusy(true);
          try {
            await onAdd(echeanceId, { montant: Number(montant) || 0, dateReglement: toApiDateTime(dateReglement) ?? null, typeId: typeId || undefined });
            setOpen(false);
            setMontant('');
            setDateReglement('');
            setTypeId('');
          } finally {
            setBusy(false);
          }
        }}
      >
        Ok
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
    </div>
  );
}

export default function DossierDetail() {
  const { id } = useParams();
  const { data: d, loading, error, refetch } = useApi(() => getDossier(id!), [id]);
  const nextSteps = useApi(() => getEtapesSuivantes(id!), [id]);
  const montants = useApi(() => getMontantsDossier(id!), [id]);
  const [echeancesPage, setEcheancesPage] = useState(0);
  const echeances = useApi(() => listEcheances(id!, { page: echeancesPage, size: 20 }), [id, echeancesPage]);
  const pieces = useApi(() => listPiecesJointes(id!), [id]);
  const [historiquePage, setHistoriquePage] = useState(0);
  const historique = useApi(() => listHistoriqueDossier(id!, { page: historiquePage, size: 20 }), [id, historiquePage]);
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  // Landing here right after "Créer le dossier" (see NewDossier.tsx) — jump
  // straight to Financier with the "Ajouter une échéance" row pre-opened and
  // pre-filled, since the schéma de financement always starts empty (the
  // API's CreerDossierRequest has no way to seed it at creation time).
  const fromCreation = searchParams.get('nouveau') === '1';
  const [tab, setTab] = useState<DossierTab>(fromCreation ? 'financier' : 'apercu');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  if (loading) return <PageShell title="Dossier de vente"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Dossier de vente"><ErrorState message={error} /></PageShell>;
  if (!d) {
    return (
      <PageShell title="Dossier introuvable" crumbs={[{ label: 'Dossiers', to: '/dossiers' }]}>
        <p>Ce dossier n'existe pas.</p>
      </PageShell>
    );
  }

  const title = d.clientNom || d.code || 'Dossier';

  return (
    <PageShell title={title} crumbs={[{ label: 'Dossiers', to: '/dossiers' }, { label: d.code || '' }]}>
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate('/dossiers')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      {fromCreation && (
        <div className="mb-3 rounded-md border border-[var(--info-border)] bg-[var(--info-bg)] px-3.5 py-2.5 text-[13px] text-[var(--info)]">
          Dossier créé. Le schéma de financement est vide — l'API ne permet pas de le pré-remplir à la création, complétez-le
          ci-dessous avec le formulaire « Ajouter une échéance » (déjà pré-rempli avec le total à payer).
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{title}</h1>
            <Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
            Dossier {d.code} · Créé le {formatDate(d.dateDocument)} · Commercial : {d.commercialNom || '—'}
          </div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
        <StatCard icon={<Coins />} label="Prix retenu" value={formatCurrency(d.prix)} sub={d.remise ? `Remise ${formatPercent(d.remise, 2)}` : undefined} />
        <StatCard icon={<Wallet />} label="Total à payer" value={formatCurrency(d.totalAPayer)} />
        <StatCard icon={<TrendingUp />} label="Probabilité de finalisation" value={formatPercent(d.probabiliteFinalisation)} sub={canonicalStatusLabel(d.statut)} />
      </div>

      <div className="mb-3">
        <DossierStatusStepper
          currentStatus={d.statut || 'Réservation'}
          nextSteps={nextSteps.data ?? []}
          onConfirm={async (newStatus, note, date) => {
            try {
              await changerStatutDossier(d.id, { statut: newStatus, note: note || undefined, date: toApiDateTime(date) });
              await refetch();
              await nextSteps.refetch();
              await historique.refetch();
              showToast(`Statut changé : ${canonicalStatusLabel(newStatus)}.`);
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Échec de l'opération.");
            }
          }}
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as DossierTab)} className="gap-3">
        <TabsList>
          <TabsTrigger value="apercu">Aperçu</TabsTrigger>
          <TabsTrigger value="financier">Financier</TabsTrigger>
          <TabsTrigger value="documents">
            Documents {(pieces.data?.length ?? 0) > 0 && <Badge tone="neutral" className="ml-1.5">{pieces.data!.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
          <TabsTrigger value="admin">Administratif</TabsTrigger>
        </TabsList>

        <TabsContent value="apercu">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card title="Client">
                <FieldGrid>
                  <Field label="Nom" value={d.clientNom} />
                  <Field label="Commercial" value={d.commercialNom} />
                  <Field label="Avocat" value={d.avocatNom} />
                </FieldGrid>
              </Card>

              <Card title={`Article(s) réservé(s) (${d.articles?.length ?? 0})`}>
                {!d.articles || d.articles.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">Aucun article lié.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {d.articles.map((a) => (
                      <div key={a.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-[13px]">
                        <span className="font-medium text-foreground">{a.code}</span>
                        <span className="text-muted-foreground">{a.description}</span>
                        <span className="text-muted-foreground">{a.area ? `${a.area} m²` : '—'}</span>
                        <span className="font-medium tabular-nums text-foreground">{formatCurrency(a.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {d.notes && (
              <Card title="Notes">
                <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-[13px] leading-relaxed text-foreground">
                  {d.notes}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="financier">
          <div className="flex flex-col gap-3">
            <Card title="Montants">
              <FieldGrid>
                <Field label="Prix avant remise" value={formatCurrency(d.prixAvantRemise)} />
                <Field label="Remise" value={d.remise ? `${formatPercent(d.remise, 2)} (${formatCurrency(d.remiseMontant)})` : undefined} />
                <Field label="Prix après remise" value={formatCurrency(d.prixApresRemise)} />
                <Field label="Prix retenu" value={formatCurrency(d.prix)} />
                <Field label="Avance" value={formatCurrency(d.montantAvance)} />
                <Field label="Total à payer" value={formatCurrency(d.totalAPayer)} />
                <Field label="Mode de paiement" value={d.modePaie} />
              </FieldGrid>

              {montants.data && montants.data.parCategorie && montants.data.parCategorie.length > 0 && (
                <div className="mt-4 overflow-x-auto border-t border-border pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Catégorie</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Réglé</TableHead>
                        <TableHead className="text-right">Reste</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {montants.data.parCategorie.map((row) => (
                        <TableRow key={row.categorie} className="hover:bg-transparent">
                          <TableCell className="font-medium text-foreground">{row.categorie}</TableCell>
                          <TableCell className="text-right tabular-nums">{formatCurrency(row.montant)}</TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(row.regle)}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium text-foreground">{formatCurrency(row.reste)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="font-semibold text-foreground">Total général</TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell className="text-right text-[14px] font-semibold tabular-nums text-foreground">
                          {formatCurrency(montants.data.totalGeneral)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>

            {/* Called "Échéancier" in api-docsV0/V1, but the real Omran screen
                (omaran_visual) labels this "Schéma de financement" — same
                data (EcheanceDto), just the on-screen name. The screen also
                shows Décompte/Facture columns and sibling tabs (Sous
                articles, Acquéreurs, Modifications, Cadeaux, Dépenses,
                Factures proforma, Factures, Avoirs, Décomptes, Réclamations)
                that have no corresponding endpoint in api-docsV2 yet — out
                of scope until the backend exposes them. */}
            <Card
              title="Schéma de financement"
              action={
                <AddEcheanceRow
                  onAdd={async (body) => {
                    await addEcheance(d.id, body);
                    await echeances.refetch();
                    await montants.refetch();
                  }}
                  initialOpen={fromCreation}
                  initialMontant={d.totalAPayer ?? d.prix ?? undefined}
                  initialDate={todayISO()}
                />
              }
            >
              {echeances.loading && <LoadingState />}
              {echeances.error && <ErrorState message={echeances.error} />}
              {echeances.data && echeances.data.content.length === 0 && (
                <p className="text-[13px] text-muted-foreground">Aucune ligne dans le schéma de financement pour ce dossier.</p>
              )}
              {echeances.data && echeances.data.content.length > 0 && (
                <div className="flex flex-col gap-2">
                  {echeances.data.content.map((l) => (
                    <div key={l.id} className="rounded-md border border-border px-3 py-2 text-[13px]">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <span className="font-medium text-foreground">{l.categorie || l.description || 'Échéance'}</span>
                        <span className="text-muted-foreground">{formatDate(l.dateEcheance)}</span>
                        <span className="text-muted-foreground">
                          Réglé {formatCurrency(l.montantRegle)} · Reste {formatCurrency(l.reste)}
                        </span>
                        <span className="font-medium tabular-nums text-foreground">{formatCurrency(l.montant)}</span>
                      </div>
                      <div className="mt-1.5">
                        <AddReglementRow
                          echeanceId={l.id}
                          onAdd={async (echeanceId, body) => {
                            await addReglement(d.id, echeanceId, body);
                            await echeances.refetch();
                            await montants.refetch();
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {echeances.data && (
                <Pagination
                  page={echeances.data.page}
                  totalPages={echeances.data.totalPages}
                  totalElements={echeances.data.totalElements}
                  onPageChange={setEcheancesPage}
                />
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="flex flex-col gap-3.5">
          <GeneratedDocumentCard dossierId={d.id} code={d.code} kind="fiche-reservation" />
          <GeneratedDocumentCard dossierId={d.id} code={d.code} kind="acte-reservation" />
          <Card title={`Pièces jointes (${pieces.data?.length ?? 0})`}>
            {pieces.loading && <LoadingState />}
            {pieces.error && <ErrorState message={pieces.error} />}
            {pieces.data && pieces.data.length === 0 && (
              <EmptyState title="Aucune pièce jointe" message="Aucun document n'a été attaché à ce dossier." />
            )}
            {pieces.data && pieces.data.length > 0 && (
              <div className="flex flex-col gap-2">
                {pieces.data.map((p) => (
                  <PieceJointeRow key={p.id} dossierId={d.id} piece={p} />
                ))}
              </div>
            )}
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="historique">
          <Card title="Historique">
            {historique.loading && <LoadingState />}
            {historique.error && <ErrorState message={historique.error} />}
            {historique.data && historique.data.content.length === 0 && (
              <EmptyState title="Aucun historique" message="Aucun événement n'a encore été enregistré pour ce dossier." />
            )}
            {historique.data && historique.data.content.length > 0 && (
              <div className="flex flex-col">
                {historique.data.content.map((h, i) => (
                  <div className="relative flex gap-3 pb-4.5 last:pb-0" key={`${h.date}-${i}`}>
                    <div className="flex shrink-0 flex-col items-center">
                      <div className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                      {i < historique.data!.content.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-border" />}
                    </div>
                    <div className="min-w-0 flex-1 pb-0.5">
                      <div className="text-[13px] font-semibold text-foreground">{h.type || 'Événement'}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(h.date)} · {h.utilisateur || 'Système'}</div>
                      {h.description && <div className="mt-1 text-[12.5px] text-foreground">{h.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {historique.data && (
              <Pagination
                page={historique.data.page}
                totalPages={historique.data.totalPages}
                totalElements={historique.data.totalElements}
                onPageChange={setHistoriquePage}
              />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card title="Suivi administratif">
            <FieldGrid>
              <Field label="Code dossier" value={d.code} />
              <Field label="Créé le" value={formatDate(d.dateDocument)} />
              <Field label="Statut" value={canonicalStatusLabel(d.statut)} />
              <Field label="Étapes atteignables" value={d.etapesAtteignables?.join(', ')} />
            </FieldGrid>
          </Card>
        </TabsContent>
      </Tabs>

      {toast && (
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-lg bg-foreground px-4.5 py-3 text-[13px] font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
