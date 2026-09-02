import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Download, Eye, FileText, Minus, Pencil, Phone, Plus, UserPlus, Users, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import ArticleCompactPreview from '../../components/ArticleCompactPreview';
import ArticleResultsList from '../../components/ArticleResultsList';
import CreateProspectForm, { type CreateProspectInitial } from '../../components/CreateProspectForm';
import DevisFormSection from '../../components/DevisFormSection';
import InteractionForm from '../../components/InteractionForm';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import RefSelect from '../../components/RefSelect';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { Textarea } from '../../components/ui/textarea';
import { Field as FormField, FieldGroup, FieldLabel } from '../../components/ui/field';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDate } from '../../lib/format';
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_SHORT,
  etapeBadgeTone,
  isSideTrackEtape,
  pipelineStageIndex,
  prospectionDisplayName,
  interactionIcon,
} from '../../lib/domain';
import { useAppData, commercialLabel } from '../../lib/appData';
import { useAuth } from '../../lib/auth';
import {
  addInteraction,
  addProspectionAutreTranche,
  archiverProspection,
  changerEtapeProspection,
  creerDevis,
  getArticle,
  getArticlesReferentiel,
  getProjetsReferentiel,
  getProspect,
  getProspection,
  getSousArticlesReferentiel,
  getSupportsForOrigine,
  getTranche,
  getTranchesReferentiel,
  listDevis,
  listInteractions,
  listProspectionAutresTranches,
  listProspectionHistorique,
  modifierProspection,
  modifierTranchePrincipale,
  removeProspectionAutreTranche,
  transformerProspection,
  viewDevisDocument,
  downloadDevisDocument,
  viewProspectionDocument,
  downloadProspectionDocument,
  type ProspectionPdfDocKind,
  type ArticleReferentielFilters,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useConfirm } from '../../lib/confirmContext';
import { useUrlEnum } from '../../lib/useUrlState';
import { useToast } from '../../lib/useToast';
import {
  referentielItems,
  useActionsCommerciales,
  useCategoriesBien,
  useEtapesProspection,
  useOriginesProspection,
  useRaisonsCloture,
  useTypesBienReferentiel,
  useTypesContactProspection,
  useVocations,
} from '../../lib/referentiels';
import type { ArticleDetailDto, DevisDto, ModifierProspectionRequest } from '../../types';

const PROSPECTION_TABS = ['apercu', 'prospect', 'article', 'devis', 'historique'] as const;
type ProspectionTab = (typeof PROSPECTION_TABS)[number];

const PROSPECTION_DOC_LABELS: Record<ProspectionPdfDocKind, string> = {
  nda: 'NDA',
  fiche: 'Fiche',
};

/** One "Voir + Télécharger" cell pair inside the merged Documents group
 * below — same actions as before (`viewProspectionDocument`/
 * `downloadProspectionDocument`), just laid out as two adjoining cells of
 * one segmented control instead of two separate floating buttons, so NDA
 * and Fiche read as one "Documents" affordance rather than a scatter of
 * near-identical button pairs. */
function ProspectionDocCell({
  prospectionId,
  kind,
  disabled,
  disabledReason,
  divider,
  onError,
}: {
  prospectionId: string;
  kind: ProspectionPdfDocKind;
  disabled?: boolean;
  disabledReason?: string;
  divider?: boolean;
  onError: (message: string | null) => void;
}) {
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);

  async function handle(action: 'view' | 'download') {
    setBusy(action);
    onError(null);
    try {
      if (action === 'view') await viewProspectionDocument(prospectionId, kind);
      else await downloadProspectionDocument(prospectionId, kind, `${kind}-${prospectionId}.pdf`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {divider && <span aria-hidden className="w-px shrink-0 self-stretch bg-input" />}
      <button
        type="button"
        disabled={!!busy || disabled}
        title={disabled ? disabledReason : undefined}
        onClick={() => handle('view')}
        className="flex items-center gap-1.5 px-2.5 text-body font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
      >
        <Eye className="size-3.5 text-muted-foreground" />
        {busy === 'view' ? '…' : PROSPECTION_DOC_LABELS[kind]}
      </button>
      <button
        type="button"
        disabled={!!busy || disabled}
        title={disabled ? disabledReason : `Télécharger ${PROSPECTION_DOC_LABELS[kind]} (PDF)`}
        aria-label={`Télécharger ${PROSPECTION_DOC_LABELS[kind]}`}
        onClick={() => handle('download')}
        className="flex items-center border-l border-input px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Download className="size-3.5" />
      </button>
    </>
  );
}

/** "Documents" — NDA + Fiche prospection generated PDFs, as one bordered
 * segmented control (Voir/Télécharger per document) instead of two
 * disconnected button pairs floating in the header. Errors from either cell
 * surface as one line under the whole group. */
function ProspectionDocumentButtons({ prospectionId, hasProspect }: { prospectionId: string; hasProspect: boolean }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex h-8 items-stretch overflow-hidden rounded-md border border-input">
        <ProspectionDocCell
          prospectionId={prospectionId}
          kind="nda"
          disabled={!hasProspect}
          disabledReason="Aucune fiche prospect liée pour générer le NDA."
          onError={setError}
        />
        <ProspectionDocCell prospectionId={prospectionId} kind="fiche" divider onError={setError} />
      </div>
      {error && <span role="alert" className="text-micro text-destructive">{error}</span>}
    </div>
  );
}

