import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Ban, ChevronDown, ChevronRight, ClipboardCheck, Coins, Download, Eye, FileDown, FileSignature, FileStack, FileText, Folder, Landmark, Loader2, Paperclip, Phone, Plus, Receipt, Trash2, TrendingUp, Upload, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState, StatCard } from '../../components/ui';
import ArticleCompactPreview from '../../components/ArticleCompactPreview';
import DossierStatusStepper from '../../components/DossierStatusStepper';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import { TimelineList, TimelineRow } from '../../components/Timeline';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { referentielItems, useBanques, useCategoriesEcheance, useTypesPieceJointe, useTypesReglement } from '../../lib/referentiels';
import { formatCurrency, formatDate, formatDateTime, formatPercent, formatTelephone, toApiDateTime, todayISO } from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import {
  ECHEANCE_STATUT_LABELS,
  echeanceCategorieTone,
  echeanceStatut,
  echeanceStatutTone,
  etapeBadgeTone,
  pieceJointeTypeTone,
  prospectionDisplayName,
  reglementModifiable,
  reglementStatutLabel,
  reglementStatutTone,
} from '../../lib/domain';
import {
  ApiError,
  addEcheance,
  addReglement,
  listPayeurs,
  listReglementPiecesJointes,
  modifierStatutReglement,
  removeReglementPieceJointe,
  uploadReglementPieceJointe,
  openReglementPieceJointeFichier,
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
  downloadRecuReglement,
  getEtapesSuivantes,
  listHistoriqueDossier,
  listPiecesJointes,
  removePieceJointe,
  uploadPieceJointe,
  viewActeReservation,
  viewAutorisationVersement,
  viewFicheReservation,
  viewDossierPdfOnlyDocument,
  openPieceJointeFichier,
  viewRecuReglement,
  type DossierPdfOnlyDocKind,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useConfirm } from '../../lib/confirmContext';
import type { CreerEcheanceRequest, CreerReglementRequest, EcheanceDto, PieceJointeDto, ReglementDto } from '../../types';

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

