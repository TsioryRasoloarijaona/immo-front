import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LienFiche from '../../components/LienFiche';
import { usePreview } from '../../lib/previewContext';
import { Archive, ArchiveRestore, ArrowRightLeft, ArrowUpRight, Download, Eye, FilePlus, FileText, Minus, Pencil, Phone, Plus, Send, X } from 'lucide-react';
import BoutonEdition from '../../components/BoutonEdition';
import CadreFiche, { EnteteFiche } from '../../components/CadreFiche';
import CoqueFiche, { type VarianteCoque } from '../../components/CoqueFiche';
import ClasseurBas from '../../components/fiche/ClasseurBas';
import ClasseurEntete from '../../components/fiche/ClasseurEntete';
import ChampFiche, { BandeFiche } from '../../components/fiche/ChampFiche';
import FenetreFiche from '../../components/fiche/FenetreFiche';
import PiedAudit from '../../components/fiche/PiedAudit';
import RubanFiche, { type ActionRuban } from '../../components/fiche/RubanFiche';
import type { VoisinsFiche } from '../../lib/fenetreFiche';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { DossierIssuBanner, InactiviteBadge, ResumeActivite } from '../../components/ActiviteProspection';
import ArticleCompactPreview from '../../components/ArticleCompactPreview';
import ArticleResultsList from '../../components/ArticleResultsList';
import CreateProspectForm, { type CreateProspectInitial } from '../../components/CreateProspectForm';
import ProspectionExistanteNotice from '../../components/ProspectionExistanteNotice';
import DevisFormSection from '../../components/DevisFormSection';
import InteractionForm from '../../components/InteractionForm';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { TimelineList, TimelineRow } from '../../components/Timeline';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import ParcoursVente from '../../components/ParcoursVente';
import { ChampLecture, ChampNotes, ChampRef, GrilleFiche } from '../../components/ChampsFiche';
import MarqueurTri from '../../components/MarqueurTri';
import { OngletAutres, OngletProfils } from '../../components/SousCollectionsProspection';
import RefSelect from '../../components/RefSelect';
import MentionPrixPlancher from '../../components/MentionPrixPlancher';
import { Button, buttonVariants } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { cn } from '../../lib/utils';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMontantOptionnel,
  formatPercent,
  formatPercentValue,
  formatTelephone,
  pluriel,
} from '../../lib/format';
import {
  PIPELINE_STAGES,
  PIPELINE_STAGE_SHORT,
  isSideTrackEtape,
  etapeBadgeTone,
  pipelineStageIndex,
  personDisplayName,
  prospectionDisplayName,
  interactionIcon,
} from '../../lib/domain';
import { useAppData, commercialLabel } from '../../lib/appData';
import { useAuth } from '../../lib/auth';
import {
  addInteraction,
  addProspectionAutreTranche,
  archiverProspection,
  desarchiverProspection,
  changerEtapeProspection,
  envoyerOffrePrix,
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
  addProspectionContact,
  listProspectionAutresTranches,
  listProspectionContacts,
  listProspectionHistorique,
  removeProspectContact,
  modifierProspection,
  modifierTranchePrincipale,
  prospectionExistanteDepuisErreur,
  removeProspectionAutreTranche,
  renvoyerEmailVisite,
  transformerProspection,
  viewDevisDocument,
  downloadDevisDocument,
  viewProspectionDocument,
  downloadProspectionDocument,
  type ProspectionPdfDocKind,
  type ArticleReferentielFilters,
} from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { CODE_PRE_PROSPECTION, CODE_PROSPECTION, calculerParcours, habillagePre, estTransformable, texteProspectionTransformee, toastProspectLie } from '../../lib/parcours';
import { useToast } from '../../lib/toastContext';
import ContactsProspect from '../../components/ContactsProspect';
import TransformerProspectionDialog from '../../components/TransformerProspectionDialog';
import { useFormulaireFiche } from '../../lib/formulaireFiche';
import {
  referentielItems,
  useActionsCommerciales,
  useCategoriesBien,
  useEtapesProspection,
  useModesPaiement,
  useOriginesProspection,
  useRaisonsCloture,
  useTypesBienReferentiel,
  useResultatsInteraction,
  useTypesContactProspection,
  useVocations,
} from '../../lib/referentiels';
import type {
  CanalEnvoiDto,
  DevisDto,
  EnvoyerOffrePrixRequest,
  ResultatEnvoiOffreDto,
  ResultatEnvoiVisiteDto,
  TransformerProspectionRequest,
} from '../../types';

type ProspectionTab =
  | 'etape'
  | 'autres-tranches'
  | 'article'
  | 'profils'
  | 'autres'
  | 'devis'
  | 'actions'
  | 'contacts';

// Masqués sur une pré-prospection : elle n'a pas encore de fiche tiers, et presque jamais d'article.
const ONGLETS_PROSPECTION_SEULE = new Set(['devis', 'contacts']);

const LIBELLE_CHAMP: Record<string, string> = {
  etapeId: 'Nature',
  origineId: 'Source de contact',
  origineSupportId: 'Support',
  vocationId: 'Vocation',
  typeContactId: 'Type',
  actionCommercialeId: 'Action commerciale',
  notes: 'Notes',
};

// Tranche et article absents exprès : le serveur les a sortis de `PATCH /api/prospections/{id}`,
// ils passent par leur endpoint propre (onglet « Choix article »).
type FormFiche = {
  etapeId: string | null;
  origineId: string | null;
  origineSupportId: string | null;
  vocationId: string | null;
  typeContactId: string | null;
  actionCommercialeId: string | null;
  notes: string;
};

// Catégorie ordinaire, jamais badgée. Libellé en dur : la catégorie n'est pas exposée en
// référentiel, c'est le texte que porte la vue légataire.
const CATEGORIE_INTERACTION_ORDINAIRE = 'Prospection';

// Plus étroit que `--fiche-col-min` : deux colonnes tiennent dans une moitié de fiche sur un portable.
const COLONNES_BLOC = 'grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]';

const PROSPECTION_DOC_LABELS: Record<ProspectionPdfDocKind, string> = {
  nda: 'NDA',
  fiche: 'Fiche',
};

function ProspectionDocCell({
  prospectionId,
  kind,
  disabled,
  disabledReason,
  divider,
  onError,
}: Readonly<{
  prospectionId: string;
  kind: ProspectionPdfDocKind;
  disabled?: boolean;
  disabledReason?: string;
  divider?: boolean;
  onError: (message: string | null) => void;
}>) {
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

function ProspectionDocumentButtons({ prospectionId, hasProspect }: Readonly<{ prospectionId: string; hasProspect: boolean }>) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex h-7 items-stretch overflow-hidden rounded-md border border-input">
        <ProspectionDocCell
          prospectionId={prospectionId}
          kind="nda"
          disabled={!hasProspect}
          disabledReason="Aucune fiche prospect liée pour générer le NDA."
          onError={setError}
        />
        <ProspectionDocCell prospectionId={prospectionId} kind="fiche" divider onError={setError} />
      </div>
      {error && <span className="text-micro text-destructive">{error}</span>}
    </div>
  );
}

// Une ligne par canal : l'`envoye` d'ensemble tairait le cas courant « parti sur WhatsApp, pas par email ».
function LigneCanal({ nom, canal }: Readonly<{ nom: 'Email' | 'WhatsApp'; canal?: CanalEnvoiDto }>) {
  if (!canal) return null;

  if (canal.envoye) {
    const plans = canal.nombrePiecesJointes ?? 0;
    return (
      <span className="text-micro text-(--success)">
        {nom} : envoyé à {canal.destinataire || 'ce prospect'}
        {plans > 0 ? ` avec ${pluriel(plans, 'plan')}` : ''}.
      </span>
    );
  }

  return (
    <span className="text-micro text-(--amber)">
      {nom} : {explicationCanal(nom, canal.motif)}
    </span>
  );
}

