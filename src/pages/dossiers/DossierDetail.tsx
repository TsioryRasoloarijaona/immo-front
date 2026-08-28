import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ChevronDown, ChevronRight, Coins, Download, Eye, FileDown, FileText, Folder, Phone, Plus, TrendingUp, Upload, Wallet } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState, StatCard } from '../../components/ui';
import ArticleCompactPreview from '../../components/ArticleCompactPreview';
import DossierStatusStepper from '../../components/DossierStatusStepper';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { referentielItems, useBanques, useCategoriesEcheance, useTypesPieceJointe, useTypesReglement } from '../../lib/referentiels';
import { formatCurrency, formatDate, formatPercent, toApiDateTime, todayISO } from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import {
  ECHEANCE_STATUT_LABELS,
  echeanceCategorieTone,
  echeanceStatut,
  echeanceStatutTone,
  etapeBadgeTone,
  pieceJointeTypeTone,
  prospectionDisplayName,
} from '../../lib/domain';
import {
  addEcheance,
  addReglement,
  changerStatutDossier,
  getArticle,
  getClient,
  getDossier,
  getMontantsDossier,
  getProspection,
  listEcheanceReglements,
  listEcheances,
  downloadActeReservation,
  downloadAutorisationVersement,
  downloadFicheReservation,
  downloadDossierPdfOnlyDocument,
  downloadPieceJointe,
  downloadRecuReglement,
  getEtapesSuivantes,
  listHistoriqueDossier,
  listPiecesJointes,
  uploadPieceJointe,
  viewActeReservation,
  viewAutorisationVersement,
  viewFicheReservation,
  viewDossierPdfOnlyDocument,
  viewPieceJointe,
  viewRecuReglement,
  type DossierPdfOnlyDocKind,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import type { CreerEcheanceRequest, CreerReglementRequest, EcheanceDto, PieceJointeDto } from '../../types';

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

  function reset() {
    setOpen(false);
    setCategorieId(null);
    setMontant(initialMontant ? String(initialMontant) : '');
    setDateEcheance(initialDate ?? '');
    setDescription('');
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" /> Ajouter une échéance
      </Button>
    );
  }

  return (
    <Modal title="Ajouter une échéance" onClose={reset} width={460}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
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
            reset();
          } finally {
            setBusy(false);
          }
        }}
      >
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="new-cat">Catégorie</FieldLabel>
            <Select items={categorieItems} value={categorieId} onValueChange={(v) => setCategorieId((v as string) || null)}>
              <SelectTrigger id="new-cat" className="w-full">
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
          </FormField>
          <FormField>
            <FieldLabel htmlFor="new-montant">Montant</FieldLabel>
            <Input id="new-montant" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="new-date">Échéance</FieldLabel>
            <Input id="new-date" type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="new-desc">Description</FieldLabel>
            <Input id="new-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormField>
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={reset}>Annuler</Button>
          <Button type="submit" disabled={busy || !montant}>Ajouter</Button>
        </DialogFooter>
      </form>
    </Modal>
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
    <TableRow className="hover:bg-muted/40">
      <TableCell>
        <span className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium text-foreground">{filename}</span>
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">{piece.creePar || '—'}</TableCell>
      <TableCell>
        {piece.type ? <Badge tone={pieceJointeTypeTone(piece.type)}>{piece.type}</Badge> : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="text-right text-muted-foreground">{formatDate(piece.dateCreation)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {error && <span className="text-[11.5px] text-destructive">{error}</span>}
          <Button type="button" variant="ghost" size="sm" disabled={!!busyAction} onClick={() => handle('view')}>
            <Eye data-icon="inline-start" /> {busyAction === 'view' ? 'Ouverture…' : 'Voir'}
          </Button>
          <Button type="button" variant="ghost" size="sm" disabled={!!busyAction} onClick={() => handle('download')}>
            <Download data-icon="inline-start" /> {busyAction === 'download' ? 'Téléchargement…' : 'Télécharger'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

type GeneratedDocKind = 'fiche-reservation' | 'acte-reservation' | DossierPdfOnlyDocKind;

const GENERATED_DOC_HANDLERS: Record<GeneratedDocKind, {
  title: string;
  /** Whether the backend also offers a `docx` variant — drives whether the
   * card shows a split "PDF / Word" pair or a single "Télécharger" button.
   * `fiche-bancaire` is explicitly PDF-only per the API description ("pas
   * de variante Word pour ce document"); same for the other two new docs. */
  hasDocx: boolean;
  view: (dossierId: string, format: 'pdf' | 'docx') => Promise<void>;
  download: (dossierId: string, filename: string, format: 'pdf' | 'docx') => Promise<void>;
}> = {
  'fiche-reservation': { title: 'Fiche de réservation', hasDocx: true, view: viewFicheReservation, download: downloadFicheReservation },
  'acte-reservation': { title: 'Acte de réservation', hasDocx: true, view: viewActeReservation, download: downloadActeReservation },
  'fiche-visite-technique': {
    title: 'Fiche visite technique',
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-visite-technique'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-visite-technique', filename),
  },
  'fiche-dossier-vente': {
    title: 'Fiche dossier de vente',
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-dossier-vente'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-dossier-vente', filename),
  },
  'fiche-bancaire': {
    title: 'Fiche bancaire',
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-bancaire'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-bancaire', filename),
  },
  'fiche-trop-percu': {
    title: 'Fiche trop perçu',
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-trop-percu'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-trop-percu', filename),
  },
};