export default function ProspectionDetail() {
  const { id } = useParams();
  // Reused for both `/prospections/:id` and `/pre-prospections/:id` — Omran
  // stores both in the same table (see CLAUDE.md), so this is genuinely the
  // same GET /api/prospections/{id} record either way. Only the entry
  // point (which list you came from) differs, and that's what previously
  // made every pré-prospection row feel like it "redirected to a
  // prospection": the URL, breadcrumb and back-link always said
  // "Prospections" even when opened from Pré-prospections. Detect the
  // prefix from the URL and swap those labels only — `isPre` below (data-
  // driven, not route-driven) still governs the actual page content.
  const location = useLocation();
  const isPreRoute = location.pathname.startsWith('/pre-prospections');
  const listPath = isPreRoute ? '/pre-prospections' : '/prospections';
  const listLabel = isPreRoute ? 'Pré-prospections' : 'Prospections';
  // Section-identity accent (index.css) reused for the pipeline stepper and
  // the "Contact" card's left border — same color as the PageShell icon
  // chip above, so the whole page reads as one consistent identity instead
  // of the plain black-on-white the monochrome --brand would otherwise
  // give every page.
  const sectionAccent = isPreRoute ? 'var(--sec-preprospection)' : 'var(--sec-prospection)';
  const { data: p, loading, error, refetch } = useApi(() => getProspection(id!), [id]);
  // Cascade reference down to the linked Prospect — same pipeline-chain
  // convention as Dossier's own "Prospection" reference: each stage links
  // to the one before it. Only fetched once the prospection actually
  // resolved to a prospect (unset while still a pré-prospection).
  const linkedProspect = useApi(() => (p?.prospectId ? getProspect(p.prospectId) : Promise.resolve(null)), [p?.prospectId]);
  const [interactionsPage, setInteractionsPage] = useState(0);
  const interactions = useApi(() => listInteractions(id!, { page: interactionsPage, size: 20 }), [id, interactionsPage]);
  // Parcours pré-prospect → prospect → prospection — GET
  // /api/prospections/{id}/historique, distinct from the interactions/
  // "Actions" timeline above: this one is the two transitions the API
  // writes automatically ("Prospect créé et lié", "Transformée en
  // prospection"), not manually-logged calls/visits/notes.
  const [parcoursPage, setParcoursPage] = useState(0);
  const parcours = useApi(() => listProspectionHistorique(id!, { page: parcoursPage, size: 20 }), [id, parcoursPage]);
  const { commerciaux } = useAppData();
  const { user } = useAuth();
  // A commercial assigning themselves doesn't need the "pick a commercial"
  // dropdown at all — `user.employeeId` is the CfgTier id created for their
  // account (POST /api/utilisateurs), the same id space `commerciaux`
  // (CfgTier rows of kind commercial) uses, so this resolves whenever the
  // logged-in employee actually is one of the assignable commerciaux.
  const ownCommercial = commerciaux.find((c) => c.id === user?.employeeId) ?? null;
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [showCreateProspect, setShowCreateProspect] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [transformCommercial, setTransformCommercial] = useState<string | null>(null);
  const [etapeId, setEtapeId] = useState<string | null>(null);
  const [showArchiver, setShowArchiver] = useState(false);
  const [raisonId, setRaisonId] = useState<string | null>(null);
  const [raisonTexte, setRaisonTexte] = useState('');
  const [busy, setBusy] = useState(false);
  // Onglet dans l'URL : partageable, et conservé au rechargement.
  const [tab, setTab] = useUrlEnum<ProspectionTab>('onglet', PROSPECTION_TABS, 'apercu');
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState<ModifierProspectionRequest | null>(null);
  const [saving, setSaving] = useState(false);

  const etapes = useEtapesProspection();
  const raisons = useRaisonsCloture();
  const origines = useOriginesProspection();
  const vocations = useVocations();
  const typesContact = useTypesContactProspection();
  const actionsCommerciales = useActionsCommerciales();
  const supports = useApi(
    () => (infoForm?.origineId ? getSupportsForOrigine(infoForm.origineId) : Promise.resolve([])),
    [infoForm?.origineId],
  );

  const autresTranches = useApi(() => (id ? listProspectionAutresTranches(id) : Promise.resolve([])), [id]);
  const [devisPage, setDevisPage] = useState(0);
  const devis = useApi(() => listDevis(id!, { page: devisPage, size: 20 }), [id, devisPage]);

  if (loading) return <PageShell title={isPreRoute ? 'Pré-prospection' : 'Prospection'}><LoadingState /></PageShell>;
  if (error) return <PageShell title={isPreRoute ? 'Pré-prospection' : 'Prospection'}><ErrorState message={error} /></PageShell>;
  if (!p) {
    return (
      <PageShell title={`${isPreRoute ? 'Pré-prospection' : 'Prospection'} introuvable`} crumbs={[{ label: listLabel, to: listPath }]}>
        <p>Cette {isPreRoute ? 'pré-prospection' : 'prospection'} n'existe pas.</p>
      </PageShell>
    );
  }

  const name = prospectionDisplayName(p);
  const createProspectInitial: CreateProspectInitial = {
    firstName: name?.trim().split(' ')[0] ?? '',
    lastName: name?.trim().split(' ').slice(1).join(' ') ?? '',
    phone: p.tempTel ?? '',
    email: p.tempEmail ?? '',
  };
  const stageIdx = pipelineStageIndex(p.etape);
  const showStepper = !p.fermee && !isSideTrackEtape(p.etape) && stageIdx >= 0;
  const isPre = !p.prospectId;
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));

  async function handleTransform(commercialId: string) {
    setBusy(true);
    try {
      await transformerProspection(p!.id, { commercialId });
      await refetch();
      showToast('Prospection transformée — commercial assigné.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(false);
    }
  }

  async function handleChangeEtape() {
    if (!etapeId) return;
    setBusy(true);
    try {
      await changerEtapeProspection(p!.id, { etapeId });
      setEtapeId(null);
      await refetch();
      showToast('Étape changée.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchiver() {
    setBusy(true);
    try {
      await archiverProspection(p!.id, { raisonId: raisonId ?? undefined, raisonTexte: raisonTexte.trim() || undefined });
      setShowArchiver(false);
      await refetch();
      showToast('Prospection clôturée.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setBusy(false);
    }
  }

  function startEditInfo() {
    setInfoForm({
      origineId: p!.origineId,
      origineSupportId: p!.origineSupportId,
      vocationId: p!.vocationId,
      typeContactId: p!.typeContactId,
      actionCommercialeId: p!.actionCommercialeId,
      surface: p!.surface,
      surfaceJusqua: p!.surfaceJusqua,
      prix: p!.prix,
      prixJusqua: p!.prixJusqua,
      avance: p!.avance,
      financementFondsPropres: p!.financementFondsPropres,
      financementCredit: p!.financementCredit,
      financementAutre: p!.financementAutre,
      notes: p!.notes,
    });
    setEditingInfo(true);
  }

  async function saveInfo() {
    if (!infoForm) return;
    setSaving(true);
    try {
      await modifierProspection(p!.id, infoForm);
      await refetch();
      setEditingInfo(false);
      showToast('Prospection mise à jour.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell
      title={name}
      crumbs={[{ label: listLabel, to: listPath }, { label: p.code || name }]}
      icon={isPreRoute ? <UserPlus /> : <Users />}
      accent={isPreRoute ? 'var(--sec-preprospection)' : 'var(--sec-prospection)'}
      accentBg={isPreRoute ? 'var(--sec-preprospection-bg)' : 'var(--sec-prospection-bg)'}
    >
      <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate(listPath)}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      <div className="mb-3 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-hero font-semibold tracking-tight text-foreground break-words">{name}</h2>
            {isPre && <Badge tone="amber">Pré-prospection · Non qualifiée</Badge>}
            <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-label text-muted-foreground">
            {p.code && <>Code {p.code} · </>}
            Créée le {formatDate(p.dateDocument)} · Commercial : {p.commercialNom || '— non assigné —'}
          </div>
        </div>
        {/* Utility actions (documents, log an action, close the lead) group
            on the left of this cluster; the one real call-to-action for
            this prospection's current state (créer prospect / transformer /
            créer-ou-ouvrir dossier) stands alone on the right, past a
            divider, so it stays the visually strongest thing in the row
            instead of blending into a stack of equally-weighted buttons. */}
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <ProspectionDocumentButtons prospectionId={p.id} hasProspect={!!p.prospectId} />
          {/* Static — pas encore relié à un vrai standard VOIP, juste
              l'affordance visuelle (voir instructions/from_front.md pour la
              demande d'intégration si/quand elle est priorisée). */}
          <Button variant="outline" size="sm" className="h-8 w-full sm:w-auto" onClick={() => showToast('Intégration VOIP à venir.')}>
            <Phone data-icon="inline-start" /> Appeler
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-full sm:w-auto" onClick={() => setShowInteractionForm(true)}>
            Ajouter une action
          </Button>
          {!p.fermee && !showArchiver && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
              onClick={() => setShowArchiver(true)}
              disabled={busy}
            >
              Clôturer
            </Button>
          )}

          <Separator orientation="vertical" className="hidden h-6 sm:block" />

          {isPre ? (
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => setShowCreateProspect(true)}>
              + Créer prospect
            </Button>
          ) : !p.commercialId ? (
            ownCommercial ? (
              // The connected user is themselves an assignable commercial —
              // no picker needed, they can only transform onto themselves.
              // Name shown read-only (not an input) so it's unmistakably
              // not an editable field.
              <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
                <div className="flex h-9 items-center rounded-md border border-input bg-muted/30 px-3 text-label text-muted-foreground sm:w-48">
                  {commercialLabel(ownCommercial)}
                </div>
                <Button size="sm" className="w-full sm:w-auto" onClick={() => handleTransform(ownCommercial.id)} disabled={busy}>
                  Transformer
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
                <Select items={commercialItems} value={transformCommercial} onValueChange={(v) => setTransformCommercial(v as string | null)}>
                  <SelectTrigger aria-label="Commercial" size="sm" className="w-full sm:w-auto">
                    <SelectValue placeholder="Commercial…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {commercialItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button size="sm" className="w-full sm:w-auto" onClick={() => transformCommercial && handleTransform(transformCommercial)} disabled={!transformCommercial || busy}>
                  Transformer
                </Button>
              </div>
            )
          ) : p.dossierId ? (
            // Already converted — go straight to the existing dossier
            // instead of the creation form. `dossierId` isn't in the API
            // yet (see the field's comment in types.ts); this branch stays
            // dormant, falling through to "Créer un dossier" below, until
            // the backend adds it — nothing to change here once it does.
            <Button className="w-full sm:w-auto" onClick={() => navigate(`/dossiers/${p.dossierId}`)}>
              Ouvrir le dossier {p.dossierCode ? `${p.dossierCode}` : ''}
            </Button>
          ) : (
            <Button className="w-full sm:w-auto" onClick={() => navigate(`/prospections/${p.id}/nouveau-dossier`)} disabled={p.fermee}>
              Créer un dossier
            </Button>
          )}
        </div>
      </div>

      {showArchiver && (
        <Card title="Clôturer la prospection" action={<Button variant="ghost" size="sm" onClick={() => setShowArchiver(false)}>Annuler</Button>}>
          <div className="flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-60">
              <div className="mb-1 text-micro font-medium text-muted-foreground">Raison</div>
              <RefSelect id="raison" value={raisonId} onChange={setRaisonId} items={referentielItems(raisons.data)} />
            </div>
            <div className="min-w-0 flex-1 sm:min-w-60">
              <div className="mb-1 text-micro font-medium text-muted-foreground">Détail (optionnel)</div>
              <Input value={raisonTexte} onChange={(e) => setRaisonTexte(e.target.value)} />
            </div>
            <Button size="sm" onClick={handleArchiver} disabled={busy} className="w-full text-destructive-foreground sm:w-auto">
              Confirmer la clôture
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {!p.fermee && (
          <Card>
            {showStepper && (
              <div>
                <div className="flex items-center">
                  {PIPELINE_STAGES.map((stage, i) => (
                    <div className="flex flex-1 items-center" key={stage}>
                      <div className={cn('flex flex-col items-center', i === PIPELINE_STAGES.length - 1 ? 'flex-none' : 'flex-1')}>
                        <div
                          className={cn(
                            'flex size-5.5 shrink-0 items-center justify-center rounded-full border-2 text-micro font-bold transition-colors duration-300',
                            i <= stageIdx ? 'text-white' : 'border-border bg-(--neutral-bg) text-muted-foreground'
                          )}
                          style={i <= stageIdx ? { borderColor: sectionAccent, background: sectionAccent } : undefined}
                        >
                          {i + 1}
                        </div>
                        <div className="mt-1.5 hidden text-center text-micro text-muted-foreground sm:block">{PIPELINE_STAGE_SHORT[stage]}</div>
                      </div>
                      {i < PIPELINE_STAGES.length - 1 && (
                        <div
                          className={cn('mx-0.5 h-0.5 flex-1 transition-colors duration-300', i >= stageIdx && 'bg-border')}
                          style={i < stageIdx ? { background: sectionAccent } : undefined}
                        />
                      )}
                    </div>
                  ))}
                </div>
                {/* Step labels double as a caption on mobile instead of sitting
                    under every dot — five ~19-char French labels squeezed to a
                    ~68px column each would wrap into an unreadable ladder on a
                    360px screen; naming only the current step keeps the
                    stepper legible without losing the "where am I" info. */}
                <div className="mt-2 text-center text-body font-medium text-foreground sm:hidden">
                  Étape {stageIdx + 1}/{PIPELINE_STAGES.length} · {PIPELINE_STAGE_SHORT[PIPELINE_STAGES[stageIdx]]}
                </div>
              </div>
            )}

            <div className={cn('flex flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center', showStepper && 'mt-4 border-t border-border pt-4')}>
              <span className="text-micro font-medium text-muted-foreground">Changer d'étape :</span>
              <div className="w-full sm:w-55">
                <RefSelect id="etape" value={etapeId} onChange={setEtapeId} items={referentielItems(etapes.data)} placeholder="Choisir une étape…" />
              </div>
              <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={handleChangeEtape} disabled={!etapeId || busy}>
                Appliquer
              </Button>
            </div>
          </Card>
        )}

        {p.fermee && (
          <Card title="Motif de clôture">
            <FieldGrid>
              <Field label="Date de clôture" value={formatDate(p.dateFermeture)} />
              <Field label="Motif" value={p.raisonFermeture} />
            </FieldGrid>
            {p.raisonFermetureTexte && (
              <div className="mt-3.5">
                <div className="mb-1.5 text-micro font-medium text-muted-foreground">Détail</div>
                <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-label leading-relaxed text-foreground">
                  {p.raisonFermetureTexte}
                </div>
              </div>
            )}
          </Card>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as ProspectionTab)} className="gap-3">
          {/* The tabs' own w-fit sizing means four labels plus three count
           * badges can outgrow a narrow phone screen — an overflow-x-auto
           * wrapper lets the row scroll instead of overflowing the page or
           * squeezing "Historique" onto two lines. -mx-4/px-4 matches
           * `.page`'s own 16px mobile gutter (index.css, ≤880px) so the
           * scrollable edge sits flush with the page instead of clipping
           * mid-padding; the 880px threshold mirrors that same breakpoint. */}
          <div className="-mx-4 overflow-x-auto px-4 min-[881px]:mx-0 min-[881px]:overflow-visible min-[881px]:px-0">
            <TabsList>
              <TabsTrigger value="apercu">Aperçu</TabsTrigger>
              {p.prospectId && <TabsTrigger value="prospect">Prospect</TabsTrigger>}
              <TabsTrigger value="article">
                Article
                {(autresTranches.data?.length ?? 0) > 0 && <Badge tone="neutral" className="ml-1.5">{autresTranches.data!.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="devis">
                Devis {(devis.data?.totalElements ?? 0) > 0 && <Badge tone="neutral" className="ml-1.5">{devis.data!.totalElements}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="historique">
                Historique
                {(interactions.data?.totalElements ?? 0) > 0 && <Badge tone="neutral" className="ml-1.5">{interactions.data!.totalElements}</Badge>}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="apercu">
            <div className="flex flex-col gap-3">
              <Card title="Contact" accent={sectionAccent}>
                <FieldGrid>
                  <Field label="Nom" value={p.prospectNom} />
                  {isPre && <Field label="Description (temp.)" value={p.tempDescription} />}
                  {isPre && <Field label="Téléphone (temp.)" value={p.tempTel} />}
                  {isPre && <Field label="Email (temp.)" value={p.tempEmail} />}
                </FieldGrid>
                {!p.prospectId && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Aucune fiche prospect liée — utilisez « Créer prospect » ci-dessus pour en lier une.
                  </p>
                )}
              </Card>

              <Card
                title="Détails de la recherche"
                action={
                  editingInfo ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingInfo(false)}>Annuler</Button>
                      <Button size="sm" onClick={saveInfo} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={startEditInfo}>Modifier</Button>
                  )
                }
              >
                {editingInfo && infoForm ? (
                  <FieldGroup>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      <FormField>
                        <FieldLabel htmlFor="f-origine">Origine</FieldLabel>
                        <RefSelect
                          id="f-origine"
                          value={infoForm.origineId ?? null}
                          onChange={(v) => setInfoForm({ ...infoForm, origineId: v ?? undefined, origineSupportId: undefined })}
                          items={origines.data.map((o) => ({ label: o.description || o.code || o.id, value: o.id }))}
                        />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-support">Support / campagne</FieldLabel>
                        <RefSelect
                          id="f-support"
                          value={infoForm.origineSupportId ?? null}
                          onChange={(v) => setInfoForm({ ...infoForm, origineSupportId: v ?? undefined })}
                          items={referentielItems(supports.data ?? [])}
                        />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-vocation">Vocation</FieldLabel>
                        <RefSelect
                          id="f-vocation"
                          value={infoForm.vocationId ?? null}
                          onChange={(v) => setInfoForm({ ...infoForm, vocationId: v ?? undefined })}
                          items={referentielItems(vocations.data)}
                        />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-typeContact">Type de contact</FieldLabel>
                        <RefSelect
                          id="f-typeContact"
                          value={infoForm.typeContactId ?? null}
                          onChange={(v) => setInfoForm({ ...infoForm, typeContactId: v ?? undefined })}
                          items={referentielItems(typesContact.data)}
                        />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-action">Action commerciale</FieldLabel>
                        <RefSelect
                          id="f-action"
                          value={infoForm.actionCommercialeId ?? null}
                          onChange={(v) => setInfoForm({ ...infoForm, actionCommercialeId: v ?? undefined })}
                          items={referentielItems(actionsCommerciales.data)}
                        />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-prix">Prix min (DH)</FieldLabel>
                        <Input name="f-prix" id="f-prix" type="number" value={infoForm.prix ?? ''} onChange={(e) => setInfoForm({ ...infoForm, prix: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-prixJusqua">Prix max (DH)</FieldLabel>
                        <Input name="f-prixJusqua" id="f-prixJusqua" type="number" value={infoForm.prixJusqua ?? ''} onChange={(e) => setInfoForm({ ...infoForm, prixJusqua: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-surface">Superficie min (m²)</FieldLabel>
                        <Input name="f-surface" id="f-surface" type="number" value={infoForm.surface ?? ''} onChange={(e) => setInfoForm({ ...infoForm, surface: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-surfaceJusqua">Superficie max (m²)</FieldLabel>
                        <Input name="f-surfaceJusqua" id="f-surfaceJusqua" type="number" value={infoForm.surfaceJusqua ?? ''} onChange={(e) => setInfoForm({ ...infoForm, surfaceJusqua: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-avance">Avance (DH)</FieldLabel>
                        <Input name="f-avance" id="f-avance" type="number" value={infoForm.avance ?? ''} onChange={(e) => setInfoForm({ ...infoForm, avance: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-fondsPropres">Fonds propres (DH)</FieldLabel>
                        <Input name="f-fondsPropres" id="f-fondsPropres" type="number" value={infoForm.financementFondsPropres ?? ''} onChange={(e) => setInfoForm({ ...infoForm, financementFondsPropres: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-credit">Crédit (DH)</FieldLabel>
                        <Input name="f-credit" id="f-credit" type="number" value={infoForm.financementCredit ?? ''} onChange={(e) => setInfoForm({ ...infoForm, financementCredit: Number(e.target.value) || undefined })} />
                      </FormField>
                      <FormField>
                        <FieldLabel htmlFor="f-autre">Autre financement (DH)</FieldLabel>
                        <Input name="f-autre" id="f-autre" type="number" value={infoForm.financementAutre ?? ''} onChange={(e) => setInfoForm({ ...infoForm, financementAutre: Number(e.target.value) || undefined })} />
                      </FormField>
                    </div>
                    <FormField className="mt-3.5">
                      <FieldLabel htmlFor="f-notes">Notes</FieldLabel>
                      <Textarea id="f-notes" value={infoForm.notes ?? ''} onChange={(e) => setInfoForm({ ...infoForm, notes: e.target.value })} />
                    </FormField>
                  </FieldGroup>
                ) : (
                  <>
                    <FieldGrid>
                      <Field label="Origine" value={p.origine ? <Badge tone="info">{p.origine}</Badge> : undefined} />
                      <Field label="Support / campagne" value={p.origineSupport} />
                      <Field label="Vocation" value={p.vocation} />
                      <Field label="Type de contact" value={p.typeContact} />
                      <Field label="Action commerciale" value={p.actionCommerciale} />
                      <Field label="Prix min" value={p.prix ? formatCurrency(p.prix) : undefined} />
                      <Field label="Prix max" value={p.prixJusqua ? formatCurrency(p.prixJusqua) : undefined} />
                      <Field label="Superficie min" value={p.surface ? `${p.surface} m²` : undefined} />
                      <Field label="Superficie max" value={p.surfaceJusqua ? `${p.surfaceJusqua} m²` : undefined} />
                      <Field label="Avance" value={p.avance ? formatCurrency(p.avance) : undefined} />
                      <Field label="Fonds propres" value={p.financementFondsPropres ? formatCurrency(p.financementFondsPropres) : undefined} />
                      <Field label="Crédit" value={p.financementCredit ? formatCurrency(p.financementCredit) : undefined} />
                      <Field label="Autre financement" value={p.financementAutre ? formatCurrency(p.financementAutre) : undefined} />
                      <Field label="Ancien client" value={p.ancienClient ? 'Oui' : 'Non'} />
                      <Field label="Proposé par" value={p.proposeurNom} />
                    </FieldGrid>
                    {p.notes && (
                      <div className="mt-3.5 border-t border-border pt-3.5">
                        <div className="mb-1.5 text-micro font-medium text-muted-foreground">Notes</div>
                        <div className="whitespace-pre-wrap text-label leading-relaxed text-foreground">{p.notes}</div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            </div>
          </TabsContent>

          {p.prospectId && (
            <TabsContent value="prospect">
              {/* Cascade reference to the linked Prospect — mirrors the
                  same "reference the previous pipeline stage" pattern as
                  Dossier→Prospection and Prospect→Prospections-d'origine. */}
              <Card
                title="Prospect"
                accent="var(--sec-prospect)"
                action={
                  <Link to={`/prospects/${p.prospectId}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    Fiche complète <ArrowUpRight className="size-3" />
                  </Link>
                }
              >
                {linkedProspect.loading && <LoadingState />}
                {linkedProspect.error && <ErrorState message={linkedProspect.error} />}
                {linkedProspect.data && (
                  <FieldGrid>
                    <Field label="Nom" value={p.prospectNom || `${linkedProspect.data.prenom || ''} ${linkedProspect.data.nom || ''}`.trim()} />
                    <Field label="Type" value={linkedProspect.data.type} />
                    <Field label="Téléphone" value={linkedProspect.data.telephone || linkedProspect.data.mobile} />
                    <Field label="Email" value={linkedProspect.data.email} />
                    <Field label="Ville" value={linkedProspect.data.ville} />
                    <Field label="Commercial" value={linkedProspect.data.commercialNom} />
                  </FieldGrid>
                )}
              </Card>
            </TabsContent>
          )}

          <TabsContent value="article">
            <div className="flex flex-col gap-3">
              <ChoixArticleSection
                prospectionId={p.id}
                trancheId={p.trancheId}
                articleId={p.articleId}
                onUpdated={async () => { await refetch(); showToast('Tranche/article principal mis à jour.'); }}
                onAdded={async () => { await autresTranches.refetch(); showToast('Article ajouté.'); }}
                navigate={navigate}
              />

              <ArticlesAssociesSection
                prospectionId={p.id}
                items={autresTranches.data ?? []}
                onRemove={async (itemId) => { await removeProspectionAutreTranche(p.id, itemId); autresTranches.refetch(); }}
                onEdited={async () => { await autresTranches.refetch(); showToast('Article mis à jour.'); }}
                navigate={navigate}
              />
            </div>
          </TabsContent>

          <TabsContent value="devis">
            <div className="flex flex-col gap-3">
              <DevisFormSection
                defaultTrancheId={p.trancheId}
                defaultArticleId={p.articleId}
                defaultProspectId={p.prospectId ?? undefined}
                defaultCommercialId={p.commercialId ?? undefined}
                onAdd={async (body) => { await creerDevis(p.id, body); await devis.refetch(); showToast('Offre créée.'); }}
              />

              <Card title={`Offres (${devis.data?.totalElements ?? 0})`}>
                {devis.loading && <LoadingState />}
                {devis.error && <ErrorState message={devis.error} />}
                {devis.data && devis.data.content.length === 0 && <EmptyState title="Aucune offre" message="Créez une offre ci-dessus pour en voir apparaître ici." />}
                {devis.data && devis.data.content.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {devis.data.content.map((dv) => (
                      <DevisRow key={dv.id} prospectionId={p.id} devis={dv} />
                    ))}
                  </div>
                )}
                {devis.data && (
                  <Pagination page={devis.data.page} totalPages={devis.data.totalPages} totalElements={devis.data.totalElements} onPageChange={setDevisPage} />
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="historique">
            <div className="flex flex-col gap-3">
              <Card title={`Parcours (${parcours.data?.totalElements ?? 0})`}>
                {parcours.loading && <LoadingState />}
                {parcours.error && <ErrorState message={parcours.error} />}
                {parcours.data && parcours.data.content.length === 0 && (
                  <p className="text-label text-muted-foreground">
                    Aucune transition tracée pour l'instant — apparaîtra ici dès que cette fiche sera liée à un
                    prospect ou transformée en prospection qualifiée.
                  </p>
                )}
                {parcours.data && parcours.data.content.length > 0 && (
                  <div className="flex flex-col">
                    {parcours.data.content.map((h, i) => (
                      <div className="relative flex gap-3 pb-4.5 last:pb-0" key={h.id}>
                        <div className="flex shrink-0 flex-col items-center">
                          <div className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                          {i < parcours.data!.content.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-border" />}
                        </div>
                        <div className="min-w-0 flex-1 pb-0.5">
                          <div className="text-label font-semibold text-foreground">{h.workflowDescription || h.statutDescription || 'Événement'}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(h.date)} · {h.utilisateur || 'Système'}</div>
                          {h.description && <div className="mt-1 text-body text-foreground">{h.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {parcours.data && (
                  <Pagination
                    page={parcours.data.page}
                    totalPages={parcours.data.totalPages}
                    totalElements={parcours.data.totalElements}
                    onPageChange={setParcoursPage}
                  />
                )}
              </Card>

              <Card title={`Actions (${interactions.data?.totalElements ?? 0})`}>
                {interactions.loading && <LoadingState />}
                {interactions.error && <ErrorState message={interactions.error} />}
                {interactions.data && interactions.data.content.length === 0 && (
                  <p className="text-label text-muted-foreground">Aucune action enregistrée pour cette prospection.</p>
                )}
                {interactions.data && interactions.data.content.length > 0 && (
                  <div className="flex flex-col">
                    {interactions.data.content.map((c, i) => (
                      <div className="relative flex gap-3 pb-4.5 last:pb-0" key={c.id}>
                        <div className="flex shrink-0 flex-col items-center">
                          <div className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                          {i < interactions.data!.content.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-border" />}
                        </div>
                        <div className="min-w-0 flex-1 pb-0.5">
                          <div className="flex flex-wrap items-center gap-1.5 text-label font-semibold text-foreground">
                            <span className="inline-flex text-(--brand)">{interactionIcon(c.entrante)}</span>
                            {c.actionType || (c.entrante ? 'Entrant' : 'Sortant')}
                            {c.resultat && <Badge tone={c.dateRdv ? 'success' : 'neutral'}>{c.resultat}</Badge>}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{formatDate(c.date)} · {c.employeNom || 'Système'}</div>
                          {c.description && <div className="mt-1 text-body text-foreground">{c.description}</div>}
                          {(c.dateRdv || c.dateAlerte) && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {c.dateRdv && <Badge tone="success">RDV le {formatDate(c.dateRdv)}</Badge>}
                              {c.dateAlerte && <Badge tone="warning">Alerte jusqu'au {formatDate(c.dateAlerte)}</Badge>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {interactions.data && (
                  <Pagination
                    page={interactions.data.page}
                    totalPages={interactions.data.totalPages}
                    totalElements={interactions.data.totalElements}
                    onPageChange={setInteractionsPage}
                  />
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showCreateProspect && (
        <CreateProspectForm
          preProspectionId={p.id}
          initial={createProspectInitial}
          onClose={() => setShowCreateProspect(false)}
          onSubmit={() => {
            refetch();
            showToast('Prospection convertie — fiche prospect créée et liée.');
          }}
        />
      )}

      {showInteractionForm && (
        <InteractionForm
          onClose={() => setShowInteractionForm(false)}
          onSubmit={async (input) => {
            await addInteraction(p!.id, input);
            interactions.refetch();
            showToast('Action enregistrée.');
          }}
        />
      )}

      {toast && (
        <div role="status" aria-live="polite" className="fixed inset-x-4 bottom-4 z-50 rounded-lg bg-foreground px-4.5 py-3 text-center text-label font-medium text-background shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:text-left">
          {toast}
        </div>
      )}
    </PageShell>
  );
}

/** Full detail table of an article/sous-article result set — every row shown
 * with code, description, catégorie, type, surface, prix and statut (not
 * just a bare code list), click a row to select it. As soon as a tranche is
 * picked and no Catégorie/Type filter is set yet, this shows *every*
 * available article for that tranche with full details; ticking a filter
 * narrows the same table in place. Mirrors the backend's guidance: the user
 * picks the article from *this* filtered list, never from a dropdown of
 * every article in the tranche. */
/** Full référentiel picker reproducing the legacy "Choix article" form's
 * exact mechanic (per the backend's implementation guide on the
 * `Référentiels` OpenAPI tag): the user narrows by Projet → Tranche, ticks
 * Catégorie/Type checkboxes (loaded once, independent of the tranche), and
 * picks the article from the resulting filtered list — never from a raw
 * dropdown of every article. Sous-article picking (if the chosen article has
 * any) replays the same mechanic one level down. Self-contained; reused both
 * to update a prospection's primary tranche/article ("tranche principale",
 * `onModifier`) and to add entries to its "Articles associés" list
 * (`onAjouter`) — both buttons render side by side when both are passed, so
 * either action is one click away from the same picked article; resets
 * itself after either succeeds.
 *
 * When `principalTrancheId` is given (i.e. this picker can modify the
 * tranche principale), "Modifier" is only enabled while the tranche
 * currently selected in the picker still matches it — switching to a
 * different tranche means the pick can only become a secondary interest
 * ("Ajouter"), per the backend's `tranche-principale` vs. `autres-tranches`
 * split: the principal tranche/article is never silently overwritten by
 * picking an article in a different tranche. */
function ArticleCascadePicker({
  onModifier,
  onAjouter,
  onCancel,
  initialTrancheId,
  initialArticleId,
  principalTrancheId,
}: {
  onModifier?: (trancheId: string, articleId?: string) => Promise<void>;
  onAjouter?: (trancheId: string, articleId?: string) => Promise<void>;
  onCancel?: () => void;
  initialTrancheId?: string;
  initialArticleId?: string;
  principalTrancheId?: string;
}) {
  const projets = useApi(() => getProjetsReferentiel(), []);
  const categoriesRef = useCategoriesBien();
  const typesRef = useTypesBienReferentiel();

  const [projetId, setProjetId] = useState<string | null>(null);
  const [trancheId, setTrancheId] = useState<string | null>(initialTrancheId ?? null);
  const [categorieIds, setCategorieIds] = useState<string[]>([]);
  const [typeIds, setTypeIds] = useState<string[]>([]);
  const [onlyDisponible, setOnlyDisponible] = useState(!initialArticleId);
  const [articleId, setArticleId] = useState<string | null>(initialArticleId ?? null);
  const [sousArticleId, setSousArticleId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPrincipalTranche = !principalTrancheId || trancheId === principalTrancheId;

  const tranches = useApi(() => getTranchesReferentiel(projetId ?? undefined), [projetId]);

  const filters: ArticleReferentielFilters = {
    statut: onlyDisponible ? 'DISPONIBLE' : undefined,
    categorieId: categorieIds.length > 0 ? categorieIds : undefined,
    typeId: typeIds.length > 0 ? typeIds : undefined,
  };
  const articles = useApi(
    () => (trancheId ? getArticlesReferentiel(trancheId, filters) : Promise.resolve([])),
    [trancheId, onlyDisponible, categorieIds, typeIds],
  );
  const sousArticles = useApi(
    () => (articleId ? getSousArticlesReferentiel(articleId, filters) : Promise.resolve([])),
    [articleId, onlyDisponible, categorieIds, typeIds],
  );

  // Full detail (catégorie, type, surface, prix, statut…) of whichever is
  // currently picked — the sous-article if one is chosen, else the article —
  // via `GET /api/articles/{id}`, which resolves either indifferently.
  const selectedId = sousArticleId || articleId;
  const selected = useApi(() => (selectedId ? getArticle(selectedId) : Promise.resolve(null)), [selectedId]);

  function setCategorieIdsAndReset(ids: string[]) {
    setCategorieIds(ids);
    setArticleId(null);
    setSousArticleId(null);
  }
  function setTypeIdsAndReset(ids: string[]) {
    setTypeIds(ids);
    setArticleId(null);
    setSousArticleId(null);
  }

  async function handleAction(action: (trancheId: string, articleId?: string) => Promise<void>) {
    if (!trancheId) return;
    setSaving(true);
    setError(null);
    try {
      await action(trancheId, sousArticleId || articleId || undefined);
      setProjetId(null);
      setTrancheId(null);
      setCategorieIds([]);
      setTypeIds([]);
      setArticleId(null);
      setSousArticleId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'opération.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        <RefSelect
          id="cascade-projet"
          label="Projet"
          value={projetId}
          onChange={(v) => { setProjetId(v); setTrancheId(null); setArticleId(null); setSousArticleId(null); }}
          items={referentielItems(projets.data ?? [])}
          placeholder="Tous les projets"
        />
        <RefSelect
          id="cascade-tranche"
          label="Tranche"
          value={trancheId}
          onChange={(v) => { setTrancheId(v); setArticleId(null); setSousArticleId(null); }}
          items={referentielItems(tranches.data ?? [])}
          placeholder="Choisir une tranche…"
        />
        <MultiSelectDropdown
          label="Catégorie"
          placeholder="Toutes"
          value={categorieIds}
          onChange={setCategorieIdsAndReset}
          items={referentielItems(categoriesRef.data)}
        />
        <MultiSelectDropdown
          label="Type"
          placeholder="Tous"
          value={typeIds}
          onChange={setTypeIdsAndReset}
          items={referentielItems(typesRef.data)}
        />
        <label className="flex items-center gap-1.5 text-body text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyDisponible}
            onChange={(e) => { setOnlyDisponible(e.target.checked); setArticleId(null); setSousArticleId(null); }}
            className="size-3.5"
          />
          Disponibles uniquement
        </label>
      </div>

      {trancheId && (
        <div className="flex flex-col gap-1">
          <span className="text-micro font-medium text-muted-foreground">
            Articles {articles.data ? `(${articles.data.length})` : ''}
          </span>
          <ArticleResultsList
            items={articles.data ?? []}
            loading={articles.loading}
            selectedId={articleId}
            onSelect={(id) => { setArticleId(id); setSousArticleId(null); }}
          />
        </div>
      )}

      {articleId && (
        <div className="flex flex-col gap-1">
          <span className="text-micro font-medium text-muted-foreground">
            Sous-article {sousArticles.data && sousArticles.data.length > 0 ? `(${sousArticles.data.length})` : '(aucun)'}
          </span>
          {sousArticles.data && sousArticles.data.length > 0 ? (
            <ArticleResultsList
              items={sousArticles.data}
              loading={sousArticles.loading}
              selectedId={sousArticleId}
              onSelect={setSousArticleId}
              allowNone
              noneLabel="Aucun — utiliser l'article lui-même"
            />
          ) : (
            <p className="text-body text-muted-foreground">Cet article n'a pas de sous-article.</p>
          )}
        </div>
      )}

      {selectedId && <ArticleCompactPreview article={selected.data ?? null} loading={selected.loading} />}

      <div className="flex gap-2">
        {onModifier && (
          <Button type="button" size="sm" variant="outline" disabled={!trancheId || !isPrincipalTranche || saving} onClick={() => handleAction(onModifier)}>
            <Pencil data-icon="inline-start" /> Modifier
          </Button>
        )}
        {onAjouter && (
          <Button type="button" size="sm" disabled={!trancheId || saving} onClick={() => handleAction(onAjouter)}>
            <Plus data-icon="inline-start" /> Ajouter
          </Button>
        )}
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
      {principalTrancheId && trancheId && (
        <p className="text-micro text-muted-foreground">
          {isPrincipalTranche
            ? 'Modifiera la tranche/article principal de la prospection.'
            : 'Tranche différente de la tranche principale — utilisez « Ajouter » pour l\'associer comme intérêt secondaire.'}
        </p>
      )}
      {error && <p role="alert" className="text-body text-destructive">{error}</p>}
    </div>
  );
}

/** "Choix article" section — every prospection carries a "tranche
 * principale" (per the backend's implementation guide on the `Prospections`
 * tag), even before an article is picked within it, so the tranche selector
 * below defaults to it. Picking a different article *within* that same
 * tranche and confirming "Modifier" updates the principal tranche/article
 * via `PATCH /api/prospections/{id}/tranche-principale` (the only endpoint
 * allowed to touch those two fields). Switching to a *different* tranche
 * disables "Modifier" — the picker falls back to "Ajouter", which appends
 * the pick to "Articles associés" (a secondary interest) instead, never
 * silently replacing the tranche principale. */
function ChoixArticleSection({
  prospectionId,
  trancheId,
  articleId,
  onUpdated,
  onAdded,
  navigate,
}: {
  prospectionId: string;
  trancheId?: string;
  articleId?: string;
  onUpdated: () => Promise<void>;
  onAdded: () => Promise<void>;
  navigate: (path: string) => void;
}) {
  const current = useApi(() => (articleId ? getArticle(articleId) : Promise.resolve(null)), [articleId]);
  const currentTranche = useApi(() => (trancheId ? getTranche(trancheId) : Promise.resolve(null)), [trancheId]);
  // Same "seen it, now tucked behind Modifier" pattern as the dossier-creation
  // article picker (`NewDossier.tsx`): once a tranche principale is already
  // set, the full projet/tranche/catégorie/type picker + article table stays
  // collapsed by default instead of always spilling a 40+ row list under an
  // already-answered question. Forced open only while there's nothing to show
  // yet, so the first pick is never hidden behind an extra click.
  const [editing, setEditing] = useState(false);
  const showPicker = editing || !trancheId;

  return (
    <Card
      title="Choix article"
      action={
        trancheId ? (
          editing ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Terminé
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil data-icon="inline-start" /> Modifier
            </Button>
          )
        ) : undefined
      }
    >
      <div className={cn('flex flex-col gap-1.5', showPicker && 'mb-3.5 border-b border-border pb-3.5')}>
        <span className="text-micro font-medium text-muted-foreground">Tranche principale</span>
        {trancheId ? (
          <button
            type="button"
            onClick={() => navigate(`/tranches/${trancheId}`)}
            className="inline-flex w-fit items-center gap-1 rounded-md border border-border bg-(--neutral-bg) px-2.5 py-1 text-body font-semibold text-primary hover:underline"
          >
            {currentTranche.data?.description || currentTranche.data?.code || 'Tranche'} <ArrowUpRight className="size-2.5" />
          </button>
        ) : (
          <span className="text-body text-muted-foreground">Aucune tranche principale définie pour l'instant.</span>
        )}
        <div className="mt-1">
          {articleId ? (
            <ArticleCompactPreview article={current.data ?? null} loading={current.loading} emptyLabel="Aucun article principal sélectionné." />
          ) : (
            <span className="text-body text-muted-foreground">Aucun article principal sélectionné pour l'instant.</span>
          )}
        </div>
      </div>

      {showPicker && (
        <ArticleCascadePicker
          principalTrancheId={trancheId}
          initialTrancheId={trancheId}
          initialArticleId={articleId}
          onCancel={trancheId ? () => setEditing(false) : undefined}
          onModifier={async (tId, aId) => {
            await modifierTranchePrincipale(prospectionId, { trancheId: tId, articleId: aId });
            setEditing(false);
            await onUpdated();
          }}
          onAjouter={async (tId, aId) => {
            await addProspectionAutreTranche(prospectionId, { trancheId: tId, articleId: aId });
            setEditing(false);
            await onAdded();
          }}
        />
      )}
    </Card>
  );
}

/** One row of `ArticlesAssociesSection` — same compact-code/+Détails concept
 * as the "Article visé" preview, fetching the article's full detail so its
 * catégorie/type/surface/prix are one click away instead of a bare label.
 * "Modifier" opens an inline `ArticleCascadePicker` pre-filled with this
 * row's current tranche/article; since the backend has no PATCH for a single
 * `autres-tranches` entry, confirming replaces it under the hood (remove the
 * old entry, add the newly picked one) but reads as a single edit in the UI. */
function ArticleAssocieRow({
  prospectionId,
  item,
  article,
  articleLoading,
  onRemove,
  onEdited,
  navigate,
}: {
  prospectionId: string;
  item: { id: string; trancheId?: string; tranche?: string; articleId?: string; article?: string };
  /** Résolu en lot par le parent — voir `ArticlesAssociesSection`. */
  article: ArticleDetailDto | null;
  articleLoading: boolean;
  onRemove: (itemId: string) => Promise<void>;
  onEdited: () => Promise<void>;
  navigate: (path: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const confirm = useConfirm();

  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-label font-medium text-foreground">{item.tranche || item.trancheId}</span>
        <div className="flex items-center gap-1">
          {item.trancheId && (
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/tranches/${item.trancheId}`)}>
              Voir la tranche <ArrowUpRight className="size-2.5" />
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
            <Pencil data-icon="inline-start" /> Modifier
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Retirer ${item.article || item.tranche || 'cet article associé'}`}
            onClick={async () => {
              const ok = await confirm({
                title: 'Retirer l’article associé',
                message: `Retirer « ${item.article || item.tranche || 'cet article'} » des articles associés ? La suppression est immédiate et définitive.`,
                confirmLabel: 'Retirer',
                cancelLabel: 'Annuler',
              });
              if (ok) await onRemove(item.id);
            }}
          >
            <X className="text-destructive" />
          </Button>
        </div>
      </div>
      {item.articleId ? (
        <div className="mt-1.5">
          <ArticleCompactPreview article={article} loading={articleLoading} bare />
        </div>
      ) : (
        item.article && <span className="mt-1 block text-body text-muted-foreground">{item.article}</span>
      )}
      {editing && (
        <div className="mt-3 border-t border-border pt-3">
          <ArticleCascadePicker
            initialTrancheId={item.trancheId}
            initialArticleId={item.articleId}
            onCancel={() => setEditing(false)}
            onModifier={async (tId, aId) => {
              // L'API n'expose pas de mise à jour : « Modifier » est en réalité
              // une suppression suivie d'une création. Si la création échoue,
              // l'association d'origine est déjà perdue — on tente donc de la
              // rétablir, et on remonte l'erreur au lieu de l'avaler.
              await removeProspectionAutreTranche(prospectionId, item.id);
              try {
                await addProspectionAutreTranche(prospectionId, { trancheId: tId, articleId: aId });
              } catch (err) {
                await addProspectionAutreTranche(prospectionId, {
                  trancheId: item.trancheId,
                  articleId: item.articleId,
                }).catch(() => {});
                await onEdited();
                throw err;
              }
              setEditing(false);
              await onEdited();
            }}
          />
        </div>
      )}
    </div>
  );
}

/** "Articles associés" — the prospection's list of secondary tranche/article
 * interests (`/api/prospections/{id}/autres-tranches`), each row resolved to
 * its full article detail (not raw UUIDs), with per-row "Modifier"/remove
 * actions. Brand new entries are added from the picker above
 * (`ChoixArticleSection`'s "Ajouter" button), not from here. */
function ArticlesAssociesSection({
  prospectionId,
  items,
  onRemove,
  onEdited,
  navigate,
}: {
  prospectionId: string;
  items: { id: string; trancheId?: string; tranche?: string; articleId?: string; article?: string }[];
  onRemove: (itemId: string) => Promise<void>;
  onEdited: () => Promise<void>;
  navigate: (path: string) => void;
}) {
  // Les détails d'article sont résolus ici, en un seul `Promise.all`, plutôt
  // qu'un `useApi` par ligne : chaque ligne déclenchait sa propre requête, soit
  // N requêtes pour N articles associés. Même forme que `articleDetails` dans
  // DossierDetail.tsx, y compris la clé `join(',')` qui évite de refetcher
  // quand seule l'identité du tableau change.
  const articleIds = items.map((t) => t.articleId).filter((v): v is string => !!v);
  const articleIdsKey = articleIds.join(',');
  const articles = useApi(
    () => (articleIds.length > 0 ? Promise.all(articleIds.map((aId) => getArticle(aId))) : Promise.resolve([])),
    [articleIdsKey],
  );
  const articleById = useMemo(() => {
    const m = new Map<string, ArticleDetailDto>();
    for (const a of articles.data ?? []) if (a) m.set(a.id, a);
    return m;
  }, [articles.data]);

  return (
    <Card title="Articles associés">
      <div className="flex flex-col gap-2">
        {items.length === 0 && <span className="text-body text-muted-foreground">Aucun article associé pour l'instant.</span>}
        {items.map((t) => (
          <ArticleAssocieRow
            key={t.id}
            prospectionId={prospectionId}
            item={t}
            article={t.articleId ? (articleById.get(t.articleId) ?? null) : null}
            articleLoading={articles.loading}
            onRemove={onRemove}
            onEdited={onEdited}
            navigate={navigate}
          />
        ))}
      </div>
    </Card>
  );
}

/** One row of the "Offres" list — code/tranche/article on top, the final
 * TTC price always visible, and a "Montants" toggle revealing the full
 * HT/TTC breakdown (`montants`, a `MontantsOffreDto`) grouped the way the
 * legacy Offre form's "Montants" tab does: figures before remise, the
 * remise itself, figures after remise, then the final Prix de vente line —
 * same expand-on-demand shape as `ArticleCompactPreview`, so a dense
 * ~20-field breakdown never dumps onto the page uninvited. */
function DevisRow({ prospectionId, devis: dv }: { prospectionId: string; devis: DevisDto }) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState<'view' | 'download' | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const m = dv.montants;

  async function handleGenerateFiche(action: 'view' | 'download') {
    setGenerating(action);
    setGenError(null);
    try {
      if (action === 'view') await viewDevisDocument(prospectionId, dv.id);
      else await downloadDevisDocument(prospectionId, dv.id, `offre-${dv.code}.pdf`);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Échec de la génération.");
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-label font-semibold text-foreground">{dv.code}</span>
          <span className="text-body text-muted-foreground">
            {dv.trancheDescription || dv.tranche}
            {dv.articleDescription || dv.article ? ` · ${dv.articleDescription || dv.article}` : ''}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-body text-muted-foreground">{formatDate(dv.dateDocument)}</span>
          <span className="text-label font-semibold tabular-nums text-foreground">
            {m?.prixVenteTTC != null ? formatCurrency(m.prixVenteTTC) : '—'}
          </span>
          {genError && <span role="alert" className="text-micro text-destructive">{genError}</span>}
          <Button type="button" variant="outline" size="sm" className="h-6 gap-1 px-1.5 text-body" disabled={!!generating} onClick={() => handleGenerateFiche('view')}>
            <FileText className="size-3" />
            {generating === 'view' ? 'Génération…' : 'Fiche offre'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-6"
            disabled={!!generating}
            title="Télécharger la fiche offre (PDF)"
            aria-label="Télécharger la fiche offre"
            onClick={() => handleGenerateFiche('download')}
          >
            <Download className="size-3" />
          </Button>
          {m && (
            <Button type="button" variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-body" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <Minus className="size-3" /> : <Plus className="size-3" />}
              {expanded ? 'Moins de détails' : 'Montants'}
            </Button>
          )}
        </div>
      </div>

      {(dv.prospect || dv.commercial || dv.modePaiement) && (
        <div className="mt-1 text-body text-muted-foreground">
          {[dv.prospect, dv.commercial, dv.modePaiement].filter(Boolean).join(' · ')}
        </div>
      )}

      {expanded && m && (
        <div className="mt-2.5 flex flex-col gap-3 border-t border-border pt-2.5">
          <div>
            <div className="mb-1.5 text-micro font-medium text-muted-foreground">Avant remise</div>
            <FieldGrid>
              <Field label="TVA" value={m.tvaRatio != null ? `${Math.round(m.tvaRatio * 100)} %` : undefined} />
              <Field label="Prix m² HT" value={m.prixM2HT != null ? formatCurrency(m.prixM2HT) : undefined} />
              <Field label="Prix m² TTC" value={m.prixM2TTC != null ? formatCurrency(m.prixM2TTC) : undefined} />
              <Field label="Article HT" value={m.prixArticleHT != null ? formatCurrency(m.prixArticleHT) : undefined} />
              <Field label="Article TTC" value={m.prixArticleTTC != null ? formatCurrency(m.prixArticleTTC) : undefined} />
              <Field label="Sous-articles HT" value={m.prixSousArticlesHT != null ? formatCurrency(m.prixSousArticlesHT) : undefined} />
              <Field label="Sous-articles TTC" value={m.prixSousArticlesTTC != null ? formatCurrency(m.prixSousArticlesTTC) : undefined} />
              <Field label="Total HT" value={m.totalHT != null ? formatCurrency(m.totalHT) : undefined} />
              <Field label="Total TTC" value={m.totalTTC != null ? formatCurrency(m.totalTTC) : undefined} />
            </FieldGrid>
          </div>

          {(m.remisePercent ?? 0) > 0 && (
            <div>
              <div className="mb-1.5 text-micro font-medium text-muted-foreground">Remise</div>
              <FieldGrid>
                <Field label="Taux" value={m.remisePercent != null ? `${m.remisePercent} %` : undefined} />
                <Field label="Remise HT" value={m.remiseHT != null ? formatCurrency(m.remiseHT) : undefined} />
                <Field label="Remise TTC" value={m.remiseTTC != null ? formatCurrency(m.remiseTTC) : undefined} />
                <Field label="Prix m² après remise HT" value={m.prixM2ApresRemiseHT != null ? formatCurrency(m.prixM2ApresRemiseHT) : undefined} />
                <Field label="Prix m² après remise TTC" value={m.prixM2ApresRemiseTTC != null ? formatCurrency(m.prixM2ApresRemiseTTC) : undefined} />
                <Field label="Article après remise HT" value={m.prixArticleApresRemiseHT != null ? formatCurrency(m.prixArticleApresRemiseHT) : undefined} />
                <Field label="Article après remise TTC" value={m.prixArticleApresRemiseTTC != null ? formatCurrency(m.prixArticleApresRemiseTTC) : undefined} />
                <Field label="Sous-articles après remise HT" value={m.prixSousArticlesApresRemiseHT != null ? formatCurrency(m.prixSousArticlesApresRemiseHT) : undefined} />
                <Field label="Sous-articles après remise TTC" value={m.prixSousArticlesApresRemiseTTC != null ? formatCurrency(m.prixSousArticlesApresRemiseTTC) : undefined} />
              </FieldGrid>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-2.5">
            <span className="text-micro font-medium text-muted-foreground">Prix de vente final</span>
            <span className="text-label font-semibold text-foreground">HT {m.prixVenteHT != null ? formatCurrency(m.prixVenteHT) : '—'}</span>
            <span className="text-label font-semibold text-foreground">TTC {m.prixVenteTTC != null ? formatCurrency(m.prixVenteTTC) : '—'}</span>
          </div>
        </div>
      )}

      {dv.notes && (
        <div className="mt-1.5 whitespace-pre-wrap text-body text-foreground">{dv.notes}</div>
      )}
    </div>
  );
}

