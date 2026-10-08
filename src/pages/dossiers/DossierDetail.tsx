import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Ban, ChevronDown, ChevronRight, ClipboardCheck, Download, Eye, FileDown, FileSignature, FileStack, FileText, Folder, Landmark, Loader2, Paperclip, Phone, Plus, Receipt, Trash2, Upload } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import CadreFiche, { EnteteFiche, type VarianteFiche } from '../../components/CadreFiche';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import ArticleCompactPreview from '../../components/ArticleCompactPreview';
import FicheShell, { LigneActivite, OngletsLigne } from '../../components/FicheShell';
import SyntheseMontants from '../../components/SyntheseMontants';
import { ChampLecture, GrilleFiche, PiedFiche } from '../../components/ChampsFiche';
import DossierStatusStepper from '../../components/DossierStatusStepper';
import Modal from '../../components/Modal';
import {
  PointerReglementModal,
  ReglementPiecesJointesPanel,
} from '../../components/ReglementPreuves';
import { messageErreurStatut } from '../../lib/reglementRegles';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { DialogFooter } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent } from '../../components/ui/tabs';
import { referentielItems, useBanques, useCategoriesEcheance, useTypesPieceJointe, useTypesReglement } from '../../lib/referentiels';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatTelephone,
  toApiDateTime,
  todayISO,
} from '../../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../../lib/dossierStatus';
import {
  ECHEANCE_STATUT_LABELS,
  echeanceCategorieTone,
  echeanceStatut,
  echeanceStatutTone,
  pieceJointeTypeTone,
  reglementModifiable,
  reglementStatutLabel,
  reglementStatutTone,
} from '../../lib/domain';
import {
  addEcheance,
  addReglement,
  listPayeurs,
  modifierStatutReglement,
  changerStatutDossier,
  getArticle,
  getClient,
  getDossier,
  getMontantsDossier,
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

/** La zone large, en bas. Cinq onglets sur les douze du logiciel de bureau :
 * les cinq pour lesquels un endpoint existe. */
type DossierTab = 'statut' | 'financier' | 'articles' | 'acquereurs' | 'pieces' | 'documents' | 'historique';

/** Le panneau étroit, à droite du formulaire. Il prend ce qui se lit en liste
 * de champs ; la zone large prend les tableaux et les chronologies. */
type PanneauDossierTab = 'montants' | 'dates' | 'tracabilite';

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
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 p-2.5">
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

/** Onglet « Acquéreurs » — l'acquéreur principal et ses éventuels
 * co-acquéreurs, servis par `GET /api/dossiers/{id}/payeurs`.
 *
 * ⚠️ Piège de nommage : `PayeurDto.quotePart` est un **pourcentage 0–100**,
 * alors que `DossierDetailDto.quotePart` est une **fraction** où 1,00 vaut
 * 100 %. Deux champs du même nom, deux échelles — d'où le formatage distinct
 * ici et dans la bande d'identité. */
function AcquereursDossier({ dossierId }: { dossierId: string }) {
  const payeurs = useApi(() => listPayeurs(dossierId), [dossierId], 'dossier-payeurs');

  if (payeurs.loading && !payeurs.data) return <LoadingState />;
  if (payeurs.error) return <ErrorState message={payeurs.error} />;
  const lignes = payeurs.data ?? [];
  if (lignes.length === 0) {
    return <p className="text-label text-muted-foreground">Aucun acquéreur enregistré sur ce dossier.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {lignes.map((pa) => (
        <div key={pa.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-muted/30 p-2.5">
          <Badge tone={pa.role === 'ACQUEREUR_PRINCIPAL' ? 'info' : 'neutral'}>
            {pa.role === 'ACQUEREUR_PRINCIPAL' ? 'Principal' : 'Co-acquéreur'}
          </Badge>
          <span className="min-w-0 truncate text-label font-medium text-foreground">{pa.nom || pa.id}</span>
          {pa.pieceIdentite && <span className="text-body text-muted-foreground">{pa.pieceIdentite}</span>}
          {/* Toujours nul sur l'acquéreur principal — ne rien afficher plutôt
              qu'un tiret qui se lirait comme une quote-part manquante. */}
          {typeof pa.quotePart === 'number' && (
            <span className="ml-auto text-label font-semibold tabular-nums text-foreground">{pa.quotePart.toFixed(2)} %</span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Une durée en jours entiers, telle que le serveur la calcule.
 *
 * `null` est fréquent et signifie « le jalon n'est pas atteint », pas « zéro » :
 * `delaiLivraison` n'est calculable que sur 63 dossiers sur 358. Le repli sur
 * `undefined` laisse `Field` afficher son tiret. */
function formatJours(jours: number | null | undefined) {
  return typeof jours === 'number' ? `${formatNumber(jours)} j` : undefined;
}

/** La page routée : elle lit l'URL et la passe à la fiche. */
export default function DossierDetail() {
  const { id } = useParams();
  return <FicheDossier id={id!} />;
}

/** La fiche elle-même, indépendante de l'URL — ce qui permet de l'ouvrir en
 * dialogue (`FicheDossierDialog`) à l'identique de la page, comme
 * `FicheProspection`. */
export function FicheDossier({ id, variante = 'page' }: { id: string; variante?: VarianteFiche }) {
  const { data: d, loading, error, refetch } = useApi(() => getDossier(id), [id], 'dossier');
  // Cascade reference up to the originating Prospection — same
  // reference-the-previous-pipeline-stage convention as Prospection's own
  // La prospection d'origine n'est plus resumee dans un onglet : l'en-tete
  // porte un bouton qui ouvre sa fiche complete. Une requete de moins, et le
  // lien de cascade est preserve.
  // Full contact details for the "Client" card — DossierDetailDto only
  // carries clientId/clientNom, same reason the Prospection/Prospect
  // cascade tabs needed their own fetch.
  const linkedClient = useApi(() => (d?.clientId ? getClient(d.clientId) : Promise.resolve(null)), [d?.clientId], 'dossier-client');
  // Détail complet des articles pour « Article(s) réservé(s) ».
  //
  // `ArticleSummaryDto` porte désormais la classification — type, catégorie,
  // étage, immeuble — donc ce fetch n'est plus ce qui la fournit, et la carte
  // l'affiche sans attendre le réseau. Il reste néanmoins **nécessaire** :
  // `ArticleCompactPreview` lit aussi `statut`, `tranche*`, `salePrice*`,
  // `comSalePrice*`, `titreFoncier` et `adresse`, aucun n'étant dans le
  // résumé. Ne pas le supprimer en croyant la livraison suffisante — c'est
  // précisément ce que l'ancienne version de ce commentaire laissait penser.
  //
  // Reste un N+1 : un appel par article. À porter côté serveur si une fiche
  // dossier à plusieurs articles devient un cas courant.
  const articleIds = (d?.articles ?? []).map((a) => a.id).join(',');
  const articleDetails = useApi(
    () => (d?.articles && d.articles.length > 0 ? Promise.all(d.articles.map((a) => getArticle(a.id))) : Promise.resolve([])),
    [articleIds],
    'dossier-articles',
  );
  const nextSteps = useApi(() => getEtapesSuivantes(id), [id], 'dossier-etapes');
  const montants = useApi(() => getMontantsDossier(id), [id], 'dossier-montants');
  const [echeancesPage, setEcheancesPage] = useState(0);
  const echeances = useApi(() => listEcheances(id, { page: echeancesPage, size: 20 }), [id, echeancesPage], 'dossier-echeances');
  const pieces = useApi(() => listPiecesJointes(id), [id], 'dossier-pieces');
  const [addPieceOpen, setAddPieceOpen] = useState(false);
  const [historiquePage, setHistoriquePage] = useState(0);
  const historique = useApi(() => listHistoriqueDossier(id, { page: historiquePage, size: 20 }), [id, historiquePage], 'dossier-historique');
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  // Landing here right after "Créer le dossier" (see NewDossier.tsx) — jump
  // straight to Financier with the "Ajouter une échéance" row pre-opened and
  // pre-filled, since the schéma de financement always starts empty (the
  // API's CreerDossierRequest has no way to seed it at creation time).
  // En dialogue, l'URL est celle de la page derrière : `?nouveau` ne la concerne pas.
  const fromCreation = variante === 'page' && searchParams.get('nouveau') === '1';
  // « Statut » par défaut : ouvrir un dossier, c'est d'abord demander où il
  // en est. Le parcours occupait jusqu'ici une ligne permanente de la bande
  // d'identité, utile les premiers jours d'un dossier puis jamais relue.
  const [tab, setTab] = useState<DossierTab>('statut');
  // « Montants » par défaut, comme l'écran légataire, qui l'ouvre sur cet
  // onglet : c'est la première chose qu'un commercial regarde sur un dossier.
  const [panneauTab, setPanneauTab] = useState<PanneauDossierTab>('montants');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  // `!d` : avec une valeur en cache (cf. `useApi(..., 'dossier')`), on repeint
  // le dossier connu et la revalidation se fait en fond, sans écran de chargement.
  if (loading && !d) return <CadreFiche variante={variante} title="Dossier de vente"><LoadingState /></CadreFiche>;
  if (error) return <CadreFiche variante={variante} title="Dossier de vente"><ErrorState message={error} /></CadreFiche>;
  if (!d) {
    return (
      <CadreFiche variante={variante} title="Dossier introuvable" crumbs={[{ label: 'Dossiers', to: '/dossiers' }]}>
        <p>Ce dossier n'existe pas.</p>
      </CadreFiche>
    );
  }

  const title = d.clientNom || d.code || 'Dossier';

  /* Les trois blocs volumineux de l'ancien découpage en onglets, sortis
     en variables : leur contenu ne change pas, seule leur place change.
     Les extraire plutôt que les réécrire garantit qu'aucune
     fonctionnalité ne se perd dans la bascule — l'échéancier porte la
     création d'échéance, les règlements imbriqués et leurs pièces
     jointes, soit l'essentiel de ce que l'écran sait faire. */
  const blocEcheancier = (
    <>
          {/* Called "Échéancier" in api-docsV0/V1, but the real Omran screen
              (omaran_visual) labels this "Schéma de financement" — same
              data (EcheanceDto), just the on-screen name. The screen also
              shows Décompte/Facture columns and sibling tabs (Sous
              articles, Acquéreurs, Modifications, Cadeaux, Dépenses,
              Factures proforma, Factures, Avoirs, Décomptes, Réclamations)
              that have no corresponding endpoint in api-docsV2 yet — out
              of scope until the backend exposes them. */}
          {/* Sans carte propre (le panneau d'onglet en est une) : l'action la
              plus fréquente de l'onglet, juste au-dessus du tableau. */}
          <div className="flex flex-col gap-2.5">
            <LigneActivite
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
              {echeances.data && echeances.data.content.length === 0 && (
                <span>Aucune ligne dans le schéma de financement pour ce dossier.</span>
              )}
            </LigneActivite>
            {echeances.loading && !echeances.data && <LoadingState />}
            {echeances.error && <ErrorState message={echeances.error} />}
            {echeances.data && echeances.data.content.length > 0 && (
              <div>
                <Table containerClassName="overflow-visible">
                  <TableHeader className="sticky top-0 z-1">
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
          </div>
    </>
  );

  /* Séparés en deux onglets le 20/09 sur demande : le générateur de
     documents (action, rien d'enregistré) et les pièces jointes (données
     du dossier) n'ont ni le même statut ni le même usage. */
  const blocGeneres = (
    <>
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
    </>
  );

  const blocPieces = (
    <>
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
    </>
  );

  const blocHistorique = (
    <>
        <Card title="Historique">
          {historique.loading && !historique.data && <LoadingState />}
          {historique.error && <ErrorState message={historique.error} />}
          {historique.data && historique.data.content.length === 0 && (
            <EmptyState title="Aucun historique" message="Aucun événement n'a encore été enregistré pour ce dossier." />
          )}
          {historique.data && historique.data.content.length > 0 && (
            /* Table dense au lieu de la timeline (même demande que l'onglet
               Actions de la prospection, 20/09) : une ligne par événement,
               description entière — la cellule replie le texte et la ligne
               grandit, h-(--row-h) est un minimum. */
            /* Sans cadre propre : la Card qui l'entoure fournit déjà le
               sien — bordure sur bordure était un cadre dans le cadre. */
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Événement</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Par</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historique.data.content.map((h, i) => (
                    <TableRow key={`${h.date}-${i}`}>
                      <TableCell className="tabular-nums text-muted-foreground">{formatDateTime(h.date)}</TableCell>
                      <TableCell className="font-medium text-foreground">{h.type || 'Événement'}</TableCell>
                      <TableCell className="min-w-60 max-w-120 py-1 whitespace-normal text-muted-foreground">
                        {h.description || '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{h.utilisateur || 'Système'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
    </>
  );

  /* Le premier article porte la classification que l'écran légataire met
     dans sa colonne de gauche — catégorie, type, surface. Un dossier peut
     en avoir plusieurs ; le formulaire en nomme un et renvoie à l'onglet
     « Articles » pour le reste, plutôt que d'en cacher silencieusement. */
  const premierArticle = d.articles?.[0];

  return (
    <CadreFiche
      variante={variante}
      title={title}
      crumbs={[{ label: 'Dossiers', to: '/dossiers' }]}
      typeFiche="Dossier de vente"
      fullHeight
      icon={<Folder />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
      /* Ligne 1 — l'identité. Date de réservation, commercial et société
         passent au pied de la carte des champs. */
      entete={
        <EnteteFiche
          code={d.code}
          nom={
            d.clientId ? (
              <Link to={`/clients/${d.clientId}`} className="hover:underline" title="Ouvrir la fiche client">
                {d.clientNom || 'Voir le client'}
              </Link>
            ) : (
              title
            )
          }
        >
          <Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge>
          {/* 11,5 % seulement : n'a de sens que sur les statuts qui expirent. */}
          {d.dateValiditeStatut && (
            <span className="text-micro text-muted-foreground">valide jusqu'au {formatDate(d.dateValiditeStatut)}</span>
          )}
          {montants.data?.dossierSorti && <Badge tone="warning">Dossier sorti</Badge>}
          {/* 95 % des dossiers valent 1,00 : la quote-part ne s'affiche qu'en indivision. */}
          {typeof d.quotePart === 'number' && d.quotePart !== 1 && (
            <span className="text-micro font-medium text-foreground">Quote-part {(d.quotePart * 100).toFixed(2)} %</span>
          )}
        </EnteteFiche>
      }
      actions={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button variant="outline" size="sm" onClick={() => showToast('Intégration VOIP à venir.')}>
            <Phone data-icon="inline-start" /> Appeler
          </Button>
          {d.prospectionId && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/prospections/${d.prospectionId}`)}>
              <ArrowUpRight data-icon="inline-start" /> Prospection
            </Button>
          )}
          {d.clientId && (
            <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${d.clientId}`)}>
              <ArrowUpRight data-icon="inline-start" /> Fiche client
            </Button>
          )}
        </div>
      }
    >
      <FicheShell
        ongletActif={tab}
        onOngletChange={(v) => setTab(v as DossierTab)}
        /* ---------------------------------------------------------------
           Bande 1 — identité. Le logiciel de bureau met tout ça dans sa
           barre de titre (« Dossier de vente N° ARS 2025/00357 du
           10/12/2025 ») plus les deux premières lignes du formulaire. On le
           regroupe : c'est une seule information, « quel dossier, où en
           est-il ».
           --------------------------------------------------------------- */
        identite={
          fromCreation && (
            <div className="rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-1.5 text-micro text-(--info)">
              Dossier créé. Le schéma de financement est vide — l'API ne permet pas de le pré-remplir à la création ;
              complétez-le dans l'onglet ci-dessous.
            </div>
          )
        }
        /* ---------------------------------------------------------------
           Bande 2a — le formulaire, colonne de gauche du logiciel de bureau.
           **Entièrement en lecture seule, et ce n'est pas un choix** :
           `/api/dossiers/{id}` est servi en GET uniquement. Les seules
           écritures du dossier passent par `PATCH /statut` — porté par le
           stepper ci-dessus — et par l'échéancier, dans l'onglet du bas.
           D'où l'absence de barre d'enregistrement sur cet écran, là où les
           fiches prospection et pré-prospection en ont une.

           Le pavé de prix reproduit enfin les six cases HT/TTC de l'écran
           légataire : la fiche ne portait que le TTC jusqu'à cette livraison
           et ne pouvait pas afficher « Total HT » ni « Prix de vente HT ».
           --------------------------------------------------------------- */
        formulaire={
          <Card padded={false} className="h-full">
            <div className="p-3">
              {/* Une seule grille : N° dossier, client, date et commercial sont
                  dans la ligne d'identité ou le pied ; le pavé de prix suit
                  directement, quatre par ligne (HT/TTC se répondent en colonnes). */}
              <GrilleFiche>
                <ChampLecture
                  label="Tranche"
                  valeur={
                    d.trancheId ? (
                      <Link to={`/tranches/${d.trancheId}`} className="text-(--info) hover:underline">
                        {d.trancheLibelle || d.trancheCode}
                      </Link>
                    ) : (
                      d.trancheLibelle || d.trancheCode
                    )
                  }
                />
                <ChampLecture
                  label="Article"
                  valeur={premierArticle?.code}
                  aide="Le détail complet est dans l'onglet « Articles »."
                />
                <ChampLecture label="Catégorie" valeur={premierArticle?.categorieLibelle || premierArticle?.categorieCode} />
                {/* Les deux lisent l'**article**, pas le dossier. Les champs
                    homonymes de `DossierDetailDto` ont été retirés du contrat
                    serveur : mesurés absents de la charge utile sur 25 fiches
                    sur 25, ces deux lignes affichaient un tiret en permanence
                    alors que la donnée était dans la même réponse, un cran
                    plus bas. */}
                <ChampLecture
                  label="Titre foncier"
                  valeur={premierArticle?.titreFoncier}
                  aide="Numéro de titre foncier du lot. Souvent absent : 33 dossiers sur 116."
                />

                <ChampLecture
                  label="Présentation"
                  valeur={premierArticle?.presentationLibelle || premierArticle?.presentationCode}
                  aide="Type de présentation du lot."
                />
                <ChampLecture label="Type" valeur={premierArticle?.typeLibelle || premierArticle?.typeCode} />
                <ChampLecture label="Surface" valeur={premierArticle?.area ? `${premierArticle.area} m²` : null} />
                <ChampLecture label="Prix du m²" valeur={d.prixM2 ? formatCurrency(d.prixM2) : null} />

                <ChampLecture label="Total HT" valeur={formatCurrency(d.prixAvantRemiseHT)} />
                <ChampLecture label="Total TTC" valeur={formatCurrency(d.prixAvantRemise)} />
                <ChampLecture
                  label="Remise"
                  valeur={
                    d.remise
                      ? `${formatCurrency(d.remiseMontant)} · ${formatPercent(d.remise, 2)}`
                      : null
                  }
                />
                <ChampLecture
                  label="TVA"
                  valeur={d.tauxTVA ? `${(d.tauxTVA * 100).toFixed(2)} %` : null}
                  aide="Nul ou absent sur la majorité des dossiers — c'est une absence de saisie, pas un taux nul."
                />
                <ChampLecture label="Prix de vente HT" valeur={formatCurrency(d.prixHT)} />
                <ChampLecture label="Prix de vente TTC" valeur={formatCurrency(d.prix)} />
                <ChampLecture label="Prix contractuel" valeur={formatCurrency(d.totalAPayer)} />
                <ChampLecture label="Mode de paiement" valeur={d.modePaie} />

                {d.notes && <ChampLecture label="Notes" valeur={d.notes} multiligne apres={16} />}
                <PiedFiche>
                  <span>Réservé le {formatDate(d.dateDocument)}</span>
                  <span aria-hidden>·</span>
                  <span>commercial {d.commercialNom || '— non assigné —'}</span>
                  {d.societeCode && (
                    <>
                      <span aria-hidden>·</span>
                      <span>société {d.societeCode}</span>
                    </>
                  )}
                </PiedFiche>
              </GrilleFiche>
            </div>
          </Card>
        }
        /* ---------------------------------------------------------------
           Bande 2b — le panneau droit. Le logiciel de bureau le pose ici et
           l'ouvre sur « Montants », et c'est le bon endroit : la synthèse
           doit rester lisible pendant qu'on parcourt l'échéancier du bas,
           ce qu'un onglet de la barre inférieure ne permettrait pas.

           Répartition assumée entre les deux zones : la colonne étroite
           prend ce qui se lit en liste de champs (montants, dates,
           traçabilité), la zone large prend les tableaux et les
           chronologies. L'écran légataire mélange les deux et se retrouve
           avec un historique dans une colonne de 40 % de large.
           --------------------------------------------------------------- */
        panneau={
          <Card padded={false} className="flex h-full flex-col">
            <Tabs value={panneauTab} onValueChange={(v) => setPanneauTab(v as PanneauDossierTab)} className="flex min-h-0 flex-1 flex-col gap-2 p-3">
              <OngletsLigne
                onglets={[
                  { id: 'montants', libelle: 'Montants' },
                  { id: 'dates', libelle: 'Dates' },
                  { id: 'tracabilite', libelle: 'Traçabilité' },
                ]}
              />

              <TabsContent value="montants" className="min-h-0 flex-1">
                {montants.loading && !montants.data && <LoadingState />}
                {montants.error && <ErrorState message={montants.error} />}
                {montants.data && (
                  <SyntheseMontants montants={montants.data} probabiliteFinalisation={d.probabiliteFinalisation} />
                )}
              </TabsContent>

              <TabsContent value="dates" className="min-h-0 flex-1 overflow-auto">
                <FieldGrid>
                  <Field label="Réservation" value={formatDate(d.dateDocument)} />
                  <Field label="Prospection" value={formatDate(d.dateProspection)} />
                  <Field label="Validité du statut" value={formatDate(d.dateValiditeStatut)} />
                </FieldGrid>
                <div className="mt-2 border-t border-border pt-2">
                  <FieldGrid>
                    <Field label="Statut" value={canonicalStatusLabel(d.statut)} />
                    <Field label="Étapes atteignables" value={d.etapesAtteignables?.join(', ')} />
                  </FieldGrid>
                </div>
              </TabsContent>

              <TabsContent value="tracabilite" className="min-h-0 flex-1 overflow-auto">
                {/* « Réservé le » plus haut est `dateDocument`, la date de
                    réservation — pas celle de saisie de l'enregistrement.
                    D'où « Saisi le » ici, pour ne pas donner deux sens à la
                    même formule sur un même écran. */}
                <FieldGrid>
                  <Field label="Saisi par" value={d.creePar} />
                  <Field label="Saisi le" value={formatDateTime(d.creeLe)} />
                  <Field label="Modifié par" value={d.modifiePar} />
                  <Field label="Modifié le" value={formatDateTime(d.modifieLe)} />
                </FieldGrid>
              </TabsContent>
            </Tabs>
          </Card>
        }
        /* ---------------------------------------------------------------
           Bande 3 — la zone large. Cinq onglets sur les douze du logiciel de
           bureau : ce sont les cinq pour lesquels un endpoint existe. Sous
           articles, Modifications, Cadeaux, Dépenses, Factures proforma,
           Factures, Avoirs et Réclamations n'en ont aucun — consigné en
           demande backend plutôt qu'affiché en onglets vides, un onglet vide
           coûtant un clic pour apprendre qu'il n'y a rien.
           --------------------------------------------------------------- */
        onglets={[
          {
            id: 'statut',
            libelle: 'Statut',
            contenu: (
              <div className="p-3">
                <DossierStatusStepper
                  currentStatus={d.statut || 'Réservation'}
                  nextSteps={nextSteps.data ?? []}
                  onConfirm={async (newStatus, note, date) => {
                    try {
                      await changerStatutDossier(d.id, { statut: newStatus, note: note || undefined, date: toApiDateTime(date) });
                      await refetch();
                      await nextSteps.refetch();
                      await historique.refetch();
                      await montants.refetch();
                      showToast(`Statut changé : ${canonicalStatusLabel(newStatus)}.`);
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : "Échec de l'opération.");
                    }
                  }}
                />
                {/* Jalons et délais, sous le parcours qu'ils mesurent.
                    Placés ici et non dans le formulaire, que la fiche tient en
                    une page sans défilement — cinq champs de plus en tête la
                    feraient déborder, et c'est l'onglet Statut qui parle déjà
                    d'avancement.

                    Les trois délais sont calculés par le serveur, jamais
                    stockés, et sont souvent nuls : 152, 73 et 63 dossiers sur
                    358 respectivement. `Field` rend un tiret dans ce cas
                    plutôt que de masquer la ligne — une case vide dit « pas
                    encore atteint », une ligne absente ne dit rien. */}
                <div className="mt-4 border-t border-border pt-3">
                  <h3 className="mb-2 text-micro font-medium text-muted-foreground">Jalons et délais</h3>
                  <FieldGrid>
                    <Field label="Date de compromis" value={formatDate(d.dateCompromis)} />
                    <Field label="Livraison réelle" value={formatDate(d.dateLivraisonReelle)} />
                    <Field label="Délai de concrétisation" value={formatJours(d.delaiConcretisation)} />
                    <Field label="Délai notaire" value={formatJours(d.delaiNotaire)} />
                    <Field label="Délai de livraison" value={formatJours(d.delaiLivraison)} />
                  </FieldGrid>
                </div>
              </div>
            ),
          },
          {
            id: 'financier',
            libelle: 'Schéma de financement',
            compteur: echeances.data?.totalElements ?? 0,
            contenu: <div className="p-3">{blocEcheancier}</div>,
          },
          {
            id: 'articles',
            libelle: 'Articles',
            compteur: d.articles?.length ?? 0,
            contenu: (
              <div className="flex flex-col gap-2 p-3">
                {!d.articles || d.articles.length === 0 ? (
                  <p className="text-label text-muted-foreground">Aucun article lié.</p>
                ) : articleDetails.data && articleDetails.data.length > 0 ? (
                  articleDetails.data.map((a) => <ArticleCompactPreview key={a.id} article={a} defaultExpanded />)
                ) : (
                  d.articles.map((a) => (
                    <div key={a.id} className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-label font-semibold text-foreground">{a.code}</span>
                        {articleDetails.loading && <span className="text-micro text-muted-foreground">chargement du détail…</span>}
                      </div>
                      <FieldGrid>
                        <Field label="Description" value={a.description} />
                        <Field label="Immeuble" value={a.immeubleLibelle || a.immeubleCode} />
                        <Field label="Étage" value={a.etageLibelle || a.etageCode} />
                        <Field label="Catégorie" value={a.categorieLibelle || a.categorieCode} />
                        <Field label="Type" value={a.typeLibelle || a.typeCode} />
                        <Field label="Surface" value={a.area ? `${a.area} m²` : undefined} />
                        <Field label="Prix" value={a.price ? formatCurrency(a.price) : undefined} />
                      </FieldGrid>
                    </div>
                  ))
                )}
                {articleDetails.error && <ErrorState message={articleDetails.error} />}
              </div>
            ),
          },
          {
            id: 'acquereurs',
            libelle: 'Acquéreurs',
            contenu: (
              <div className="flex flex-col gap-3 p-3">
                {/* Le client du dossier, avec ses coordonnees completes — la
                    carte « Client » de l'ancien onglet Apercu, relogee la ou
                    l'ecran legataire range les acquereurs. */}
                <div>
                  {linkedClient.loading && !linkedClient.data && <LoadingState />}
                  {linkedClient.error && <ErrorState message={linkedClient.error} />}
                  <FieldGrid>
                    <Field label="Nom" value={d.clientNom} />
                    <Field label="Commercial" value={d.commercialNom} />
                    {/* Acteur **distinct** du commercial, pas un synonyme :
                        renseigné sur 221 des 358 dossiers réels. */}
                    <Field label="Responsable de vente" value={d.responsableVenteNom} />
                    <Field label="Notaire" value={d.avocatNom} />
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
                </div>
                <div className="border-t border-border pt-3">
                  <AcquereursDossier dossierId={d.id} />
                </div>
              </div>
            ),
          },
          {
            id: 'pieces',
            libelle: 'Pièces jointes',
            compteur: pieces.data?.length ?? 0,
            contenu: <div className="p-3">{blocPieces}</div>,
          },
          {
            id: 'documents',
            libelle: 'Documents générés',
            contenu: <div className="p-3">{blocGeneres}</div>,
          },
          {
            id: 'historique',
            libelle: 'Historique',
            compteur: historique.data?.totalElements ?? 0,
            contenu: <div className="p-3">{blocHistorique}</div>,
          },
        ]}
      />

      {toast && (
        <div role="status" aria-live="polite" className="fixed right-6 bottom-6 z-50 rounded-lg bg-foreground px-4.5 py-3 text-label font-medium text-background shadow-lg">
          {toast}
        </div>
      )}
    </CadreFiche>
  );
}