function PieceJointeRow({
  dossierId,
  piece,
  onDeleted,
}: {
  dossierId: string;
  piece: PieceJointeDto;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const ext = piece.extension?.replace(/^\./, '') || '';
  const filename = `${piece.description || 'document'}${ext ? `.${ext}` : ''}`;

  // Une simple ouverture d'onglet : le fichier vit sur le stockage, pas
  // derrière un fetch. Rien d'asynchrone, donc pas d'état « en cours ».
  //
  // Une seule action, et pas la paire « Voir / Télécharger » : l'URL présignée
  // est servie en `Content-Disposition: inline` (cf. `docs/api-docsV4.json`).
  // Les PDF et images s'affichent donc dans l'onglet, et les types que le
  // navigateur ne sait pas rendre (.docx, .xlsx) se téléchargent seuls — un
  // bouton « Télécharger » ferait exactement la même chose en mentant.
  // Le différencier demanderait un paramètre `download` côté API.
  function handle() {
    setError(null);
    try {
      openPieceJointeFichier(dossierId, piece.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'opération.');
    }
  }

  // Suppression **logique** côté serveur : la pièce sort de la liste et son
  // fichier n'est plus servi, mais elle reste récupérable en base — jamais
  // via l'API. Irréversible du point de vue de l'utilisateur, donc
  // confirmation préalable, avec le même dialogue partagé que
  // l'annulation d'un règlement.
  async function handleDelete() {
    const ok = await confirm({
      title: 'Supprimer la pièce jointe',
      message: `Supprimer « ${filename} » du dossier ? Cette suppression est irréversible depuis l’application.`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await removePieceJointe(dossierId, piece.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression.");
    } finally {
      setBusy(false);
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
          {error && <span className="text-micro text-destructive">{error}</span>}
          <Button type="button" variant="ghost" size="sm" onClick={handle}>
            <Eye data-icon="inline-start" /> Ouvrir <ArrowUpRight data-icon="inline-end" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title="Supprimer la pièce jointe"
            aria-label={`Supprimer ${filename}`}
            disabled={busy}
            onClick={handleDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

type GeneratedDocKind = 'fiche-reservation' | 'acte-reservation' | DossierPdfOnlyDocKind;

const GENERATED_DOC_HANDLERS: Record<GeneratedDocKind, {
  title: string;
  /** One line saying what the document actually contains — condensed from
   * each endpoint's own `description` in docs/api-docsV4.json, not invented
   * here. Without it the card is six near-identical titles ("Fiche
   * bancaire" vs "Fiche trop perçu" tells a new user nothing), which is the
   * whole reason this section reads as a wall of chips. */
  description: string;
  /** Per-document glyph — the documents differ in kind (contrat, checklist
   * d'inspection, dossier de crédit, reçu), and a distinct icon per kind is
   * what makes the grid scannable at a glance instead of six identical
   * sheets of paper. */
  Icon: LucideIcon;
  /** Whether the backend also offers a `docx` variant — drives whether the
   * card shows a split "PDF / Word" pair or a single "Télécharger" button.
   * `fiche-bancaire` is explicitly PDF-only per the API description ("pas
   * de variante Word pour ce document"); same for the other two new docs. */
  hasDocx: boolean;
  view: (dossierId: string, format: 'pdf' | 'docx') => Promise<void>;
  download: (dossierId: string, filename: string, format: 'pdf' | 'docx') => Promise<void>;
}> = {
  'fiche-reservation': {
    title: 'Fiche de réservation',
    description: 'Fiche récapitulative de la réservation du bien.',
    Icon: FileText,
    hasDocx: true,
    view: viewFicheReservation,
    download: downloadFicheReservation,
  },
  'acte-reservation': {
    title: 'Acte de réservation',
    description: 'Contrat de réservation : clauses et engagements des parties.',
    Icon: FileSignature,
    hasDocx: true,
    view: viewActeReservation,
    download: downloadActeReservation,
  },
  'fiche-visite-technique': {
    title: 'Fiche visite technique',
    description: "Checklist d'inspection avant livraison, avec clause de contact SAV.",
    Icon: ClipboardCheck,
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-visite-technique'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-visite-technique', filename),
  },
  'fiche-dossier-vente': {
    title: 'Fiche dossier de vente',
    description: 'Récapitulatif interne complet : montants, financement, acquéreurs, historique.',
    Icon: FileStack,
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-dossier-vente'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-dossier-vente', filename),
  },
  'fiche-bancaire': {
    title: 'Fiche bancaire',
    description: 'Support de demande de crédit : état civil, bien, prix et reliquat.',
    Icon: Landmark,
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-bancaire'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-bancaire', filename),
  },
  'fiche-trop-percu': {
    title: 'Fiche trop perçu',
    description: 'Reçu du trop-perçu lorsque les versements dépassent le prix du dossier.',
    Icon: Receipt,
    hasDocx: false,
    view: (dossierId) => viewDossierPdfOnlyDocument(dossierId, 'fiche-trop-percu'),
    download: (dossierId, filename) => downloadDossierPdfOnlyDocument(dossierId, 'fiche-trop-percu', filename),
  },
};

/** One tile per generated document. These 6 kinds aren't a saved list
 * (nothing here persists, no count that grows), just a fixed set of
 * on-demand generators — so they're a *menu of actions*, not data rows, and
 * they get a card grid rather than a table.
 *
 * Replaces the previous single wrapped row of chips, which had three
 * problems the tile fixes: (1) a chip is this app's visual language for a
 * passive status label (`Badge`), so the tab's primary actions read as
 * metadata; (2) title-only chips carry no information scent — hence the
 * `description` line, condensed from each endpoint's own API description;
 * (3) the actions were 2–3 adjacent 24px icon-only ghost buttons whose
 * glyphs (eye / download / file-down) are near-indistinguishable at that
 * size and are below a comfortable touch target — now a labelled "Aperçu"
 * primary plus a labelled download, with the PDF-vs-Word choice moved into
 * an explicit menu instead of two look-alike icons sitting side by side.
 *
 * Errors now render inline in the tile instead of going to the page toast:
 * the old chip genuinely had no room for a message, this does, and an error
 * pinned to the document that failed beats a floating toast that doesn't
 * say which of the six it was. */
function GeneratedDocumentCard({
  dossierId,
  code,
  kind,
}: {
  dossierId: string;
  code?: string | null;
  kind: GeneratedDocKind;
}) {
  const [busy, setBusy] = useState<'view' | 'pdf' | 'docx' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { title, description, Icon, hasDocx, view, download } = GENERATED_DOC_HANDLERS[kind];
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

  const downloading = busy === 'pdf' || busy === 'docx';

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card transition-[border-color,box-shadow,transform] hover:border-(--brand-border) sm:hover:-translate-y-px sm:hover:shadow-sm">
      <div className="flex flex-1 items-start gap-2.5 p-2.5">
        <span
          aria-hidden
          className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--brand-bg) text-(--brand) transition-colors group-hover:bg-(--brand)/12"
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-label leading-snug font-medium text-foreground">{title}</span>
            <span className="mt-px shrink-0 rounded bg-muted px-1.5 py-0.5 text-micro font-medium tracking-wide text-muted-foreground uppercase">
              {hasDocx ? 'PDF · Word' : 'PDF'}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-micro leading-[1.45] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-border px-2.5 py-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1 sm:h-7 sm:flex-none"
          disabled={!!busy}
          onClick={() => handle('view')}
        >
          {busy === 'view' ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Eye data-icon="inline-start" />}
          {busy === 'view' ? 'Génération…' : 'Aperçu'}
        </Button>
        {hasDocx ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button type="button" variant="ghost" size="sm" className="h-9 flex-1 sm:h-7 sm:flex-none" disabled={!!busy} />}
            >
              {downloading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Download data-icon="inline-start" />}
              Télécharger
              <ChevronDown data-icon="inline-end" className="text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handle('pdf')}>
                <Download /> PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handle('docx')}>
                <FileDown /> Word
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 flex-1 sm:h-7 sm:flex-none"
            disabled={!!busy}
            onClick={() => handle('pdf')}
          >
            {downloading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Download data-icon="inline-start" />}
            Télécharger
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="border-t border-destructive/25 bg-destructive/10 px-2.5 py-1 text-micro text-destructive">
          {error}
        </p>
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
      <label className="flex h-8 min-w-0 max-w-70 flex-1 cursor-pointer items-center gap-2 truncate rounded-md border border-dashed border-input px-2.5 text-body text-muted-foreground hover:border-ring">
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
      {error && <span className="text-micro text-destructive">{error}</span>}
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
 * a type with `banqueObligatoire` is picked, per `TypeReglementDto`, and
 * `reference` only once a type with `referenceObligatoire` is picked — les
 * deux sont désormais réellement appliqués côté serveur (400 sinon).
 *
 * La saisie est maintenant complète et obligatoire : `montant`,
 * `dateEcheance`, `typeId` et `payeurId`. `payeurId` a enfin une source —
 * `GET /api/dossiers/{id}/payeurs` (acquéreur principal + co-acquéreurs) —
 * là où il était auparavant simplement omis faute de sélecteur de tiers.
 * Limite connue : cette liste est *indicative et non fermée* côté serveur (un
 * tiers payeur extérieur au dossier est accepté, 2 règlements réels sur 654),
 * mais l'app n'a pas de recherche de tiers, donc ces cas ne sont pas
 * saisissables ici.
 *
 * Il n'y a **pas** de champ « date de règlement effectif » : la fournir à la
 * création vaut 400. Elle se saisit au pointage (`PointerReglementModal`),
 * qui exige d'abord une preuve de paiement. */
function AddReglementRow({
  dossierId,
  echeanceId,
  reste,
  onAdd,
}: {
  dossierId: string;
  echeanceId: string;
  reste: number | undefined;
  onAdd: (echeanceId: string, body: CreerReglementRequest) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [montant, setMontant] = useState('');
  const [dateEcheance, setDateEcheance] = useState(todayISO());
  const [typeId, setTypeId] = useState<string | null>(null);
  const [banqueId, setBanqueId] = useState<string | null>(null);
  const [payeurId, setPayeurId] = useState<string | null>(null);
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typesReglement = useTypesReglement();
  const banques = useBanques();
  // Une instance d'`AddReglementRow` existe par ligne d'échéance, donc ce hook
  // part autant de fois qu'il y a d'échéances affichées — mais toutes visent
  // la même URL, et le cache GET de `request()` (30 s, avec déduplication des
  // requêtes en vol) les réduit à un seul appel réseau. Pas de remontée dans
  // le composant parent : les payeurs ne servent qu'à ce formulaire.
  const payeurs = useApi(() => listPayeurs(dossierId), [dossierId]);
  const typesReglementItems = typesReglement.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const banquesItems = referentielItems(banques.data);
  const payeursItems = (payeurs.data ?? []).map((p) => ({
    label: [p.nom || p.id, p.pieceIdentite].filter(Boolean).join(' · '),
    value: p.id,
  }));
  const aucunPayeur = !!payeurs.data && payeurs.data.length === 0;
  const selectedType = typesReglement.data.find((t) => t.id === typeId);
  const banqueRequired = selectedType?.banqueObligatoire ?? false;
  const referenceRequired = selectedType?.referenceObligatoire ?? false;

  // Le serveur refuse un montant nul/négatif ou supérieur au reste à payer de
  // l'échéance. On le dit avant l'aller-retour plutôt que de traduire un 400.
  const montantNumber = montant.trim() === '' ? null : Number(montant);
  const montantInvalide = montantNumber !== null && (Number.isNaN(montantNumber) || montantNumber <= 0);
  const montantDepasse = montantNumber !== null && reste !== undefined && montantNumber > reste;

  function reset() {
    setOpen(false);
    setMontant('');
    setDateEcheance(todayISO());
    setTypeId(null);
    setBanqueId(null);
    setPayeurId(null);
    setReference('');
    setError(null);
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
          if (!typeId || !payeurId || montantNumber === null) return;
          setBusy(true);
          setError(null);
          try {
            await onAdd(echeanceId, {
              montant: montantNumber,
              dateEcheance: toApiDateTime(dateEcheance) ?? null,
              typeId,
              payeurId,
              banqueId: banqueRequired ? banqueId || undefined : undefined,
              reference: reference || undefined,
            });
            reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="reg-montant">Montant</FieldLabel>
            <Input id="reg-montant" type="number" min={0} step="0.01" value={montant} onChange={(e) => setMontant(e.target.value)} />
            {montantInvalide ? (
              <p className="mt-1 text-micro text-destructive">Le montant doit être strictement positif.</p>
            ) : montantDepasse ? (
              <p className="mt-1 text-micro text-destructive">
                Dépasse le reste à régler sur cette échéance ({formatCurrency(reste)}).
              </p>
            ) : reste !== undefined ? (
              <p className="mt-1 text-micro text-muted-foreground">Reste à régler : {formatCurrency(reste)}</p>
            ) : null}
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reg-date-echeance">Date d'échéance</FieldLabel>
            <Input id="reg-date-echeance" type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reg-payeur">Réglé par</FieldLabel>
            <Select items={payeursItems} value={payeurId} onValueChange={(v) => setPayeurId(v as string | null)} disabled={aucunPayeur}>
              <SelectTrigger id="reg-payeur" className="w-full">
                <SelectValue placeholder={payeurs.loading ? 'Chargement…' : aucunPayeur ? 'Aucun acquéreur rattaché' : 'Acquéreur ou co-acquéreur'} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {payeursItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {aucunPayeur && (
              <p className="mt-1 text-micro text-destructive">
                Ce dossier n'a aucun acquéreur rattaché : impossible d'enregistrer un règlement.
              </p>
            )}
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
          {referenceRequired && (
            <FormField>
              <FieldLabel htmlFor="reg-reference">Référence (n° de chèque…)</FieldLabel>
              <Input id="reg-reference" value={reference} onChange={(e) => setReference(e.target.value)} required />
            </FormField>
          )}
        </FieldGroup>
        {error && <p className="mt-3 text-micro text-destructive">{error}</p>}
        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={reset}>Annuler</Button>
          <Button
            type="submit"
            disabled={
              busy ||
              montantNumber === null ||
              montantInvalide ||
              montantDepasse ||
              !typeId ||
              !payeurId ||
              (banqueRequired && !banqueId) ||
              (referenceRequired && !reference)
            }
          >
            Ok
          </Button>
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
      {error && <span className="text-micro text-destructive">{error}</span>}
      <Button type="button" variant="ghost" size="icon-xs" title="Voir le reçu" disabled={!!busy} onClick={() => handle('view')}>
        <Eye />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Télécharger le reçu" disabled={!!busy} onClick={() => handle('download')}>
        <Download />
      </Button>
    </span>
  );
}

/** `GET /api/dossiers/{id}/reglements/{reglementId}/documents/autorisation-versement`
 * — one PDF-only "Autorisation d'Encaissement" per règlement, sitting beside
 * `ReglementRecuButton` above and keyed off the same `reglementId`: the
 * compte destinataire / mode de versement / tiers payeur the document is
 * built from live on the règlement, not on the échéance. Same icon-only
 * view/download pattern. */
function AutorisationVersementButton({ dossierId, reglementId }: { dossierId: string; reglementId: string }) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(action: 'view' | 'download') {
    setBusy(action);
    setError(null);
    try {
      if (action === 'view') await viewAutorisationVersement(dossierId, reglementId);
      else await downloadAutorisationVersement(dossierId, reglementId, `autorisation-versement-${reglementId}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {error && <span className="text-micro text-destructive">{error}</span>}
      <Button type="button" variant="ghost" size="icon-xs" title="Voir l'autorisation d'encaissement" disabled={!!busy} onClick={() => handle('view')}>
        <Eye />
      </Button>
      <Button type="button" variant="ghost" size="icon-xs" title="Télécharger l'autorisation d'encaissement" disabled={!!busy} onClick={() => handle('download')}>
        <Download />
      </Button>
    </span>
  );
}

// Le fond de la ligne suit le statut du règlement au lieu d'être vert en dur :
// un règlement `IN_WORK` n'est pas encore un encaissement, et un `CANCELED` ne
// doit surtout pas se lire comme un succès. Le vert est conservé pour
// `POINTED`, donc rien ne change visuellement sur les règlements déjà pointés.
const REGLEMENT_ROW_TONE: Record<string, { wrap: string; montant: string }> = {
  success: { wrap: 'border-(--success-border) bg-(--success-bg)', montant: 'text-(--success)' },
  info: { wrap: 'border-(--info-border) bg-(--info-bg)', montant: 'text-foreground' },
  neutral: { wrap: 'border-border bg-muted/30', montant: 'text-muted-foreground line-through' },
};

/** Dépôt d'une preuve de paiement sur un règlement — même coquille que
 * `AddPieceJointeRow` (input fichier masqué derrière un label pointillé),
 * en plus compact : ni type ni description obligatoires, les justificatifs
 * réels n'en portent pas. Partagé par le panneau « Preuves de paiement » et
 * la boîte de pointage, pour que déposer une preuve se fasse au même endroit
 * qu'on l'exige. */
function ReglementPieceUpload({
  dossierId,
  reglementId,
  onAdded,
}: {
  dossierId: string;
  reglementId: string;
  onAdded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex h-8 min-w-0 max-w-60 flex-1 cursor-pointer items-center gap-2 truncate rounded-md border border-dashed border-input px-2.5 text-body text-muted-foreground hover:border-ring">
        <Upload className="size-3.5 shrink-0" />
        <span className="truncate">{file ? file.name : 'Choisir un fichier…'}</span>
        <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      <Input
        placeholder="Légende (ex. Chèque BMCE n° 123)"
        className="w-55"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button
        type="button"
        size="sm"
        disabled={busy || !file}
        onClick={async () => {
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            await uploadReglementPieceJointe(dossierId, reglementId, file, description.trim() || undefined);
            setFile(null);
            setDescription('');
            onAdded();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Échec de l'envoi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Envoi…' : 'Déposer'}
      </Button>
      {error && <span className="text-micro text-destructive">{error}</span>}
    </div>
  );
}

/** Les justificatifs d'encaissement d'un règlement (chèque scanné, avis de
 * virement, reçu). Toujours consultable, quel que soit le statut : les
 * règlements legacy pointés sans pièce jointe restent parfaitement valides —
 * la règle de preuve ne s'applique qu'au moment de la transition. */
function ReglementPiecesJointesPanel({
  dossierId,
  reglementId,
  statut,
  refreshKey,
  onChanged,
}: {
  dossierId: string;
  reglementId: string;
  /** Optionnel comme sur ReglementDto : une ligne legacy peut ne pas en porter. */
  statut?: string;
  refreshKey: number;
  onChanged: () => void;
}) {
  const pieces = useApi(() => listReglementPiecesJointes(dossierId, reglementId), [dossierId, reglementId, refreshKey]);

  // Miroir exact du garde-fou de `PointerReglementModal` : plutôt que d'envoyer
  // la requête pour en récolter un 409, on désactive la suppression dans le seul
  // cas où le serveur la refuse — la dernière preuve d'un règlement pointé. Pour
  // la remplacer : déposer la nouvelle d'abord, supprimer l'ancienne ensuite.
  const dernierePreuveVerrouillee = statut === 'POINTED' && pieces.data?.length === 1;
  const raisonBlocage = dernierePreuveVerrouillee
    ? 'Un règlement pointé ne peut pas perdre sa dernière preuve de paiement. Déposez la nouvelle avant de supprimer celle-ci.'
    : undefined;

  return (
    <div className="mt-1.5 flex flex-col gap-2 rounded-md border border-border bg-background/60 px-2.5 py-2">
      <span className="text-micro font-medium text-muted-foreground">Preuves de paiement</span>
      {pieces.loading && <span className="text-micro text-muted-foreground">Chargement…</span>}
      {pieces.error && <span className="text-micro text-destructive">{pieces.error}</span>}
      {pieces.data && pieces.data.length === 0 && (
        <span className="text-micro text-muted-foreground">Aucune preuve déposée.</span>
      )}
      {pieces.data?.map((p) => (
        <ReglementPieceJointeRow
          key={p.id}
          dossierId={dossierId}
          reglementId={reglementId}
          piece={p}
          onDeleted={onChanged}
          raisonBlocage={raisonBlocage}
        />
      ))}
      <ReglementPieceUpload dossierId={dossierId} reglementId={reglementId} onAdded={onChanged} />
    </div>
  );
}

function ReglementPieceJointeRow({
  dossierId,
  reglementId,
  piece,
  onDeleted,
  raisonBlocage,
}: {
  dossierId: string;
  reglementId: string;
  piece: PieceJointeDto;
  onDeleted: () => void;
  /** Renseignée quand la suppression est interdite : sert de motif affiché et
   * désactive le bouton. Le parent décide, la ligne se contente d'obéir. */
  raisonBlocage?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const ext = piece.extension?.replace(/^\./, '') || '';
  const filename = `${piece.description || 'preuve-paiement'}${ext ? `.${ext}` : ''}`;

  // Cf. PieceJointeRow : navigation vers le stockage, rien d'asynchrone.
  function handle() {
    setError(null);
    try {
      openReglementPieceJointeFichier(dossierId, reglementId, piece.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    }
  }

  // Le garde-fou `raisonBlocage` désactive déjà le bouton dans le cas connu
  // (dernière preuve d'un règlement pointé) ; le 409 reste rattrapé ici pour
  // les courses et les lignes rafraîchies entre-temps. Son `detail` est déjà
  // porté par `ApiError.message`, on le montre tel quel.
  async function handleDelete() {
    const ok = await confirm({
      title: 'Supprimer la preuve de paiement',
      message: `Supprimer « ${piece.description || filename} » ? Cette suppression est irréversible depuis l’application.`,
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler',
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await removeReglementPieceJointe(dossierId, reglementId, piece.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2 text-micro">
      <FileText className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate text-foreground">{piece.description || filename}</span>
      {piece.dateCreation && <span className="shrink-0 text-muted-foreground">{formatDate(piece.dateCreation)}</span>}
      {piece.creePar && <span className="shrink-0 text-muted-foreground">{piece.creePar}</span>}
      {error && <span className="shrink-0 text-destructive">{error}</span>}
      <span className="ml-auto flex shrink-0 items-center gap-0.5">
        <Button type="button" variant="ghost" size="icon-xs" title="Ouvrir la preuve dans un onglet" onClick={handle}>
          <Eye />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title={raisonBlocage ?? 'Supprimer la preuve de paiement'}
          aria-label="Supprimer la preuve de paiement"
          disabled={busy || !!raisonBlocage}
          onClick={handleDelete}
        >
          <Trash2 />
        </Button>
      </span>
    </div>
  );
}

/** Pointage d'un règlement : `IN_WORK → POINTED`.
 *
 * Deux règles serveur, toutes deux exposées ici plutôt que subies :
 * `dateReglement` est obligatoire (400 sinon), et le règlement doit porter au
 * moins une pièce jointe (409 sinon). Plutôt que d'envoyer la requête pour en
 * récolter un 409, on lit d'abord les pièces jointes et on propose le dépôt
 * dans la boîte elle-même — c'est exactement la séquence décrite par la spec
 * (créer → déposer la preuve → pointer). Le 409 reste géré en dernier recours
 * (course, ou ligne legacy), en affichant les `transitionsAutorisees` du
 * ProblemDetail quand le serveur en fournit. */
function PointerReglementModal({
  dossierId,
  reglement,
  onClose,
  onPointed,
}: {
  dossierId: string;
  reglement: ReglementDto;
  onClose: () => void;
  onPointed: () => Promise<void>;
}) {
  const [dateReglement, setDateReglement] = useState(todayISO());
  const [piecesVersion, setPiecesVersion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pieces = useApi(() => listReglementPiecesJointes(dossierId, reglement.id), [dossierId, reglement.id, piecesVersion]);
  const sansPreuve = !!pieces.data && pieces.data.length === 0;

  return (
    <Modal title="Pointer le règlement" onClose={onClose} width={480}>
      <div className="flex flex-col gap-4">
        <p className="text-body text-muted-foreground">
          Constater l'encaissement de <span className="font-semibold text-foreground">{formatCurrency(reglement.montant)}</span>
          {reglement.typeLibelle ? ` (${reglement.typeLibelle})` : ''}
          {reglement.payeurNom ? `, réglé par ${reglement.payeurNom}` : ''}. Le règlement passera à
          « Pointé », un état définitif.
        </p>

        <FieldGroup>
          <FormField>
            <FieldLabel htmlFor="pointage-date">Date d'encaissement</FieldLabel>
            <Input
              id="pointage-date"
              type="date"
              value={dateReglement}
              onChange={(e) => setDateReglement(e.target.value)}
            />
          </FormField>
        </FieldGroup>

        <div className="flex flex-col gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-2">
          <span className="text-micro font-medium text-muted-foreground">Preuve de paiement</span>
          {pieces.loading && <span className="text-micro text-muted-foreground">Chargement…</span>}
          {pieces.error && <span className="text-micro text-destructive">{pieces.error}</span>}
          {sansPreuve && (
            <span className="text-micro text-(--amber)">
              Déposez d'abord une preuve de paiement (chèque scanné, avis de virement…) : elle est
              obligatoire pour pointer.
            </span>
          )}
          {pieces.data?.map((p) => (
            <ReglementPieceJointeRow
              key={p.id}
              dossierId={dossierId}
              reglementId={reglement.id}
              piece={p}
              onDeleted={() => setPiecesVersion((v) => v + 1)}
            />
          ))}
          <ReglementPieceUpload
            dossierId={dossierId}
            reglementId={reglement.id}
            onAdded={() => setPiecesVersion((v) => v + 1)}
          />
        </div>

        {error && <p className="text-micro text-destructive">{error}</p>}
      </div>
      <DialogFooter className="mt-5">
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>Annuler</Button>
        <Button
          type="button"
          disabled={busy || !dateReglement || sansPreuve || pieces.loading}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await modifierStatutReglement(dossierId, reglement.id, {
                statut: 'POINTED',
                dateReglement: toApiDateTime(dateReglement) ?? null,
              });
              await onPointed();
              onClose();
            } catch (err) {
              setError(messageErreurStatut(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <ClipboardCheck data-icon="inline-start" /> Pointer
        </Button>
      </DialogFooter>
    </Modal>
  );
}

/** Un 409 sur un changement de statut porte `transitionsAutorisees` à côté du
 * `detail` — les afficher évite le classique « ça a échoué » sans issue.
 * `ApiError.problem` est le corps ProblemDetail parsé (voir lib/api.ts). */
function messageErreurStatut(err: unknown): string {
  const base = err instanceof Error ? err.message : "Échec de l'opération.";
  if (!(err instanceof ApiError) || err.status !== 409) return base;
  const permises = err.problem?.transitionsAutorisees;
  if (!Array.isArray(permises) || permises.length === 0) return base;
  const libelles = permises.map((t) => reglementStatutLabel(String(t))).join(', ');
  return `${base} Transitions possibles : ${libelles}.`;
}

/** Une ligne de règlement dans le détail d'une échéance. Porte son statut,
 * ses preuves de paiement (repliées par défaut) et, tant qu'il est `IN_WORK`,
 * les deux actions terminales : pointer ou annuler. */
function ReglementRow({
  dossierId,
  reglement,
  onChanged,
}: {
  dossierId: string;
  reglement: ReglementDto;
  onChanged: () => Promise<void>;
}) {
  const [piecesOuvertes, setPiecesOuvertes] = useState(false);
  const [piecesVersion, setPiecesVersion] = useState(0);
  const [pointageOuvert, setPointageOuvert] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  const tone = reglementStatutTone(reglement.statut);
  const rowTone = REGLEMENT_ROW_TONE[tone] ?? REGLEMENT_ROW_TONE.neutral;
  const modifiable = reglementModifiable(reglement.statut);

  async function annuler() {
    const ok = await confirm({
      title: 'Annuler le règlement',
      message: `Annuler définitivement ce règlement de ${formatCurrency(reglement.montant)} ? Cet état est terminal : il ne pourra plus être pointé.`,
      confirmLabel: 'Annuler le règlement',
      cancelLabel: 'Revenir',
    });
    if (!ok) return;
    setBusy(true);
    setError(null);
    try {
      await modifierStatutReglement(dossierId, reglement.id, { statut: 'CANCELED' });
      await onChanged();
    } catch (err) {
      setError(messageErreurStatut(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-md border px-2.5 py-1.5 text-body ${rowTone.wrap}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <Badge tone={tone}>{reglementStatutLabel(reglement.statut)}</Badge>
        <span className="font-medium text-foreground">{reglement.typeLibelle || '—'}</span>
        {reglement.banqueNom && <span className="text-muted-foreground">{reglement.banqueNom}</span>}
        {reglement.reference && <span className="text-muted-foreground">Réf. {reglement.reference}</span>}
        {reglement.payeurNom && <span className="text-muted-foreground">Payeur : {reglement.payeurNom}</span>}
        <span className="text-muted-foreground">
          Échéance {formatDate(reglement.dateEcheance)}
          {reglement.dateReglement ? ` · Encaissé le ${formatDate(reglement.dateReglement)}` : ''}
        </span>
        {reglement.notes && <span className="text-muted-foreground italic">{reglement.notes}</span>}
        <span className={`ml-auto font-semibold tabular-nums ${rowTone.montant}`}>{formatCurrency(reglement.montant)}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          title="Preuves de paiement"
          aria-expanded={piecesOuvertes}
          onClick={() => setPiecesOuvertes((o) => !o)}
        >
          <Paperclip />
        </Button>
        <ReglementRecuButton dossierId={dossierId} reglementId={reglement.id} />
        <AutorisationVersementButton dossierId={dossierId} reglementId={reglement.id} />
        {modifiable && (
          <>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => setPointageOuvert(true)}>
              <ClipboardCheck data-icon="inline-start" /> Pointer
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={annuler}>
              <Ban data-icon="inline-start" /> Annuler
            </Button>
          </>
        )}
      </div>
      {error && <p className="mt-1 text-micro text-destructive">{error}</p>}
      {piecesOuvertes && (
        <ReglementPiecesJointesPanel
          dossierId={dossierId}
          reglementId={reglement.id}
          statut={reglement.statut}
          refreshKey={piecesVersion}
          onChanged={() => setPiecesVersion((v) => v + 1)}
        />
      )}
      {pointageOuvert && (
        <PointerReglementModal
          dossierId={dossierId}
          reglement={reglement}
          onClose={() => setPointageOuvert(false)}
          onPointed={onChanged}
        />
      )}
    </div>
  );
}

/** `GET .../echeancier/{echeanceId}/reglements` — détail ligne par ligne
 * derrière le seul total `montantRegle`/`reste` de l'échéance, rendu dans la
 * ligne dépliée d'`EcheanceRow`. `refreshKey` force un refetch quand un
 * nouveau règlement vient d'être ajouté pendant que la ligne est dépliée. */
function EcheanceReglementsHistory({
  dossierId,
  echeanceId,
  refreshKey,
  onChanged,
}: {
  dossierId: string;
  echeanceId: string;
  refreshKey: number;
  onChanged: () => Promise<void>;
}) {
  const { data, loading, error } = useApi(() => listEcheanceReglements(dossierId, echeanceId), [dossierId, echeanceId, refreshKey]);

  if (loading) return <span className="text-body text-muted-foreground">Chargement…</span>;
  if (error) return <span className="text-body text-destructive">{error}</span>;
  if (data && data.length === 0) return <span className="text-body text-muted-foreground">Aucun règlement enregistré.</span>;

  return (
    <div className="flex flex-col gap-1">
      {data?.map((r) => (
        <ReglementRow key={r.id} dossierId={dossierId} reglement={r} onChanged={onChanged} />
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
  onReglementChanged,
}: {
  dossierId: string;
  echeance: EcheanceDto;
  onReglementAdded: (echeanceId: string, body: CreerReglementRequest) => Promise<void>;
  onReglementChanged: () => Promise<void>;
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
              <span className="text-micro text-muted-foreground">
                Réglé {formatCurrency(echeance.montantRegle)}{echeance.reste ? ` · Reste ${formatCurrency(echeance.reste)}` : ''}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <AddReglementRow
              dossierId={dossierId}
              echeanceId={echeance.id}
              reste={echeance.reste}
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
            <EcheanceReglementsHistory
              dossierId={dossierId}
              echeanceId={echeance.id}
              refreshKey={reglementsVersion}
              onChanged={async () => {
                // Pointer ou annuler change le montant réglé de l'échéance et
                // les totaux du dossier : on rafraîchit la ligne ET le reste,
                // comme après l'ajout d'un règlement.
                setReglementsVersion((v) => v + 1);
                await onReglementChanged();
              }}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function DossierDetail() {
  const { id } = useParams();
  const { data: d, loading, error, refetch } = useApi(() => getDossier(id!), [id], 'dossier');
  // Cascade reference up to the originating Prospection — same
  // reference-the-previous-pipeline-stage convention as Prospection's own
  // "Prospect" tab. `prospectionId` isn't in the API yet (see the field's
  // comment in types.ts); this stays dormant (tab hidden) until it is.
  const linkedProspection = useApi(() => (d?.prospectionId ? getProspection(d.prospectionId) : Promise.resolve(null)), [d?.prospectionId], 'dossier-prospection');
  // Full contact details for the "Client" card — DossierDetailDto only
  // carries clientId/clientNom, same reason the Prospection/Prospect
  // cascade tabs needed their own fetch.
  const linkedClient = useApi(() => (d?.clientId ? getClient(d.clientId) : Promise.resolve(null)), [d?.clientId], 'dossier-client');
  // Full article detail (catégorie/type/tranche/superficie/titre foncier/…)
  // for "Article(s) réservé(s)" — DossierDetailDto.articles is only the
  // summary shape (id/code/description/area/price), same gap as
  // NewDossier.tsx's own selectedArticleDetails fetch.
  const articleIds = (d?.articles ?? []).map((a) => a.id).join(',');
  const articleDetails = useApi(
    () => (d?.articles && d.articles.length > 0 ? Promise.all(d.articles.map((a) => getArticle(a.id))) : Promise.resolve([])),
    [articleIds],
    'dossier-articles',
  );
  const nextSteps = useApi(() => getEtapesSuivantes(id!), [id], 'dossier-etapes');
  const montants = useApi(() => getMontantsDossier(id!), [id], 'dossier-montants');
  const [echeancesPage, setEcheancesPage] = useState(0);
  const echeances = useApi(() => listEcheances(id!, { page: echeancesPage, size: 20 }), [id, echeancesPage], 'dossier-echeances');
  const pieces = useApi(() => listPiecesJointes(id!), [id], 'dossier-pieces');
  const [addPieceOpen, setAddPieceOpen] = useState(false);
  const [historiquePage, setHistoriquePage] = useState(0);
  const historique = useApi(() => listHistoriqueDossier(id!, { page: historiquePage, size: 20 }), [id, historiquePage], 'dossier-historique');
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

  // `!d` : avec une valeur en cache (cf. `useApi(..., 'dossier')`), on repeint
  // le dossier connu et la revalidation se fait en fond, sans écran de chargement.
  if (loading && !d) return <PageShell title="Dossier de vente"><LoadingState /></PageShell>;
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
        <div className="mb-3 rounded-md border border-(--info-border) bg-(--info-bg) px-3.5 py-2.5 text-label text-(--info)">
          Dossier créé. Le schéma de financement est vide — l'API ne permet pas de le pré-remplir à la création, complétez-le
          ci-dessous avec le formulaire « Ajouter une échéance » (déjà pré-rempli avec le total à payer).
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-hero font-semibold tracking-tight text-foreground">{title}</h2>
            <Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-label text-muted-foreground">
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
                {linkedClient.loading && !linkedClient.data && <LoadingState />}
                {linkedClient.error && <ErrorState message={linkedClient.error} />}
                <FieldGrid>
                  <Field label="Nom" value={d.clientNom} />
                  <Field label="Commercial" value={d.commercialNom} />
                  <Field label="Avocat" value={d.avocatNom} />
                  {linkedClient.data && (
                    <>
                      <Field
                        label="Téléphone"
                        value={
                          linkedClient.data.telephone
                            ? formatTelephone(linkedClient.data.telephone, linkedClient.data.indicatifTelephone)
                            : formatTelephone(linkedClient.data.mobile, linkedClient.data.indicatifMobile)
                        }
                      />
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
                  <p className="text-label text-muted-foreground">Aucun article lié.</p>
                ) : articleDetails.loading && !articleDetails.data ? (
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
                <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-label leading-relaxed text-foreground">
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
              {linkedProspection.loading && !linkedProspection.data && <LoadingState />}
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
                        <TableCell className="text-right text-title font-semibold tabular-nums text-foreground">
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
              {echeances.loading && !echeances.data && <LoadingState />}
              {echeances.error && <ErrorState message={echeances.error} />}
              {echeances.data && echeances.data.content.length === 0 && (
                <p className="text-label text-muted-foreground">Aucune ligne dans le schéma de financement pour ce dossier.</p>
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
                          onReglementChanged={async () => {
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
            <p className="mb-2.5 -mt-1 text-body text-muted-foreground">
              Générés à la demande à partir des données du dossier — rien n'est enregistré ici.
            </p>
            {/* 1 col on mobile (full-width tiles, 36px targets), 2 on tablet,
                3 on wide desktop — 6 documents land as an even 2 rows. */}
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {GENERATED_DOC_KINDS.map((kind) => (
                <GeneratedDocumentCard key={kind} dossierId={d.id} code={d.code} kind={kind} />
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
            {pieces.loading && !pieces.data && <LoadingState />}
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
                      <PieceJointeRow key={p.id} dossierId={d.id} piece={p} onDeleted={pieces.refetch} />
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
            {historique.loading && !historique.data && <LoadingState />}
            {historique.error && <ErrorState message={historique.error} />}
            {historique.data && historique.data.content.length === 0 && (
              <EmptyState title="Aucun historique" message="Aucun événement n'a encore été enregistré pour ce dossier." />
            )}
            {historique.data && historique.data.content.length > 0 && (
              <TimelineList>
                {historique.data.content.map((h, i) => (
                  <TimelineRow
                    key={`${h.date}-${i}`}
                    dernier={i === historique.data!.content.length - 1}
                    titre={h.type || 'Événement'}
                    meta={`${formatDateTime(h.date)} · ${h.utilisateur || 'Système'}`}
                    note={h.description}
                  />
                ))}
              </TimelineList>
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
        <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-lg bg-foreground px-4.5 py-3 text-label font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </PageShell>
  );
}
