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
  formatPercentValue,
  formatSurface,
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
  encaissementEtatLabel,
  encaissementEtatTone,
  reglementModifiable,
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
import { useToast } from '../../lib/toastContext';
import { avecCles } from '../../lib/cles';
import type {
  ArticleDetailDto,
  CreerEcheanceRequest,
  CreerReglementRequest,
  DossierDetailDto,
  EcheanceDto,
  PieceJointeDto,
  ReglementDto,
} from '../../types';

type DossierTab = 'statut' | 'financier' | 'articles' | 'acquereurs' | 'pieces' | 'documents' | 'historique';

type PanneauDossierTab = 'montants' | 'dates' | 'tracabilite';

function AddEcheanceRow({
  onAdd,
  initialOpen,
  initialMontant,
  initialDate,
}: Readonly<{
  onAdd: (body: CreerEcheanceRequest) => Promise<void>;
  initialOpen?: boolean;
  initialMontant?: number;
  initialDate?: string;
}>) {
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
              // `dateEcheance` est en `date-time` : un « YYYY-MM-DD » nu vaut 400.
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
            <Select items={categorieItems} value={categorieId} onValueChange={(v) => setCategorieId((v) || null)}>
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
}: Readonly<{
  dossierId: string;
  piece: PieceJointeDto;
  onDeleted: () => void;
}>) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();
  const ext = piece.extension?.replace(/^\./, '') || '';
  const filename = `${piece.description || 'document'}${ext ? '.' + ext : ''}`;

  // Pas de bouton « Télécharger » : l'URL présignée est servie en `Content-Disposition: inline`,
  // il ferait la même chose qu'« Ouvrir » (le distinguer demanderait un paramètre côté API).
  function handle() {
    setError(null);
    try {
      openPieceJointeFichier(dossierId, piece.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'opération.');
    }
  }

  // Suppression logique côté serveur, mais aucune API pour restaurer : irréversible pour l'utilisateur.
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
  description: string;
  Icon: LucideIcon;
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