function explicationCanal(nom: 'Email' | 'WhatsApp', motif: CanalEnvoiDto['motif']): string {
  switch (motif) {
    case 'DESTINATAIRE_ABSENT':
      return nom === 'Email'
        ? "aucune adresse email sur la fiche — renseignez-la, puis relancez."
        : 'aucun numéro sur la fiche — renseignez-le, puis relancez.';
    case 'NUMERO_INEXPLOITABLE':
      return 'le numéro de la fiche est inutilisable (longueur anormale ou ligne fixe) — corrigez-le, puis relancez.';
    case 'SERVICE_INACTIF':
      return "service d'envoi inactif — prévenez l'administrateur.";
    default:
      return `non envoyé (${motif || 'motif non précisé'}).`;
  }
}

// `envoye: false` arrive en 200 : ce n'est pas une erreur, l'issue s'affiche par canal (email et
// WhatsApp tentés indépendamment).
function ConfirmationVisiteButton({ prospectionId, interactionId }: Readonly<{ prospectionId: string; interactionId: string }>) {
  const [busy, setBusy] = useState(false);
  const [resultat, setResultat] = useState<ResultatEnvoiVisiteDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function envoyer() {
    setBusy(true);
    setError(null);
    setResultat(null);
    try {
      setResultat(await renvoyerEmailVisite(prospectionId, interactionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={envoyer}>
          <Send data-icon="inline-start" /> {busy ? 'Envoi…' : 'Renvoyer la confirmation'}
        </Button>
        {error && <span className="text-micro text-destructive">{error}</span>}
      </div>
      {resultat && (
        <div className="flex flex-col gap-0.5">
          <LigneCanal nom="Email" canal={resultat.email} />
          <LigneCanal nom="WhatsApp" canal={resultat.whatsapp} />
        </div>
      )}
    </div>
  );
}

// Champ vide = `undefined`, jamais 0 : le backend lit l'absence de `prix` comme « prix catalogue ».
function nombreSaisi(v: string): number | undefined {
  const t = v.trim().replace(',', '.');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

// Sans lot l'appel répond 409 : le bouton reste inactif tant qu'aucun lot n'est rattaché. Le 409
// est tout de même rattrapé, le serveur reste seul juge (l'étape peut changer entre-temps).
function OffrePrixSection({
  prospectionId,
  articleId,
  onVoirArticle,
}: Readonly<{
  prospectionId: string;
  articleId?: string;
  onVoirArticle: () => void;
}>) {
  const modes = useModesPaiement();
  const [ouvert, setOuvert] = useState(false);
  const [remise, setRemise] = useState('');
  const [prix, setPrix] = useState('');
  const [modePaiementId, setModePaiementId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [resultat, setResultat] = useState<ResultatEnvoiOffreDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const article = useApi(() => (ouvert && articleId ? getArticle(articleId) : Promise.resolve(null)), [ouvert, articleId]);

  const sansLot = !articleId;
  const remiseVal = nombreSaisi(remise);
  const prixVal = nombreSaisi(prix);
  const remiseInvalide = remiseVal !== undefined && (remiseVal < 0 || remiseVal > 100);
  const prixInvalide = prixVal !== undefined && prixVal <= 0;

  async function envoyer() {
    setBusy(true);
    setError(null);
    setResultat(null);
    // Champs vides omis : `remisePercent: 0` donnerait le même montant mais empêcherait le backend
    // de réutiliser une offre existante (il ne réutilise que sans remise ni prix imposés).
    const body: EnvoyerOffrePrixRequest = {};
    if (remiseVal !== undefined) body.remisePercent = remiseVal;
    if (prixVal !== undefined) body.prix = prixVal;
    if (modePaiementId) body.modePaiementId = modePaiementId;
    if (notes.trim()) body.notes = notes.trim();
    try {
      setResultat(await envoyerOffrePrix(prospectionId, body));
    } catch (err) {
      // Un 409 (pas de lot, étape changée) porte déjà le message serveur à afficher.
      setError(err instanceof Error ? err.message : "Échec de l'envoi de l'offre.");
    } finally {
      setBusy(false);
    }
  }

  const emailAbsentMaisWhatsappParti =
    resultat?.email?.envoye === false && resultat.email.motif === 'DESTINATAIRE_ABSENT' && resultat.whatsapp?.envoye === true;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        <span className="text-micro font-medium text-muted-foreground">Offre de prix :</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={sansLot}
          onClick={() => setOuvert((o) => !o)}
        >
          <Send data-icon="inline-start" /> {ouvert ? 'Fermer' : "Envoyer l'offre au prospect"}
        </Button>
        {sansLot && (
          <span className="text-micro text-muted-foreground">
            Rattachez d'abord un lot —{' '}
            <button type="button" className="underline underline-offset-2 hover:text-foreground" onClick={onVoirArticle}>
              choisir l'article
            </button>
            .
          </span>
        )}
      </div>

      {ouvert && !sansLot && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-micro text-muted-foreground">
            Sans remise ni prix imposé, l'offre part au plein tarif du lot — et une offre déjà établie est alors
            réexpédiée telle quelle plutôt que renumérotée.
          </p>
          <div className="flex flex-col flex-wrap items-stretch gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:w-36">
              <div className="mb-1 text-micro font-medium text-muted-foreground">Remise (%)</div>
              <Input inputMode="decimal" placeholder="0" value={remise} onChange={(e) => setRemise(e.target.value)} />
            </div>
            <div className="w-full sm:w-44">
              <div className="mb-1 text-micro font-medium text-muted-foreground">Prix imposé TTC</div>
              <Input inputMode="decimal" placeholder="Prix du lot" value={prix} onChange={(e) => setPrix(e.target.value)} />
              {article.data?.prixSuggereEstPlancher && <MentionPrixPlancher />}
            </div>
            <div className="w-full sm:w-55">
              <div className="mb-1 text-micro font-medium text-muted-foreground">Mode de paiement</div>
              <RefSelect
                id="offre-mode-paiement"
                value={modePaiementId}
                onChange={setModePaiementId}
                items={referentielItems(modes.data)}
                placeholder="Optionnel…"
              />
            </div>
          </div>
          <div>
            <div className="mb-1 text-micro font-medium text-muted-foreground">Note reprise sur l'offre (optionnel)</div>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {(remiseInvalide || prixInvalide) && (
            <span className="text-micro text-destructive">
              {remiseInvalide ? 'La remise doit être comprise entre 0 et 100 %.' : 'Le prix imposé doit être positif.'}
            </span>
          )}
          <div>
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto"
              disabled={busy || remiseInvalide || prixInvalide}
              onClick={envoyer}
            >
              {busy ? 'Envoi…' : "Établir et envoyer l'offre"}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-micro text-destructive">{error}</p>}

      {resultat && (
        <div className="mt-3 flex flex-col gap-0.5 rounded-lg bg-muted/40 p-3">
          {/* L'offre existe même si les deux canaux échouent : son numéro s'affiche quand même,
              sinon le commercial en régénérerait une sous un autre numéro. */}
          <span className="text-label font-medium text-foreground">
            Offre {resultat.offreCode || '—'}
            {resultat.prixFinalTTC !== undefined ? ` · ${formatCurrency(resultat.prixFinalTTC)}` : ''}
          </span>
          {resultat.offreReutilisee && (
            <span className="text-micro text-muted-foreground">Offre existante réexpédiée, sans renumérotation.</span>
          )}
          <LigneCanal nom="Email" canal={resultat.email} />
          <LigneCanal nom="WhatsApp" canal={resultat.whatsapp} />
          {emailAbsentMaisWhatsappParti && (
            <span className="text-micro text-muted-foreground">
              À cette étape, 8 prospects sur 10 n'ont pas d'adresse email : le WhatsApp est le canal principal, et il
              porte le montant.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function libelleOuiNon(v: boolean | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  return v ? 'Oui' : 'Non';
}

// `pre` (la liste ouverte) ne règle que l'habillage ; le contenu suit la donnée (`isPre` plus bas) —
// pré-prospection et prospection sont la même ligne en base.
export function FicheProspection({
  id,
  pre,
  variante = 'fenetre',
  voisins,
  onFermer = () => undefined,
}: Readonly<{
  id: string;
  pre: boolean;
  variante?: VarianteCoque;
  voisins?: VoisinsFiche;
  onFermer?: () => void;
}>) {
  const { data: p, loading, error, refetch } = useApi(() => getProspection(id), [id], 'prospection');
  const isPreRoute = habillagePre(variante === 'dialogue', p, pre);
  const sectionAccent = isPreRoute ? 'var(--sec-preprospection)' : 'var(--sec-prospection)';
  /* Le prospect lié rendu par « Créer prospect » / rattachement : la relecture
     peut revenir avec l'ancien état (base de lecture en retard), et le bouton
     redeviendrait cliquable — risque de double création. */
  const [prospectLie, setProspectLie] = useState<{ id: string; prospectId: string } | null>(null);
  const prospectId = p?.prospectId ?? (prospectLie && prospectLie.id === p?.id ? prospectLie.prospectId : undefined);
  const linkedProspect = useApi(() => (prospectId ? getProspect(prospectId) : Promise.resolve(null)), [prospectId], 'prospection-prospect');
  const [interactionsPage, setInteractionsPage] = useState(0);
  const interactions = useApi(() => listInteractions(id, { page: interactionsPage, size: 20 }), [id, interactionsPage], 'prospection-interactions');

  // email-visite répond 409 hors rendez-vous : `necessiteDateRdv` porte la liste exacte des
  // résultats acceptés, `dateRdv` seul manquerait le cas « visite du projet ».
  const resultatsInteraction = useResultatsInteraction();
  const resultatsAvecRdv = useMemo(
    () => new Set(resultatsInteraction.data.filter((r) => r.necessiteDateRdv).map((r) => r.id)),
    [resultatsInteraction.data],
  );
  const [parcoursPage, setParcoursPage] = useState(0);
  const parcours = useApi(() => listProspectionHistorique(id, { page: parcoursPage, size: 20 }), [id, parcoursPage], 'prospection-parcours');
  const { commerciaux } = useAppData();
  const { user } = useAuth();
  // `user.employeeId` est l'id CfgTier du compte : même espace d'ids que `commerciaux`.
  const ownCommercial = commerciaux.find((c) => c.id === user?.employeeId) ?? null;
  const navigate = useNavigate();
  const { ouvrirFicheDossier, ouvrirFicheProspect } = usePreview();
  const showToast = useToast();
  const toastErreur = (err: unknown, defaut: string) =>
    showToast({ texte: err instanceof Error ? err.message : defaut, variante: 'erreur' });

  /* Attendre la fin du chargement avant de rediriger : une fiche servie du
     cache peut porter l'ancien code de type. */
  useEffect(() => {
    if (variante !== 'fenetre' || loading || !p || p.id !== id) return;
    if (isPreRoute && p.typeProspectionCode === CODE_PROSPECTION) {
      void navigate(`/prospections/${id}`, { replace: true });
    } else if (!isPreRoute && p.typeProspectionCode === CODE_PRE_PROSPECTION) {
      void navigate(`/pre-prospections/${id}`, { replace: true });
    }
  }, [variante, loading, p, id, isPreRoute, navigate]);
  const [showCreateProspect, setShowCreateProspect] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [showArchiver, setShowArchiver] = useState(false);
  const [raisonId, setRaisonId] = useState<string | null>(null);
  const [raisonTexte, setRaisonTexte] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<ProspectionTab>('etape');
  const [saving, setSaving] = useState(false);

  const sourceForm = useMemo<FormFiche>(
    () => ({
      etapeId: p?.etapeId ?? null,
      origineId: p?.origineId ?? null,
      origineSupportId: p?.origineSupportId ?? null,
      vocationId: p?.vocationId ?? null,
      typeContactId: p?.typeContactId ?? null,
      actionCommercialeId: p?.actionCommercialeId ?? null,
      notes: p?.notes ?? '',
    }),
    [p],
  );
  const form = useFormulaireFiche(sourceForm);

  const etapes = useEtapesProspection();
  const raisons = useRaisonsCloture();
  const origines = useOriginesProspection();
  const vocations = useVocations();
  const typesContact = useTypesContactProspection();
  const actionsCommerciales = useActionsCommerciales();
  /* Supports servis par origine, pilotés par le brouillon et non par la valeur
     serveur : sinon le champ proposerait ceux de l'ancienne origine jusqu'à
     l'enregistrement. */
  const supports = useApi(
    () => (form.valeurs.origineId ? getSupportsForOrigine(form.valeurs.origineId) : Promise.resolve([])),
    [form.valeurs.origineId],
    'prospection-supports',
  );

  const autresTranches = useApi(() => (id ? listProspectionAutresTranches(id) : Promise.resolve([])), [id], 'prospection-autres-tranches');
  // Adressé par la prospection, le serveur résout le prospect ; une pré-prospection renvoie [], jamais d'erreur.
  const contactsLies = useApi(() => (id ? listProspectionContacts(id) : Promise.resolve([])), [id], 'prospection-contacts');
  const [devisPage, setDevisPage] = useState(0);
  const devis = useApi(() => listDevis(id, { page: devisPage, size: 20 }), [id, devisPage], 'prospection-devis');

  // `!p` : une prospection déjà vue se repeint depuis le cache, la revalidation reste invisible.
  const nature = isPreRoute ? 'Pré-prospection' : 'Prospection';
  const coque = { variante, nature, voisins, onFermer };
  if (loading && !p) return <CoqueFiche {...coque} titre={nature}><LoadingState /></CoqueFiche>;
  if (error) return <CoqueFiche {...coque} titre={nature}><ErrorState message={error} /></CoqueFiche>;
  if (!p) {
    return (
      <CoqueFiche {...coque} titre={`${nature} introuvable`}>
        <p className="p-4">Cette {isPreRoute ? 'pré-prospection' : 'prospection'} n'existe pas.</p>
      </CoqueFiche>
    );
  }

  const name = prospectionDisplayName(p);
  const createProspectInitial: CreateProspectInitial = {
    // `split` rend toujours au moins un élément.
    firstName: name.trim().split(' ')[0],
    lastName: name.trim().split(' ').slice(1).join(' '),
    phone: p.tempTel ?? '',
    email: p.tempEmail ?? '',
  };
  const stageIdx = pipelineStageIndex(p.etape);
  const isPre = !prospectId;
  const showStepper = !p.fermee && !isSideTrackEtape(p.etape) && stageIdx >= 0;
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));
  // Le lien vit dans `activite` (vue légataire), pas au premier niveau du DTO. Hoisté : le
  // narrowing de `p.activite?.dossierId` testé en JSX ne survit pas jusqu'au closure du onClick.
  const dossierIssu = p.activite?.dossierId
    ? { id: p.activite.dossierId, code: p.activite.dossierCode }
    : null;
  const etapesParcours = calculerParcours(
    { typeProspectionCode: p.typeProspectionCode, prospectId,dossierId: dossierIssu?.id, dossierCode: dossierIssu?.code },
    parcours.data?.content,
  );
  // `null` reste distinct de `0` : « bloc d'activité absent » n'est pas « aucune interaction ».
  const joursInactivite = typeof p.activite?.joursInactivite === 'number' ? p.activite.joursInactivite : null;

  // Tranche obligatoire côté serveur si la prospection n'en a pas (400). Pas de catch : la boîte
  // de dialogue affiche elle-même les erreurs.
  async function handleTransform(body: TransformerProspectionRequest) {
    if (!p) return;
    const id = p.id;
    setBusy(true);
    try {
      const maj = await transformerProspection(id, body);
      await refetch();
      void parcours.refetch();
      if (variante === 'fenetre') {
        if (isPreRoute) void navigate(`/prospections/${maj.id}`, { replace: true });
        showToast(texteProspectionTransformee(name, maj));
      } else {
        showToast({
          texte: texteProspectionTransformee(name, maj),
          action: { libelle: 'Ouvrir la prospection →', vers: `/prospections/${maj.id}` },
        });
      }
    } finally {
      setBusy(false);
    }
  }

  // Chaque endpoint seulement si ses champs ont bougé : `PATCH /{id}/etape` écrit une ligne
  // d'historique, l'appeler à chaque fois inscrirait des changements d'étape fictifs.
  async function enregistrerFiche() {
    if (!p) return;
    setSaving(true);
    try {
      if (form.aChange('origineId', 'origineSupportId', 'vocationId', 'typeContactId', 'actionCommercialeId', 'notes')) {
        await modifierProspection(p.id, {
          origineId: form.valeurs.origineId ?? undefined,
          origineSupportId: form.valeurs.origineSupportId ?? undefined,
          vocationId: form.valeurs.vocationId ?? undefined,
          typeContactId: form.valeurs.typeContactId ?? undefined,
          actionCommercialeId: form.valeurs.actionCommercialeId ?? undefined,
          notes: form.valeurs.notes,
        });
      }
      if (form.aChange('etapeId') && form.valeurs.etapeId) {
        await changerEtapeProspection(p.id, { etapeId: form.valeurs.etapeId });
      }
      // Le brouillon devient la base avant le refetch : sinon la garde anti-écrasement du
      // formulaire, encore « modifié », empêcherait la resynchronisation.
      form.confirmer(form.valeurs);
      await refetch();
      showToast('Fiche enregistrée.');
    } catch (err) {
      toastErreur(err, "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiver() {
    if (!p) return;
    const id = p.id;
    setBusy(true);
    try {
      await archiverProspection(id, { raisonId: raisonId ?? undefined, raisonTexte: raisonTexte.trim() || undefined });
      setShowArchiver(false);
      await refetch();
      showToast('Prospection archivée.');
    } catch (err) {
      toastErreur(err, "Échec de l'opération.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDesarchiver() {
    if (!p) return;
    const id = p.id;
    setBusy(true);
    try {
      await desarchiverProspection(id);
      await refetch();
      showToast('Prospection désarchivée.');
    } catch (err) {
      toastErreur(err, "Échec de l'opération.");
    } finally {
      setBusy(false);
    }
  }

  const tranche = p.trancheDescription || p.trancheCode;
  const descriptionDistincte = !!p.tempDescription?.trim() && p.tempDescription.trim() !== name;
  const mobile = p.mobileProspect ? `+${p.indicatifMobile ?? ''} ${p.mobileProspect}`.replace('+ ', '') : null;
  // `tempTel` devient le `telephone` du prospect créé : il s'affiche sous Téléphone, jamais sous Mobile.
  const telProspect = linkedProspect.data?.telephone;
  const telephone = !isPre && telProspect ? formatTelephone(telProspect, linkedProspect.data?.indicatifTelephone) : (p.tempTel ?? null);
  // Deux blocs : ce que le commercial qualifie (modifiable), puis ce que la fiche porte (lecture seule).
  const champsQualification = [
    <ChampRef
      key="etape"
      id="f-etape"
      label="Nature"
      aide="L'« étape » du pipeline — appelée Nature dans le logiciel de bureau."
      valeur={form.valeurs.etapeId}
      onChange={(v) => form.set('etapeId', v)}
      items={referentielItems(etapes.data)}
      modifie={form.aChange('etapeId')}
    />,
    <ChampRef
      key="action"
      id="f-action"
      label="Action commerciale"
      valeur={form.valeurs.actionCommercialeId}
      onChange={(v) => form.set('actionCommercialeId', v)}
      items={referentielItems(actionsCommerciales.data)}
      modifie={form.aChange('actionCommercialeId')}
    />,
    <ChampRef
      key="origine"
      id="f-origine"
      label="Source de contact"
      valeur={form.valeurs.origineId}
      /* Changer l'origine invalide le support : les supports sont servis *par*
         origine, et garder l'ancien enverrait un couple incohérent. */
      onChange={(v) => {
        form.set('origineId', v);
        form.set('origineSupportId', null);
      }}
      items={referentielItems(origines.data)}
      modifie={form.aChange('origineId')}
    />,
    <ChampRef
      key="support"
      id="f-support"
      label="Support"
      aide="Campagne précise, servie selon la source de contact choisie."
      valeur={form.valeurs.origineSupportId}
      onChange={(v) => form.set('origineSupportId', v)}
      items={referentielItems(supports.data ?? [])}
      modifie={form.aChange('origineSupportId')}
    />,
    <ChampRef
      key="typeContact"
      id="f-typeContact"
      label="Type"
      aide="Type de contact : téléphone entrant, visite, web…"
      valeur={form.valeurs.typeContactId}
      onChange={(v) => form.set('typeContactId', v)}
      items={referentielItems(typesContact.data)}
      modifie={form.aChange('typeContactId')}
    />,
    <ChampRef
      key="vocation"
      id="f-vocation"
      label="Vocation"
      valeur={form.valeurs.vocationId}
      onChange={(v) => form.set('vocationId', v)}
      items={referentielItems(vocations.data)}
      modifie={form.aChange('vocationId')}
    />,
  ];
  const champsFiche = [
    <ChampLecture
      key="tranche"
      label="Tranche"
      valeur={tranche}
      aide="Se modifie dans l'onglet « Choix article » — le serveur l'expose sur un endpoint distinct."
    />,
    !isPre && (
      <ChampLecture
        key="article"
        label="Article"
        valeur={p.articleCode ? [p.articleCode, p.articleDescription].filter(Boolean).join(' · ') : null}
        aide="Se modifie dans l'onglet « Choix article »."
      />
    ),
    <ChampLecture key="societe" label="Société" valeur={p.societeLibelle || p.societeCode} aide="Dérivée de la tranche, jamais saisie." />,
    !isPre && (
      <ChampLecture
        key="ancienClient"
        label="Ancien client"
        valeur={libelleOuiNon(p.ancienClient)}
        aide="Servi par la fiche mais absent de ModifierProspectionRequest : lecture seule tant que le backend ne l'expose pas."
      />
    ),
    <ChampLecture key="typeTiers" label="Type de tiers" valeur={p.typeProspectLibelle || p.typeProspect} />,
    /* Le lead d'une pré-prospection vit dans les champs `temp*`, absents de
       `ModifierProspectionRequest` : lecture seule. */
    isPre && descriptionDistincte && (
      <ChampLecture
        key="description"
        label="Description"
        valeur={p.tempDescription}
        aide="Le nom saisi à la capture du lead. Absent de ModifierProspectionRequest — demande backend en cours."
      />
    ),
    (isPre || !p.mobileProspect) && (
      <ChampLecture
        key="telephone"
        label="Téléphone"
        valeur={telephone}
        aide={isPre ? "Idem : servi, mais non modifiable par l'API." : undefined}
      />
    ),
    !!p.mobileProspect && (
      <ChampLecture key="mobile" label="Mobile" valeur={mobile} aide="L'indicatif est servi sans le « + » — il est composé ici." />
    ),
    <ChampLecture
      key="email"
      label="Email"
      valeur={isPre ? p.tempEmail : p.emailFiche || p.tempEmail}
      aide={isPre ? "Idem : servi, mais non modifiable par l'API." : undefined}
    />,
  ].filter(Boolean);
  const champsArchivage = [
    /* Le désarchivage conserve date et motif : l'état se lit sur `fermee`,
       jamais sur la date. */
    (p.fermee || !!p.dateFermeture) && (
      <ChampLecture key="dateFermeture" label={p.fermee ? "Date d'archivage" : 'Dernier archivage'} valeur={formatDate(p.dateFermeture)} />
    ),
    /* Archivage par création de dossier : note seule, sans motif codé (voulu, FEATURE-conformite-legataire.md §2). */
    (p.fermee || !!p.dateFermeture) && (
      <ChampLecture key="raison" label="Raison" valeur={p.raisonFermeture || p.raisonFermetureTexte} />
    ),
    (p.fermee || !!p.dateFermeture) && !!p.raisonFermeture && !!p.raisonFermetureTexte?.trim() && (
      <ChampLecture key="raisonTexte" label="Note raison d'archivage" valeur={p.raisonFermetureTexte} />
    ),
  ].filter(Boolean);

  // Une seule action principale, selon l'avancement : prospect → transformation → dossier.
  let actionPrincipale: ActionRuban;
  if (isPre) {
    actionPrincipale = { id: 'creer-prospect', libelle: 'Créer prospect', icone: Plus, onClick: () => setShowCreateProspect(true) };
  } else if (estTransformable(p)) {
    actionPrincipale = { id: 'transformer', libelle: 'Transformer', icone: ArrowRightLeft, onClick: () => setShowTransform(true), disabled: busy };
  } else if (dossierIssu) {
    actionPrincipale = {
      id: 'dossier',
      libelle: `Dossier ${dossierIssu.code ?? ''}`.trim(),
      icone: ArrowUpRight,
      onClick: () => ouvrirFicheDossier(dossierIssu.id),
    };
  } else {
    actionPrincipale = {
      id: 'nouveau-dossier',
      libelle: 'Créer un dossier',
      icone: FilePlus,
      onClick: () => void navigate(`/prospections/${p.id}/nouveau-dossier`),
      disabled: p.fermee,
    };
  }
  const propres: ActionRuban[] = [
    actionPrincipale,
    { id: 'appeler', libelle: 'Appeler', icone: Phone, onClick: () => showToast('Intégration VOIP à venir.') },
  ];
  if (p.fermee) {
    propres.push({ id: 'desarchiver', libelle: 'Désarchiver', icone: ArchiveRestore, onClick: () => void handleDesarchiver(), disabled: busy });
  } else if (!showArchiver) {
    propres.push({ id: 'archiver', libelle: 'Archiver', icone: Archive, onClick: () => setShowArchiver(true), disabled: busy });
  }

  const prospectLien = p.prospectId ? (
    <LienFiche cible={{ type: 'prospect', id: p.prospectId }} className="hover:underline" title="Ouvrir la fiche prospect — elle se modifie depuis l'onglet Contacts.">
      {p.prospectNom || p.prospectCode || 'Voir la fiche'}
    </LienFiche>
  ) : null;
  const badges = (
    <>
      {isPre && <Badge tone="amber">Non qualifiée</Badge>}
      <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Archivée' : p.etape || '—'}</Badge>
      {joursInactivite !== null && <InactiviteBadge jours={joursInactivite} />}
    </>
  );

  const corps = (
    <>
      <RubanFiche
        enregistrer={{ onClick: () => void enregistrerFiche(), disabled: !form.estModifie || saving, aide: 'Enregistre les champs modifiés.' }}
        propres={propres}
        enSuite={<ProspectionDocumentButtons prospectionId={p.id} hasProspect={!isPre} />}
      />
      <div className="flex shrink-0 flex-col gap-1.5 px-4 pt-2 empty:hidden">
        {etapesParcours && <ParcoursVente etapes={etapesParcours} accent={sectionAccent} />}
        {(p.marqueurTri || p.noteQualification) && <MarqueurTri p={p} />}
        {dossierIssu && (
          <DossierIssuBanner
            dossierId={p.activite?.dossierId}
            dossierCode={p.activite?.dossierCode}
            statutDossier={p.activite?.statutDossier}
          />
        )}

              {showArchiver && (
                <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-label font-semibold text-destructive">Archiver la prospection</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowArchiver(false)}>Annuler</Button>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="w-56">
                      <div className="mb-0.5 text-micro font-medium text-muted-foreground">Raison</div>
                      <RefSelect id="raison" value={raisonId} onChange={setRaisonId} items={referentielItems(raisons.data)} size="sm" />
                    </div>
                    <div className="min-w-56 flex-1">
                      <div className="mb-0.5 text-micro font-medium text-muted-foreground">Détail (optionnel)</div>
                      <Input value={raisonTexte} onChange={(e) => setRaisonTexte(e.target.value)} className="h-7" />
                    </div>
                    <Button size="sm" onClick={handleArchiver} disabled={busy} className="text-destructive-foreground">
                      Confirmer l'archivage
                    </Button>
                  </div>
                </div>
              )}
        {form.estModifie && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-(--warning)/40 bg-(--warning-bg) px-3 py-2">
              <span className="text-label font-medium text-foreground">
                {form.champsModifies.length} modification{form.champsModifies.length > 1 ? 's' : ''} non enregistrée
                {form.champsModifies.length > 1 ? 's' : ''}
              </span>
              <span className="min-w-0 truncate text-micro text-muted-foreground">
                {form.champsModifies.map((c) => LIBELLE_CHAMP[c] ?? c).join(' · ')}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={form.annuler} disabled={saving}>
                  Annuler
                </Button>
                <Button size="sm" onClick={enregistrerFiche} disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </div>
            </div>
        )}
      </div>
      <div className="grid max-h-[52%] shrink-0 grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-4 overflow-auto border-b border-border px-4 py-3">
        <div className="flex min-w-0 flex-col gap-3">
          <BandeFiche>
            <ChampFiche libelle="Code" valeur={p.code} />
            <ChampFiche libelle="Prospect" valeur={prospectLien} />
            <ChampFiche libelle="Créée le" valeur={formatDate(p.dateDocument)} />
            <ChampFiche libelle="Commercial" valeur={p.commercialNom || '— non assigné —'} />
            <ChampFiche libelle="Société" valeur={p.societeCode} />
          </BandeFiche>
          <GrilleFiche empilee className={COLONNES_BLOC}>{champsQualification}</GrilleFiche>
          <GrilleFiche empilee>
            <ChampNotes id="f-notes" label="Notes" valeur={form.valeurs.notes} onChange={(v) => form.set('notes', v)} modifie={form.aChange('notes')} />
          </GrilleFiche>
        </div>
        <ClasseurEntete
          type={isPreRoute ? 'preprospection' : 'prospection'}
          onglets={[
            { id: 'rattachement', titre: 'Contact et rattachement', contenu: <GrilleFiche empilee className={COLONNES_BLOC}>{champsFiche}</GrilleFiche> },
            ...(champsArchivage.length > 0
              ? [{ id: 'archivage', titre: 'Archivage', contenu: <GrilleFiche empilee className={COLONNES_BLOC}>{champsArchivage}</GrilleFiche> }]
              : []),
          ]}
        />
      </div>
      <ClasseurBas
        actif={tab}
        onChange={(v) => setTab(v as ProspectionTab)}
        onglets={[
          {
            id: 'etape',
            libelle: 'Étape',
            contenu: (
              <div className="flex flex-col gap-3 p-3">
                {showStepper ? (
                  <div>
                    <div className="flex items-center">
                      {PIPELINE_STAGES.map((stage, i) => (
                        <div className="flex flex-1 items-center" key={stage}>
                          <div className={cn('flex flex-col items-center', i === PIPELINE_STAGES.length - 1 ? 'flex-none' : 'flex-1')}>
                            <div
                              className={cn(
                                'flex size-5.5 shrink-0 items-center justify-center rounded-full border-2 text-micro font-bold transition-colors duration-300',
                                i <= stageIdx ? 'text-white' : 'border-border bg-(--neutral-bg) text-muted-foreground',
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
                    <div className="mt-2 text-center text-body font-medium text-foreground sm:hidden">
                      Étape {stageIdx + 1}/{PIPELINE_STAGES.length} · {PIPELINE_STAGE_SHORT[PIPELINE_STAGES[stageIdx]]}
                    </div>
                  </div>
                ) : (
                  <p className="text-body text-muted-foreground">
                    {p.fermee
                      ? 'Prospection clôturée — le parcours ne progresse plus.'
                      : "Cette étape est une voie de côté : elle n'a pas de rang dans le pipeline."}
                  </p>
                )}

                {!p.fermee && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <span className="text-micro font-medium text-muted-foreground">Changer d'étape :</span>
                    <div className="w-55">
                      <RefSelect
                        id="etape-onglet"
                        value={form.valeurs.etapeId}
                        onChange={(v) => form.set('etapeId', v)}
                        items={referentielItems(etapes.data)}
                        placeholder="Choisir une étape…"
                        size="sm"
                      />
                    </div>
                    {form.aChange('etapeId') && (
                      <span className="text-micro text-(--warning)">
                        modification non enregistrée — le bouton Enregistrer est au-dessus des onglets
                      </span>
                    )}
                  </div>
                )}
              </div>
            ),
          },
          {
            id: 'autres-tranches',
            libelle: 'Autres tranches',
            compteur: autresTranches.data?.length ?? 0,
            contenu: (
              <div className="p-3">
                <ArticlesAssociesSection
                  prospectionId={p.id}
                  principalTrancheId={p.trancheId}
                  items={autresTranches.data ?? []}
                  onAdded={async () => { await autresTranches.refetch(); showToast('Tranche ajoutée.'); }}
                  onRemove={async (itemId) => { await removeProspectionAutreTranche(p.id, itemId); void autresTranches.refetch(); }}
                  onEdited={async () => { await autresTranches.refetch(); showToast('Article mis à jour.'); }}
                  navigate={navigate}
                />
              </div>
            ),
          },
          {
            id: 'article',
            libelle: 'Choix article',
            contenu: (
              <div className="flex flex-col gap-3 p-3">
                <ChoixArticleSection
                  prospectionId={p.id}
                  trancheId={p.trancheId}
                  articleId={p.articleId}
                  onUpdated={async () => { await refetch(); showToast('Tranche/article principal mis à jour.'); }}
                  onAdded={async () => { await autresTranches.refetch(); showToast('Article ajouté.'); }}
                  navigate={navigate}
                />
                {stageIdx >= PIPELINE_STAGES.indexOf('4 APRES VISITES') && !p.fermee && (
                  <OffrePrixSection prospectionId={p.id} articleId={p.articleId} onVoirArticle={() => setTab('article')} />
                )}
              </div>
            ),
          },
          {
            id: 'profils',
            libelle: 'Profils',
            contenu: <OngletProfils prospectionId={p.id} />,
          },
          {
            id: 'autres',
            libelle: 'Autres',
            contenu: <OngletAutres prospectionId={p.id} />,
          },
          {
            id: 'devis',
            libelle: 'Offres',
            compteur: devis.data?.totalElements ?? 0,
            contenu: (
              <div className="flex flex-col gap-3 p-3">
                <DevisFormSection
                  defaultTrancheId={p.trancheId}
                  defaultArticleId={p.articleId}
                  defaultProspectId={p.prospectId ?? undefined}
                  defaultCommercialId={p.commercialId ?? undefined}
                  onAdd={async (body) => { await creerDevis(p.id, body); await devis.refetch(); showToast('Offre créée.'); }}
                />
                {devis.loading && !devis.data && <LoadingState />}
                {devis.error && <ErrorState message={devis.error} />}
                {devis.data && devis.data.content.length === 0 && (
                  <EmptyState title="Aucune offre" message="Créez une offre ci-dessus pour en voir apparaître ici." />
                )}
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
              </div>
            ),
          },
          {
            id: 'actions',
            libelle: 'Actions',
            compteur: interactions.data?.totalElements ?? 0,
            contenu: (
              <div className="flex flex-col gap-2.5 p-3">
                <ResumeActivite
                  activite={p.activite}
                  tranche={tranche}
                  premiereNote={interactions.data?.content[0]?.note}
                  action={
                    <Button size="sm" onClick={() => setShowInteractionForm(true)}>
                      <Plus data-icon="inline-start" /> Ajouter une action
                    </Button>
                  }
                />

                {interactions.loading && !interactions.data && <LoadingState />}
                {interactions.error && <ErrorState message={interactions.error} />}
                {interactions.data && interactions.data.content.length === 0 && (
                  <p className="text-label text-muted-foreground">Aucune action enregistrée pour cette prospection.</p>
                )}
                {interactions.data && interactions.data.content.length > 0 && (
                  /* `overflow-visible` : le panneau d'onglet est la zone qui
                     défile, l'en-tête collant s'y accroche. */
                  <div>
                    <Table containerClassName="overflow-visible">
                      <TableHeader className="sticky top-0 z-1">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Date</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Résultat</TableHead>
                          <TableHead>Note</TableHead>
                          <TableHead>Suivi</TableHead>
                          <TableHead>Par</TableHead>
                          <TableHead className="w-0 text-right" aria-label="Actions de ligne" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {interactions.data.content.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="tabular-nums text-muted-foreground">{formatDateTime(c.date)}</TableCell>
                            <TableCell className="font-medium text-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="inline-flex text-muted-foreground">{interactionIcon(c.entrante)}</span>
                                {c.actionType || (c.entrante ? 'Entrant' : 'Sortant')}
                                {c.categorie && c.categorie !== CATEGORIE_INTERACTION_ORDINAIRE && (
                                  <Badge tone="info">{c.categorie}</Badge>
                                )}
                                {c.trancheId && c.trancheId !== p.trancheId && (
                                  <span className="text-micro font-normal text-muted-foreground">
                                    {c.projetCode ? `${c.projetCode} — ` : ''}
                                    {c.trancheLibelle || c.trancheCode}
                                  </span>
                                )}
                              </span>
                            </TableCell>
                            <TableCell>
                              {c.resultat ? (
                                <Badge tone={c.dateRdv ? 'success' : 'neutral'}>{c.resultat}</Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            {/* Note jamais tronquée : h-(--row-h) est un minimum, la ligne
                                grandit avec le texte replié. */}
                            <TableCell className="min-w-60 max-w-120 py-1 whitespace-normal text-muted-foreground">
                              {c.note || '—'}
                            </TableCell>
                            <TableCell>
                              {c.dateRdv || c.dateAlerte ? (
                                <span className="inline-flex items-center gap-1.5">
                                  {c.dateRdv && <Badge tone="success">RDV le {formatDateTime(c.dateRdv)}</Badge>}
                                  {c.dateAlerte && <Badge tone="warning">Alerte jusqu'au {formatDate(c.dateAlerte)}</Badge>}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{c.employeNom || 'Système'}</TableCell>
                            <TableCell className="text-right">
                              {c.resultatId && resultatsAvecRdv.has(c.resultatId) ? (
                                <ConfirmationVisiteButton prospectionId={p.id} interactionId={c.id} />
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

                {parcours.data && parcours.data.content.length === 0 ? (
                  <p className="text-body text-muted-foreground">
                    Historique de statut (0) — aucune transition tracée ; apparaîtra dès que cette fiche sera liée à un
                    prospect ou transformée.
                  </p>
                ) : (
                <div className="border-t border-border pt-3">
                  <div className="mb-2 text-micro font-medium text-muted-foreground">
                    Historique de statut ({parcours.data?.totalElements ?? 0})
                  </div>
                  {parcours.data && parcours.data.content.length > 0 && (
                    <TimelineList>
                      {parcours.data.content.map((h, i, liste) => (
                        <TimelineRow
                          key={h.id}
                          dernier={i === liste.length - 1}
                          titre={h.workflowDescription || h.statutDescription || 'Événement'}
                          meta={`${formatDateTime(h.date)} · ${h.utilisateur || 'Système'}`}
                          note={h.description}
                        />
                      ))}
                    </TimelineList>
                  )}
                  {parcours.data && (
                    <Pagination
                      page={parcours.data.page}
                      totalPages={parcours.data.totalPages}
                      totalElements={parcours.data.totalElements}
                      onPageChange={setParcoursPage}
                    />
                  )}
                </div>
                )}
              </div>
            ),
          },
          {
            id: 'contacts',
            libelle: 'Contacts',
            contenu: (
              <div className="p-3">
                {p.prospectId ? (
                  <>
                    {linkedProspect.loading && !linkedProspect.data && <LoadingState />}
                    {linkedProspect.error && <ErrorState message={linkedProspect.error} />}
                    {linkedProspect.data && (
                      <div className="flex flex-col gap-3">
                        <FieldGrid>
                          <Field label="Nom" value={personDisplayName(linkedProspect.data)} />
                          <Field label="Code" value={linkedProspect.data.code} />
                          <Field label={linkedProspect.data.pieceIdentite?.type || "Pièce d'identité"} value={linkedProspect.data.pieceIdentite?.numero} />
                          <Field label="Téléphone" value={formatTelephone(linkedProspect.data.telephone)} />
                          <Field label="Mobile" value={formatTelephone(linkedProspect.data.mobile)} />
                          <Field label="Email" value={linkedProspect.data.email} />
                          <Field label="Ville" value={linkedProspect.data.ville} />
                          <Field label="Adresse" value={linkedProspect.data.adresse} />
                        </FieldGrid>
                        <div>
                          <LienFiche cible={{ type: 'prospect', id: p.prospectId }} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                            <ArrowUpRight data-icon="inline-start" /> Ouvrir la fiche prospect
                          </LienFiche>
                        </div>

                        {/* Le retrait passe par le prospect : le DELETE n'existe que
                            sous /api/prospects/{id}/contacts. */}
                        <div className="flex flex-col gap-2">
                          <h3 className="text-label font-medium text-foreground">Contacts liés</h3>
                          <ContactsProspect
                            contacts={contactsLies}
                            onAdd={async (body) => {
                              await addProspectionContact(p.id, body);
                              await contactsLies.refetch();
                              showToast('Contact ajouté.');
                            }}
                            onRemove={async (linkId) => {
                              const prospectId = p.prospectId;
                              if (!prospectId) return;
                              await removeProspectContact(prospectId, linkId);
                              await contactsLies.refetch();
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <EmptyState
                    title="Aucune fiche prospect"
                    message="Cette pré-prospection n'est pas encore liée à un tiers. Utilisez « Créer prospect » dans la barre d'actions."
                  />
                )}
              </div>
            ),
          },
        ].filter((o) => !(isPre && ONGLETS_PROSPECTION_SEULE.has(o.id)))}
      />

      {showTransform && (
        <TransformerProspectionDialog
          initialCommercialId={ownCommercial?.id ?? null}
          initialTrancheId={p.trancheId ?? null}
          initialArticleId={p.articleId ?? null}
          commercialItems={commercialItems}
          onClose={() => setShowTransform(false)}
          onSubmit={handleTransform}
        />
      )}

      {showCreateProspect && (
        <CreateProspectForm
          preProspectionId={p.id}
          initial={createProspectInitial}
          onClose={() => setShowCreateProspect(false)}
          onSubmit={(maj, mode) => {
            if (maj.prospectId) setProspectLie({ id: maj.id, prospectId: maj.prospectId });
            void refetch();
            void parcours.refetch();
            toastProspectLie(name, maj, mode, ouvrirFicheProspect)
              .then(showToast)
              .catch(() => showToast(mode === 'cree' ? `${name} est maintenant un prospect.` : `${name} est rattaché au prospect existant.`));
          }}
        />
      )}

      {showInteractionForm && (
        <InteractionForm
          onClose={() => setShowInteractionForm(false)}
          onSubmit={async (input) => {
            await addInteraction(p.id, input);
            void interactions.refetch();
            showToast('Action enregistrée.');
          }}
        />
      )}

    </>
  );

  if (variante === 'dialogue') {
    return (
      <CadreFiche
        variante="dialogue"
        title={name}
        typeFiche={nature}
        entete={
          <EnteteFiche code={p.code} aideCode="Attribué par le système, non modifiable." nom={prospectLien ?? name}>
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
      titre={p.prospectNom || name}
      badge={badges}
      voisins={voisins}
      onFermer={onFermer}
      enEdition={form.estModifie}
      pied={<PiedAudit creePar={p.creePar} creeLe={p.creeLe} modifiePar={p.modifiePar} modifieLe={p.modifieLe} />}
    >
      {corps}
    </FenetreFiche>
  );
}

// Avec `principalTrancheId`, « Modifier » n'est actif que sur cette tranche : une autre tranche ne
// peut devenir qu'un intérêt secondaire (« Ajouter »), jamais écraser la tranche principale.
function ArticleCascadePicker({
  onModifier,
  onAjouter,
  onCancel,
  initialTrancheId,
  initialArticleId,
  principalTrancheId,
  exclureTrancheIds,
}: Readonly<{
  onModifier?: (trancheId: string, articleId?: string) => Promise<void>;
  onAjouter?: (trancheId: string, articleId?: string) => Promise<void>;
  onCancel?: () => void;
  initialTrancheId?: string;
  initialArticleId?: string;
  principalTrancheId?: string;
  exclureTrancheIds?: readonly string[];
}>) {
  const projets = useApi(() => getProjetsReferentiel(), []);
  const { ouvrirFicheProspection } = usePreview();
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
  // 409 « un prospect, un projet, une prospection » : la tranche cible est sur un autre projet où le
  // prospect a déjà une prospection ouverte. Une redirection, pas une erreur.
  const [existante, setExistante] = useState<ReturnType<typeof prospectionExistanteDepuisErreur>>(null);

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

  // `GET /api/articles/{id}` résout indifféremment un article ou un sous-article.
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
    setExistante(null);
    try {
      await action(trancheId, sousArticleId || articleId || undefined);
      setProjetId(null);
      setTrancheId(null);
      setCategorieIds([]);
      setTypeIds([]);
      setArticleId(null);
      setSousArticleId(null);
    } catch (err) {
      setExistante(prospectionExistanteDepuisErreur(err));
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
          items={referentielItems((tranches.data ?? []).filter((t) => !exclureTrancheIds?.includes(t.id)))}
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
      {existante ? (
        <ProspectionExistanteNotice existante={existante} message={error} ouvrirEnDialogue={(pid) => ouvrirFicheProspection(pid, false)} />
      ) : (
        error && <p className="text-body text-destructive">{error}</p>
      )}
    </div>
  );
}

// `PATCH /api/prospections/{id}/tranche-principale` est le seul endpoint qui touche tranche et article.
function ChoixArticleSection({
  prospectionId,
  trancheId,
  articleId,
  onUpdated,
  onAdded,
  navigate,
}: Readonly<{
  prospectionId: string;
  trancheId?: string;
  articleId?: string;
  onUpdated: () => Promise<void>;
  onAdded: () => Promise<void>;
  navigate: (path: string) => void;
}>) {
  const current = useApi(() => (articleId ? getArticle(articleId) : Promise.resolve(null)), [articleId]);
  const currentTranche = useApi(() => (trancheId ? getTranche(trancheId) : Promise.resolve(null)), [trancheId]);
  const [editing, setEditing] = useState(false);
  const showPicker = editing || !trancheId;

  return (
    <Card
      title="Choix article"
      action={trancheId ? <BoutonEdition enEdition={editing} onBasculer={setEditing} /> : undefined}
    >
      <div className={cn('flex flex-col gap-1.5', showPicker && 'mb-3.5 border-b border-border pb-3.5')}>
        <span className="text-micro font-medium text-muted-foreground">Tranche principale</span>
        {trancheId ? (
          <button
            type="button"
            onClick={() => navigate(`/tranches/${trancheId}`)}
            className="inline-flex w-fit items-center gap-1 rounded-md bg-(--neutral-bg) px-2.5 py-1 text-body font-semibold text-primary hover:underline"
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

// Pas de PATCH sur une entrée `autres-tranches` : « Modifier » la retire puis ajoute la nouvelle.
function ArticleAssocieRow({
  prospectionId,
  item,
  onRemove,
  onEdited,
  navigate,
}: Readonly<{
  prospectionId: string;
  item: { id: string; trancheId?: string; tranche?: string; articleId?: string; article?: string };
  onRemove: (itemId: string) => Promise<void>;
  onEdited: () => Promise<void>;
  navigate: (path: string) => void;
}>) {
  const [editing, setEditing] = useState(false);
  const article = useApi(() => (item.articleId ? getArticle(item.articleId) : Promise.resolve(null)), [item.articleId]);

  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2">
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
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Retirer" onClick={() => onRemove(item.id)}>
            <X className="text-destructive" />
          </Button>
        </div>
      </div>
      {item.articleId ? (
        <div className="mt-1.5">
          <ArticleCompactPreview article={article.data ?? null} loading={article.loading} bare />
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
              await removeProspectionAutreTranche(prospectionId, item.id);
              await addProspectionAutreTranche(prospectionId, { trancheId: tId, articleId: aId });
              setEditing(false);
              await onEdited();
            }}
          />
        </div>
      )}
    </div>
  );
}

function ArticlesAssociesSection({
  prospectionId,
  principalTrancheId,
  items,
  onRemove,
  onEdited,
  onAdded,
  navigate,
}: Readonly<{
  prospectionId: string;
  principalTrancheId?: string;
  items: { id: string; trancheId?: string; tranche?: string; articleId?: string; article?: string }[];
  onRemove: (itemId: string) => Promise<void>;
  onEdited: () => Promise<void>;
  onAdded: () => Promise<void>;
  navigate: (path: string) => void;
}>) {
  const [ajout, setAjout] = useState(false);
  // Le back ne refuse pas les doublons : on retire du choix la tranche principale et celles déjà listées.
  const exclues = [principalTrancheId, ...items.map((t) => t.trancheId)].filter((v): v is string => !!v);

  return (
    <Card
      title="Autres tranches"
      action={
        ajout ? undefined : (
          <Button type="button" size="sm" variant="outline" onClick={() => setAjout(true)}>
            <Plus data-icon="inline-start" /> Ajouter une tranche
          </Button>
        )
      }
    >
      {ajout && (
        <div className="mb-3.5 border-b border-border pb-3.5">
          <ArticleCascadePicker
            exclureTrancheIds={exclues}
            onCancel={() => setAjout(false)}
            onAjouter={async (tId, aId) => {
              await addProspectionAutreTranche(prospectionId, { trancheId: tId, articleId: aId });
              setAjout(false);
              await onAdded();
            }}
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        {items.length === 0 && <span className="text-body text-muted-foreground">Aucune autre tranche pour l'instant.</span>}
        {items.map((t) => (
          <ArticleAssocieRow key={t.id} prospectionId={prospectionId} item={t} onRemove={onRemove} onEdited={onEdited} navigate={navigate} />
        ))}
      </div>
    </Card>
  );
}

function DevisRow({ prospectionId, devis: dv }: Readonly<{ prospectionId: string; devis: DevisDto }>) {
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
    <div className="rounded-lg bg-muted/30 px-3 py-2">
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
          {genError && <span className="text-micro text-destructive">{genError}</span>}
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
              <Field label="TVA" value={m.tvaRatio != null ? formatPercent(m.tvaRatio, 0) : undefined} />
              <Field label="Prix m² HT" value={formatMontantOptionnel(m.prixM2HT)} />
              <Field label="Prix m² TTC" value={formatMontantOptionnel(m.prixM2TTC)} />
              <Field label="Article HT" value={formatMontantOptionnel(m.prixArticleHT)} />
              <Field label="Article TTC" value={formatMontantOptionnel(m.prixArticleTTC)} />
              <Field label="Sous-articles HT" value={formatMontantOptionnel(m.prixSousArticlesHT)} />
              <Field label="Sous-articles TTC" value={formatMontantOptionnel(m.prixSousArticlesTTC)} />
              <Field label="Total HT" value={formatMontantOptionnel(m.totalHT)} />
              <Field label="Total TTC" value={formatMontantOptionnel(m.totalTTC)} />
            </FieldGrid>
          </div>

          {(m.remisePercent ?? 0) > 0 && (
            <div>
              <div className="mb-1.5 text-micro font-medium text-muted-foreground">Remise</div>
              <FieldGrid>
                <Field label="Taux" value={m.remisePercent != null ? formatPercentValue(m.remisePercent) : undefined} />
                <Field label="Remise HT" value={formatMontantOptionnel(m.remiseHT)} />
                <Field label="Remise TTC" value={formatMontantOptionnel(m.remiseTTC)} />
                <Field label="Prix m² après remise HT" value={formatMontantOptionnel(m.prixM2ApresRemiseHT)} />
                <Field label="Prix m² après remise TTC" value={formatMontantOptionnel(m.prixM2ApresRemiseTTC)} />
                <Field label="Article après remise HT" value={formatMontantOptionnel(m.prixArticleApresRemiseHT)} />
                <Field label="Article après remise TTC" value={formatMontantOptionnel(m.prixArticleApresRemiseTTC)} />
                <Field label="Sous-articles après remise HT" value={formatMontantOptionnel(m.prixSousArticlesApresRemiseHT)} />
                <Field label="Sous-articles après remise TTC" value={formatMontantOptionnel(m.prixSousArticlesApresRemiseTTC)} />
              </FieldGrid>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border pt-2.5">
            <span className="text-micro font-medium text-muted-foreground">Prix de vente final</span>
            <span className="text-label font-semibold text-foreground">HT {formatMontantOptionnel(m.prixVenteHT) ?? '—'}</span>
            <span className="text-label font-semibold text-foreground">TTC {formatMontantOptionnel(m.prixVenteTTC) ?? '—'}</span>
          </div>
        </div>
      )}

      {dv.notes && (
        <div className="mt-1.5 whitespace-pre-wrap text-body text-foreground">{dv.notes}</div>
      )}
    </div>
  );
}