/** One compact chip per generated document — these 5 kinds aren't a saved
 * list (nothing here persists, no count that grows), just a fixed set of
 * on-demand document generators, so they shouldn't read as data rows at
 * all. A wrapped row of small chips (icon + name + icon-only actions)
 * takes a fraction of the vertical space the old full-width divide-y rows
 * did, while still fitting the same "Documents générés" card. Errors go
 * through the page-level toast (`onError`) rather than inline text, since
 * a chip has no room for a message of its own. */
function GeneratedDocumentChip({
  dossierId,
  code,
  kind,
  onError,
}: {
  dossierId: string;
  code?: string | null;
  kind: GeneratedDocKind;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState<'view' | 'pdf' | 'docx' | null>(null);
  const { title, hasDocx, view, download } = GENERATED_DOC_HANDLERS[kind];
  const filenameBase = code ? `${code}-${kind}` : kind;

  async function handle(action: 'view' | 'pdf' | 'docx') {
    setBusy(action);
    try {
      if (action === 'view') await view(dossierId, 'pdf');
      else await download(dossierId, `${filenameBase}.${action}`, action);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 py-1 pr-1 pl-2.5 text-[12.5px]">
      <FileText className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="mr-1 ml-1.5 font-medium text-foreground">{title}</span>
      <Button type="button" variant="ghost" size="icon-xs" title="Voir" disabled={!!busy} onClick={() => handle('view')}>
        <Eye />
      </Button>
      {hasDocx ? (
        <>
          <Button type="button" variant="ghost" size="icon-xs" title="Télécharger en PDF" disabled={!!busy} onClick={() => handle('pdf')}>
            <Download />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" title="Télécharger en Word" disabled={!!busy} onClick={() => handle('docx')}>
            <FileDown />
          </Button>
        </>
      ) : (
        <Button type="button" variant="ghost" size="icon-xs" title="Télécharger" disabled={!!busy} onClick={() => handle('pdf')}>
          <Download />
        </Button>
      )}
    </div>
  );
}

const GENERATED_DOC_KINDS: GeneratedDocKind[] = [
  'fiche-reservation',
  'acte-reservation',
  'fiche-visite-technique',
  'fiche-dossier-vente',
  'fiche-bancaire',
  'fiche-trop-percu',
];

/** `POST /api/dossiers/{id}/pieces-jointes` — same collapsed-by-default
 * inline-form convention as `AddReglementRow`/`AddEcheanceRow` below, but
 * `open` is controlled by the parent: the trigger button lives in the
 * card's top-right header `action` slot (not stacked below the list), and
 * this component only renders the expanded form itself.
 * `description` is optional (backend falls back to the original filename),
 * matched here to a plain text `Input` rather than the file's own name so
 * the user can give it a meaningful caption ("CIN client", "Contrat
 * signé") instead of a raw upload filename. */
function AddPieceJointeRow({
  dossierId,
  open,
  onOpenChange,
  onAdded,
}: {
  dossierId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typesPieceJointe = useTypesPieceJointe();
  const typesPieceJointeItems = referentielItems(typesPieceJointe.data);

  function reset() {
    onOpenChange(false);
    setFile(null);
    setDescription('');
    setTypeId(null);
    setError(null);
  }

  if (!open) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 p-2.5">
      <label className="flex h-8 min-w-0 max-w-70 flex-1 cursor-pointer items-center gap-2 truncate rounded-md border border-dashed border-input px-2.5 text-[12.5px] text-muted-foreground hover:border-ring">
        <Upload className="size-3.5 shrink-0" />
        <span className="truncate">{file ? file.name : 'Choisir un fichier…'}</span>
        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <Input
        placeholder="Description (optionnel)"
        className="w-45"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Select items={typesPieceJointeItems} value={typeId} onValueChange={(v) => setTypeId(v as string | null)}>
        <SelectTrigger size="sm" className="w-45">
          <SelectValue placeholder={typesPieceJointe.loading ? 'Chargement…' : 'Type (optionnel)'} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {typesPieceJointeItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {error && <span className="text-[11.5px] text-destructive">{error}</span>}
      <Button
        type="button"
        size="sm"
        disabled={busy || !file}
        onClick={async () => {
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            await uploadPieceJointe(dossierId, file, description.trim() || undefined, typeId || undefined);
            onAdded();
            reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Échec de l'envoi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Envoi…' : 'Envoyer'}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={busy}>Annuler</Button>
    </div>
  );
}

/** `typeId`/`banqueId` (CreerReglementRequest) resolve against
 * `GET /api/referentiels/types-reglement`/`/banques` — distinct tables from
 * `modes-paiement` (StlSettlementType vs ComPaymentMethod), confirmed live
 * (see instructions/from_front.md, backend repo). Banque is only shown once
 * a type with `banqueObligatoire` is picked, per `TypeReglementDto`. */
function AddReglementRow({ echeanceId, onAdd }: { echeanceId: string; onAdd: (echeanceId: string, body: CreerReglementRequest) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [montant, setMontant] = useState('');
  const [dateReglement, setDateReglement] = useState('');
  const [typeId, setTypeId] = useState<string | null>(null);
  const [banqueId, setBanqueId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const typesReglement = useTypesReglement();
  const banques = useBanques();
  const typesReglementItems = typesReglement.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const banquesItems = referentielItems(banques.data);
  const selectedType = typesReglement.data.find((t) => t.id === typeId);
  const banqueRequired = selectedType?.banqueObligatoire ?? false;

  function reset() {
    setOpen(false);
    setMontant('');
    setDateReglement('');
    setTypeId(null);
    setBanqueId(null);
  }

  if (!open) {
    return (
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        + Règlement
      </Button>
    );
  }

  return (
    <Modal title="Ajouter un règlement" onClose={reset} width={440}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onAdd(echeanceId, {
              montant: Number(montant) || 0,
              dateReglement: toApiDateTime(dateReglement) ?? null,
              typeId: typeId || undefined,
              banqueId: banqueRequired ? banqueId || undefined : undefined,
            });
            reset();
          } finally {
            setBusy(false);
          }
        }}
      >
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="reg-montant">Montant</FieldLabel>
            <Input id="reg-montant" type="number" value={montant} onChange={(e) => setMontant(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reg-date">Date</FieldLabel>
            <Input id="reg-date" type="date" value={dateReglement} onChange={(e) => setDateReglement(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reg-type">Type de règlement</FieldLabel>
            <Select
              items={typesReglementItems}
              value={typeId}
              onValueChange={(v) => {
                setTypeId(v as string | null);
                setBanqueId(null);
              }}
            >
              <SelectTrigger id="reg-type" className="w-full">
                <SelectValue placeholder={typesReglement.loading ? 'Chargement…' : 'Type de règlement'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {typesReglementItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
          {banqueRequired && (
            <FormField>
              <FieldLabel htmlFor="reg-banque">Banque</FieldLabel>
              <Select items={banquesItems} value={banqueId} onValueChange={(v) => setBanqueId(v as string | null)}>
                <SelectTrigger id="reg-banque" className="w-full">
                  <SelectValue placeholder={banques.loading ? 'Chargement…' : 'Banque'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {banquesItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </FormField>
          )}
        </FieldGroup>
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={reset}>Annuler</Button>
          <Button type="submit" disabled={busy || !montant || (banqueRequired && !banqueId)}>Ok</Button>
        </DialogFooter>
      </form>
    </Modal>
  );
}

/** `GET /api/dossiers/{id}/reglements/{reglementId}/documents/recu` — one
 * PDF-only "Reçu de règlement" per règlement row, icon-only like the
 * generated-document chips (same reasoning: this isn't saved data, it's
 * generated on demand from the règlement's own id). */
function ReglementRecuButton({ dossierId, reglementId }: { dossierId: string; reglementId: string }) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(action: 'view' | 'download') {
    setBusy(action);
    setError(null);
    try {
      if (action === 'view') await viewRecuReglement(dossierId, reglementId);
      else await downloadRecuReglement(dossierId, reglementId, `recu-${reglementId}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {error && <span className="text-[11px] text-destructive">{error}</span>}
      <Button type="button" variant="ghost" size="icon-xs" title="Voir le reçu" disabled={!!busy} onClick={() => handle('view')}>
        <Eye />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Télécharger le reçu" disabled={!!busy} onClick={() => handle('download')}>
        <Download />
      </Button>
    </span>
  );
}

/** `GET /api/dossiers/{id}/echeancier/{echeanceId}/documents/autorisation-versement`
 * — one PDF-only "Autorisation d'Encaissement" per échéance (keyed off the
 * échéance's own id, not a règlement's, unlike `ReglementRecuButton` above)
 * — a document for the client's bank authorizing release of that échéance's
 * amount. Same icon-only view/download pattern. */
function AutorisationVersementButton({ dossierId, echeanceId }: { dossierId: string; echeanceId: string }) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(action: 'view' | 'download') {
    setBusy(action);
    setError(null);
    try {
      if (action === 'view') await viewAutorisationVersement(dossierId, echeanceId);
      else await downloadAutorisationVersement(dossierId, echeanceId, `autorisation-versement-${echeanceId}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {error && <span className="text-[11px] text-destructive">{error}</span>}
      <Button type="button" variant="ghost" size="icon-xs" title="Voir l'autorisation d'encaissement" disabled={!!busy} onClick={() => handle('view')}>
        <Eye />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Télécharger l'autorisation d'encaissement" disabled={!!busy} onClick={() => handle('download')}>
        <Download />
      </Button>
    </span>
  );
}

/** `GET .../echeancier/{echeanceId}/reglements` — détail ligne par ligne
 * derrière le seul total `montantRegle`/`reste` de l'échéance, rendu dans la
 * ligne dépliée d'`EcheanceRow`. `refreshKey` force un refetch quand un
 * nouveau règlement vient d'être ajouté pendant que la ligne est dépliée. */
function EcheanceReglementsHistory({ dossierId, echeanceId, refreshKey }: { dossierId: string; echeanceId: string; refreshKey: number }) {
  const { data, loading, error } = useApi(() => listEcheanceReglements(dossierId, echeanceId), [dossierId, echeanceId, refreshKey]);

  if (loading) return <span className="text-[12px] text-muted-foreground">Chargement…</span>;
  if (error) return <span className="text-[12px] text-destructive">{error}</span>;
  if (data && data.length === 0) return <span className="text-[12px] text-muted-foreground">Aucun règlement enregistré.</span>;

  return (
    <div className="flex flex-col gap-1">
      {data?.map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-md border border-(--success-border) bg-(--success-bg) px-2.5 py-1.5 text-[12px]">
          <span className="font-medium text-foreground">{r.typeLibelle || '—'}</span>
          {r.banqueNom && <span className="text-muted-foreground">{r.banqueNom}</span>}
          {r.reference && <span className="text-muted-foreground">Réf. {r.reference}</span>}
          {r.payeurNom && <span className="text-muted-foreground">Payeur : {r.payeurNom}</span>}
          <span className="text-muted-foreground">{formatDate(r.dateReglement)}</span>
          {r.notes && <span className="text-muted-foreground italic">{r.notes}</span>}
          <span className="ml-auto font-semibold tabular-nums text-(--success)">{formatCurrency(r.montant)}</span>
          <ReglementRecuButton dossierId={dossierId} reglementId={r.id} />
        </div>
      ))}
    </div>
  );
}

/** One row of the "Schéma de financement" table — a colored `Badge` per
 * catégorie/statut (see `echeanceCategorieTone`/`echeanceStatut` in
 * lib/domain.tsx) plus a click-to-expand détail row, same convention as
 * `ProspectDetail.tsx`'s `ProspectionRow`/`DossierRow`. `reglementsVersion`
 * forces the détail row's history to refetch right after a new règlement is
 * added through `AddReglementRow` without re-rendering the whole table. */
function EcheanceRow({
  dossierId,
  echeance,
  onReglementAdded,
}: {
  dossierId: string;
  echeance: EcheanceDto;
  onReglementAdded: (echeanceId: string, body: CreerReglementRequest) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reglementsVersion, setReglementsVersion] = useState(0);
  const statut = echeanceStatut(echeance);

  return (
    <>
      <TableRow
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${expanded ? 'Replier' : 'Déplier'} l'échéance ${echeance.categorie || echeance.description || ''}`}
        className="cursor-pointer"
        onClick={() => setExpanded((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((o) => !o); }
        }}
      >
        <TableCell>
          {expanded ? <ChevronDown className="size-4 text-(--brand)" /> : <ChevronRight className="size-4 text-muted-foreground" />}
        </TableCell>
        <TableCell>
          <Badge tone={echeanceCategorieTone(echeance.categorie)}>{echeance.categorie || echeance.description || 'Échéance'}</Badge>
        </TableCell>
        <TableCell className="text-muted-foreground">{formatDate(echeance.dateEcheance)}</TableCell>
        <TableCell className="text-right font-semibold tabular-nums text-foreground">{formatCurrency(echeance.montant)}</TableCell>
        <TableCell>
          <div className="flex flex-col gap-0.5">
            <Badge tone={echeanceStatutTone(statut)}>{ECHEANCE_STATUT_LABELS[statut]}</Badge>
            {statut !== 'aregler' && (
              <span className="text-[11px] text-muted-foreground">
                Réglé {formatCurrency(echeance.montantRegle)}{echeance.reste ? ` · Reste ${formatCurrency(echeance.reste)}` : ''}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <AutorisationVersementButton dossierId={dossierId} echeanceId={echeance.id} />
            <AddReglementRow
              echeanceId={echeance.id}
              onAdd={async (echeanceId, body) => {
                await onReglementAdded(echeanceId, body);
                setReglementsVersion((v) => v + 1);
                setExpanded(true);
              }}
            />
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="bg-muted/30 py-3">
            <EcheanceReglementsHistory dossierId={dossierId} echeanceId={echeance.id} refreshKey={reglementsVersion} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function DossierDetail() {
  const { id } = useParams();
  const { data: d, loading, error, refetch } = useApi(() => getDossier(id!), [id]);
  // Cascade reference up to the originating Prospection — same
  // reference-the-previous-pipeline-stage convention as Prospection's own
  // "Prospect" tab. `prospectionId` isn't in the API yet (see the field's
  // comment in types.ts); this stays dormant (tab hidden) until it is.
  const linkedProspection = useApi(() => (d?.prospectionId ? getProspection(d.prospectionId) : Promise.resolve(null)), [d?.prospectionId]);
  // Full contact details for the "Client" card — DossierDetailDto only
  // carries clientId/clientNom, same reason the Prospection/Prospect
  // cascade tabs needed their own fetch.
  const linkedClient = useApi(() => (d?.clientId ? getClient(d.clientId) : Promise.resolve(null)), [d?.clientId]);
  // Full article detail (catégorie/type/tranche/superficie/titre foncier/…)
  // for "Article(s) réservé(s)" — DossierDetailDto.articles is only the
  // summary shape (id/code/description/area/price), same gap as
  // NewDossier.tsx's own selectedArticleDetails fetch.
  const articleIds = (d?.articles ?? []).map((a) => a.id).join(',');
  const articleDetails = useApi(
    () => (d?.articles && d.articles.length > 0 ? Promise.all(d.articles.map((a) => getArticle(a.id))) : Promise.resolve([])),
    [articleIds],
  );
  const nextSteps = useApi(() => getEtapesSuivantes(id!), [id]);
  const montants = useApi(() => getMontantsDossier(id!), [id]);
  const [echeancesPage, setEcheancesPage] = useState(0);
  const echeances = useApi(() => listEcheances(id!, { page: echeancesPage, size: 20 }), [id, echeancesPage]);
  const pieces = useApi(() => listPiecesJointes(id!), [id]);
  const [addPieceOpen, setAddPieceOpen] = useState(false);
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
    <PageShell
      title={title}
      crumbs={[{ label: 'Dossiers', to: '/dossiers' }, { label: d.code || '' }]}
      icon={<Folder />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
    >
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate('/dossiers')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      {fromCreation && (
        <div className="mb-3 rounded-md border border-(--info-border) bg-(--info-bg) px-3.5 py-2.5 text-[13px] text-(--info)">
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
        {/* Static — pas encore relié à un vrai standard VOIP, juste
            l'affordance visuelle (voir instructions/from_front.md pour la
            demande d'intégration si/quand elle est priorisée). */}
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => showToast('Intégration VOIP à venir.')}>
          <Phone data-icon="inline-start" /> Appeler
        </Button>
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
          {d.prospectionId && <TabsTrigger value="prospection">Prospection</TabsTrigger>}
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
              <Card
                title="Client"
                accent="var(--sec-dossier)"
                action={
                  d.clientId && (
                    <Link to={`/clients/${d.clientId}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      Fiche complète <ArrowUpRight className="size-3" />
                    </Link>
                  )
                }
              >
                {linkedClient.loading && <LoadingState />}
                {linkedClient.error && <ErrorState message={linkedClient.error} />}
                <FieldGrid>
                  <Field label="Nom" value={d.clientNom} />
                  <Field label="Commercial" value={d.commercialNom} />
                  <Field label="Avocat" value={d.avocatNom} />
                  {linkedClient.data && (
                    <>
                      <Field label="Téléphone" value={linkedClient.data.telephone || linkedClient.data.mobile} />
                      <Field label="Email" value={linkedClient.data.email} />
                      <Field label="Ville" value={linkedClient.data.ville} />
                      <Field label="Adresse" value={linkedClient.data.adresse} />
                      <Field label="Type" value={linkedClient.data.type} />
                    </>
                  )}
                </FieldGrid>
              </Card>

              <Card title={`Article(s) réservé(s) (${d.articles?.length ?? 0})`}>
                {!d.articles || d.articles.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">Aucun article lié.</p>
                ) : articleDetails.loading ? (
                  <LoadingState />
                ) : articleDetails.error ? (
                  <ErrorState message={articleDetails.error} />
                ) : (
                  <div className="flex flex-col gap-2">
                    {(articleDetails.data ?? []).map((a) => (
                      <ArticleCompactPreview key={a.id} article={a} defaultExpanded />
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

        {d.prospectionId && (
          <TabsContent value="prospection">
            {/* Cascade reference to the originating Prospection — the
                pipeline-chain counterpart to Prospection's own "Prospect"
                tab (ProspectionDetail.tsx). */}
            <Card
              title="Prospection"
              accent="var(--sec-prospection)"
              action={
                <Link to={`/prospections/${d.prospectionId}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Fiche complète <ArrowUpRight className="size-3" />
                </Link>
              }
            >
              {linkedProspection.loading && <LoadingState />}
              {linkedProspection.error && <ErrorState message={linkedProspection.error} />}
              {linkedProspection.data && (
                <FieldGrid>
                  <Field label="Code" value={d.prospectionCode || linkedProspection.data.code} />
                  <Field
                    label="Étape"
                    value={
                      <Badge tone={etapeBadgeTone(linkedProspection.data.etape, linkedProspection.data.fermee)}>
                        {linkedProspection.data.fermee ? 'Clôturée' : linkedProspection.data.etape || '—'}
                      </Badge>
                    }
                  />
                  <Field label="Prospect" value={prospectionDisplayName(linkedProspection.data)} />
                  <Field label="Origine" value={linkedProspection.data.origine} />
                  <Field label="Commercial" value={linkedProspection.data.commercialNom} />
                  <Field label="Créée le" value={formatDate(linkedProspection.data.dateDocument)} />
                </FieldGrid>
              )}
            </Card>
          </TabsContent>
        )}

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
                      {montants.data.totalSoumisReglePrixTTC != null && (
                        <TableRow className="hover:bg-transparent">
                          <TableCell className="text-muted-foreground">Total soumis à règlement (TTC)</TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(montants.data.totalSoumisReglePrixTTC)}
                          </TableCell>
                        </TableRow>
                      )}
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
                <div className="-mx-3">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead />
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {echeances.data.content.map((l) => (
                        <EcheanceRow
                          key={l.id}
                          dossierId={d.id}
                          echeance={l}
                          onReglementAdded={async (echeanceId, body) => {
                            await addReglement(d.id, echeanceId, body);
                            await echeances.refetch();
                            await montants.refetch();
                          }}
                        />
                      ))}
                    </TableBody>
                  </Table>
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
          <Card title="Documents générés">
            <p className="mb-2.5 -mt-1 text-[12px] text-muted-foreground">
              Générés à la demande à partir des données du dossier — rien n'est enregistré ici.
            </p>
            <div className="flex flex-wrap gap-2">
              {GENERATED_DOC_KINDS.map((kind) => (
                <GeneratedDocumentChip key={kind} dossierId={d.id} code={d.code} kind={kind} onError={showToast} />
              ))}
            </div>
          </Card>
          <Card
            title={`Pièces jointes (${pieces.data?.length ?? 0})`}
            action={
              !addPieceOpen && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAddPieceOpen(true)}>
                  <Plus data-icon="inline-start" /> Ajouter une pièce jointe
                </Button>
              )
            }
          >
            {pieces.loading && <LoadingState />}
            {pieces.error && <ErrorState message={pieces.error} />}
            <AddPieceJointeRow
              dossierId={d.id}
              open={addPieceOpen}
              onOpenChange={setAddPieceOpen}
              onAdded={async () => {
                setAddPieceOpen(false);
                await pieces.refetch();
              }}
            />
            {pieces.data && pieces.data.length === 0 && !addPieceOpen && (
              <EmptyState title="Aucune pièce jointe" message="Aucun document n'a été attaché à ce dossier." />
            )}
            {pieces.data && pieces.data.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Fichier</TableHead>
                      <TableHead>Déposé par</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pieces.data.map((p) => (
                      <PieceJointeRow key={p.id} dossierId={d.id} piece={p} />
                    ))}
                  </TableBody>
                </Table>
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