function GeneratedDocumentCard({
  dossierId,
  code,
  kind,
}: Readonly<{
  dossierId: string;
  code?: string | null;
  kind: GeneratedDocKind;
}>) {
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

function AddPieceJointeRow({
  dossierId,
  open,
  onOpenChange,
  onAdded,
}: Readonly<{
  dossierId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}>) {
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
      <Select items={typesPieceJointeItems} value={typeId} onValueChange={(v) => setTypeId(v)}>
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

// `typeId` vient de `types-reglement` (StlSettlementType), pas de `modes-paiement`. Banque et référence
// exigées selon le type (400 sinon). Pas de date de règlement effectif : 400 à la création, elle se
// saisit au pointage.
function AddReglementRow({
  dossierId,
  echeanceId,
  reste,
  onAdd,
}: Readonly<{
  dossierId: string;
  echeanceId: string;
  reste: number | undefined;
  onAdd: (echeanceId: string, body: CreerReglementRequest) => Promise<void>;
}>) {
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
  // Un appel par ligne d'échéance en apparence, mais le cache GET de `request()` (déduplication
  // des requêtes en vol) les réduit à un seul.
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

  // Reprend les refus serveur (montant ≤ 0 ou > reste) avant l'aller-retour.
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
            <AideMontant invalide={montantInvalide} depasse={montantDepasse} reste={reste} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reg-date-echeance">Date d'échéance</FieldLabel>
            <Input id="reg-date-echeance" type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
          </FormField>
          <FormField>
            <FieldLabel htmlFor="reg-payeur">Réglé par</FieldLabel>
            <Select items={payeursItems} value={payeurId} onValueChange={(v) => setPayeurId(v)} disabled={aucunPayeur}>
              <SelectTrigger id="reg-payeur" className="w-full">
                <SelectValue placeholder={placeholderPayeur(payeurs.loading, aucunPayeur)} />
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
                setTypeId(v);
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
              <Select items={banquesItems} value={banqueId} onValueChange={(v) => setBanqueId(v)}>
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

function placeholderPayeur(chargement: boolean, aucunPayeur: boolean): string {
  if (chargement) return 'Chargement…';
  return aucunPayeur ? 'Aucun acquéreur rattaché' : 'Acquéreur ou co-acquéreur';
}

function ReglementRecuButton({ dossierId, reglementId }: Readonly<{ dossierId: string; reglementId: string }>) {
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

// Par règlement et non par échéance : compte, mode de versement et tiers payeur vivent sur le règlement.
function AutorisationVersementButton({ dossierId, reglementId }: Readonly<{ dossierId: string; reglementId: string }>) {
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

const REGLEMENT_ROW_TONE: Record<string, { wrap: string; montant: string }> = {
  success: { wrap: 'border-(--success-border) bg-(--success-bg)', montant: 'text-(--success)' },
  info: { wrap: 'border-(--info-border) bg-(--info-bg)', montant: 'text-foreground' },
  neutral: { wrap: 'border-border bg-muted/30', montant: 'text-muted-foreground line-through' },
};

function ReglementRow({
  dossierId,
  reglement,
  onChanged,
}: Readonly<{
  dossierId: string;
  reglement: ReglementDto;
  onChanged: () => Promise<void>;
}>) {
  const [piecesOuvertes, setPiecesOuvertes] = useState(false);
  const [piecesVersion, setPiecesVersion] = useState(0);
  const [pointageOuvert, setPointageOuvert] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirm = useConfirm();

  const tone = encaissementEtatTone(reglement.statut);
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
        <Badge tone={tone}>{encaissementEtatLabel(reglement.statut)}</Badge>
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

function EcheanceReglementsHistory({
  dossierId,
  echeanceId,
  refreshKey,
  onChanged,
}: Readonly<{
  dossierId: string;
  echeanceId: string;
  refreshKey: number;
  onChanged: () => Promise<void>;
}>) {
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

function EcheanceRow({
  dossierId,
  echeance,
  onReglementAdded,
  onReglementChanged,
}: Readonly<{
  dossierId: string;
  echeance: EcheanceDto;
  onReglementAdded: (echeanceId: string, body: CreerReglementRequest) => Promise<void>;
  onReglementChanged: () => Promise<void>;
}>) {
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

// `PayeurDto.quotePart` est un pourcentage 0–100, `DossierDetailDto.quotePart` une fraction
// (1,00 = 100 %) : même nom, deux échelles, deux formatages.
function AcquereursDossier({ dossierId }: Readonly<{ dossierId: string }>) {
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
          {/* Toujours nul sur l'acquéreur principal : pas de tiret, il se lirait
              comme une quote-part manquante. */}
          {typeof pa.quotePart === 'number' && (
            <span className="ml-auto text-label font-semibold tabular-nums text-foreground">{formatPercentValue(pa.quotePart)}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// `null` = jalon non atteint, pas zéro : `undefined` laisse `Field` afficher son tiret.
function formatJours(jours: number | null | undefined) {
  return typeof jours === 'number' ? `${formatNumber(jours)} j` : undefined;
}

function AideMontant({
  invalide,
  depasse,
  reste,
}: Readonly<{ invalide: boolean; depasse: boolean; reste: number | undefined }>) {
  if (invalide) return <p className="mt-1 text-micro text-destructive">Le montant doit être strictement positif.</p>;
  if (depasse) {
    return (
      <p className="mt-1 text-micro text-destructive">
        Dépasse le reste à régler sur cette échéance ({formatCurrency(reste)}).
      </p>
    );
  }
  if (reste === undefined) return null;
  return <p className="mt-1 text-micro text-muted-foreground">Reste à régler : {formatCurrency(reste)}</p>;
}

type ArticleDuDossier = NonNullable<DossierDetailDto['articles']>[number];

function ArticleResume({ article: a, chargement }: Readonly<{ article: ArticleDuDossier; chargement: boolean }>) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-label font-semibold text-foreground">{a.code}</span>
        {chargement && <span className="text-micro text-muted-foreground">chargement du détail…</span>}
      </div>
      <FieldGrid>
        <Field label="Description" value={a.description} />
        <Field label="Immeuble" value={a.immeubleLibelle || a.immeubleCode} />
        <Field label="Étage" value={a.etageLibelle || a.etageCode} />
        <Field label="Catégorie" value={a.categorieLibelle || a.categorieCode} />
        <Field label="Type" value={a.typeLibelle || a.typeCode} />
        <Field label="Surface" value={a.area ? formatSurface(a.area) : undefined} />
        <Field label="Prix" value={a.price ? formatCurrency(a.price) : undefined} />
      </FieldGrid>
    </div>
  );
}

function ArticlesDossier({
  articles,
  details,
  chargement,
}: Readonly<{ articles: DossierDetailDto['articles']; details: ArticleDetailDto[] | null; chargement: boolean }>) {
  if (!articles || articles.length === 0) return <p className="text-label text-muted-foreground">Aucun article lié.</p>;
  if (details && details.length > 0) {
    return <>{details.map((a) => <ArticleCompactPreview key={a.id} article={a} defaultExpanded />)}</>;
  }
  return <>{articles.map((a) => <ArticleResume key={a.id} article={a} chargement={chargement} />)}</>;
}

export default function DossierDetail() {
  // La route `/dossiers/:id` garantit le paramètre.
  const { id = '' } = useParams();
  return <FicheDossier key={id} id={id} />;
}

export function FicheDossier({ id, variante = 'page' }: Readonly<{ id: string; variante?: VarianteFiche }>) {
  const { data: d, loading, error, refetch } = useApi(() => getDossier(id), [id], 'dossier');
  const linkedClient = useApi(() => (d?.clientId ? getClient(d.clientId) : Promise.resolve(null)), [d?.clientId], 'dossier-client');
  // Ne pas supprimer : `ArticleCompactPreview` lit `statut`, `tranche*`, `salePrice*`, `titreFoncier`,
  // `adresse`, absents d'`ArticleSummaryDto`. Un appel par article (N+1).
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
  const showToast = useToast();
  const [searchParams] = useSearchParams();
  // En dialogue, l'URL est celle de la page derrière : `?nouveau` ne la concerne pas.
  const fromCreation = variante === 'page' && searchParams.get('nouveau') === '1';
  const [tab, setTab] = useState<DossierTab>('statut');
  const [panneauTab, setPanneauTab] = useState<PanneauDossierTab>('montants');

  // `!d` : avec une valeur en cache, on repeint le dossier connu et la revalidation se fait en fond.
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

  const blocEcheancier = (
    <>
          <div className="flex flex-col gap-2.5">
            <LigneActivite
              action={
                <AddEcheanceRow
                  onAdd={async (body) => {
                    await addEcheance(d.id, body);
                    await echeances.refetch();
                    await montants.refetch();
                  }}
                  // Lu au montage seulement : sans données chargées, rester fermé plutôt
                  // que proposer une échéance du montant total sur un schéma déjà rempli.
                  initialOpen={fromCreation && echeances.data?.totalElements === 0}
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

  const blocGeneres = (
    <>
        <Card title="Documents générés">
          <p className="mb-2.5 -mt-1 text-body text-muted-foreground">
            Générés à la demande à partir des données du dossier — rien n'est enregistré ici.
          </p>
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
                  {avecCles(historique.data.content, (e) => `${e.date}-${e.type}-${e.utilisateur}-${e.description}`).map(({ item: h, cle }) => (
                    <TableRow key={cle}>
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
          {d.dateValiditeStatut && (
            <span className="text-micro text-muted-foreground">valide jusqu'au {formatDate(d.dateValiditeStatut)}</span>
          )}
          {montants.data?.dossierSorti && <Badge tone="warning">Dossier sorti</Badge>}
          {/* Fraction (1 = 100 %) : ne s'affiche qu'en indivision. */}
          {typeof d.quotePart === 'number' && d.quotePart !== 1 && (
            <span className="text-micro font-medium text-foreground">Quote-part {formatPercent(d.quotePart, 2)}</span>
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
        identite={
          fromCreation && !echeances.error && echeances.data && (
            echeances.data.totalElements === 0 ? (
              <div className="rounded-lg border border-(--info-border) bg-(--info-bg) px-3 py-1.5 text-micro text-(--info)">
                Dossier créé. Le schéma de financement est vide ; complétez-le dans l'onglet ci-dessous.
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-micro text-muted-foreground">
                Dossier créé.
              </div>
            )
          )
        }
        /* Lecture seule : `/api/dossiers/{id}` n'est servi qu'en GET. Les seules
           écritures passent par `PATCH /statut` et par l'échéancier. */
        formulaire={
          <Card padded={false} className="h-full">
            <div className="p-3">
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
                {/* Lus sur l'article, pas sur le dossier : les champs homonymes de
                    `DossierDetailDto` ont été retirés du contrat serveur. */}
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
                <ChampLecture label="Surface" valeur={premierArticle?.area ? formatSurface(premierArticle.area) : null} />
                <ChampLecture label="Prix du m²" valeur={d.prixM2 ? formatCurrency(d.prixM2) : null} />

                <ChampLecture label="Total HT" valeur={formatCurrency(d.prixAvantRemiseHT)} />
                <ChampLecture label="Total TTC" valeur={formatCurrency(d.prixAvantRemise)} />
                <ChampLecture
                  label="Remise HT"
                  valeur={
                    d.remise
                      ? `${formatCurrency(d.remiseMontant)} · ${formatPercentValue(d.remise, 2)}`
                      : null
                  }
                />
                <ChampLecture
                  label="TVA"
                  valeur={d.tauxTVA ? formatPercent(d.tauxTVA, 2) : null}
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
                      // Une sortie libère le lot, une réactivation le réoccupe : sa disponibilité change.
                      await articleDetails.refetch();
                      showToast(`Statut changé : ${canonicalStatusLabel(newStatus)}.`);
                    } catch (err) {
                      showToast({ texte: err instanceof Error ? err.message : "Échec de l'opération.", variante: 'erreur' });
                    }
                  }}
                />
                {/* Délais calculés par le serveur, souvent nuls : tiret plutôt que ligne
                    masquée, une case vide dit « pas encore atteint ». */}
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
                <ArticlesDossier articles={d.articles} details={articleDetails.data} chargement={articleDetails.loading} />
                {articleDetails.error && <ErrorState message={articleDetails.error} />}
              </div>
            ),
          },
          {
            id: 'acquereurs',
            libelle: 'Acquéreurs',
            contenu: (
              <div className="flex flex-col gap-3 p-3">
                <div>
                  {linkedClient.loading && !linkedClient.data && <LoadingState />}
                  {linkedClient.error && <ErrorState message={linkedClient.error} />}
                  <FieldGrid>
                    <Field label="Nom" value={d.clientNom} />
                    <Field label="Commercial" value={d.commercialNom} />
                    {/* Acteur distinct du commercial, pas un synonyme. */}
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
    </CadreFiche>
  );
}
