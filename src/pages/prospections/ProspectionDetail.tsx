import { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight, Download, Eye, FileText, Minus, Pencil, Phone, Plus, Send, UserPlus, Users, X } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState } from '../../components/ui';
import { ActiviteCard, DossierIssuBanner, InactiviteBadge } from '../../components/ActiviteProspection';
import ArticleCompactPreview from '../../components/ArticleCompactPreview';
import ArticleResultsList from '../../components/ArticleResultsList';
import CreateProspectForm, { type CreateProspectInitial } from '../../components/CreateProspectForm';
import DevisFormSection from '../../components/DevisFormSection';
import InteractionForm from '../../components/InteractionForm';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { TimelineList, TimelineRow } from '../../components/Timeline';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import FicheShell from '../../components/FicheShell';
import { ChampLecture, ChampNotes, ChampRef, GrilleFiche } from '../../components/ChampsFiche';
import MarqueurTri from '../../components/MarqueurTri';
import { OngletAutres, OngletProfils } from '../../components/SousCollectionsProspection';
import RefSelect from '../../components/RefSelect';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Separator } from '../../components/ui/separator';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { cn } from '../../lib/utils';
import { formatCurrency, formatDate, formatDateTime, formatTelephone } from '../../lib/format';
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
  ApiError,
  addInteraction,
  addProspectionAutreTranche,
  archiverProspection,
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
  listProspectionAutresTranches,
  listProspectionHistorique,
  modifierProspection,
  modifierTranchePrincipale,
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
} from '../../types';

/** Les sept onglets du logiciel de bureau, dans son ordre. `article` garde
 * son ancien nom de valeur — la clé sert d'identifiant interne, pas de
 * libellé, et `OffrePrixSection` s'y renvoie déjà. */
type ProspectionTab =
  | 'etape'
  | 'autres-tranches'
  | 'article'
  | 'profils'
  | 'autres'
  | 'devis'
  | 'actions'
  | 'contacts';

/** Nom lisible de chaque champ du formulaire, pour que la barre
 * d'enregistrement dise *ce qui* a changé. À quinze champs, « 2 modifications »
 * oblige à relire toute la fiche pour les retrouver. */
/** Les deux onglets qu'une pré-prospection n'a pas — le logiciel de bureau ne
 * les montre pas non plus. « Offres » suppose un article, mesuré à 0,2 % sur
 * cette population ; « Contacts » suppose une fiche tiers, qui par définition
 * n'existe pas encore. */
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

/** Les champs que le formulaire pilote, et rien d'autre. Tranche et article en
 * sont absents volontairement : le serveur les a sortis de
 * `PATCH /api/prospections/{id}` pour leur donner un endpoint propre, et
 * l'onglet « Choix article » porte déjà le sélecteur en cascade qui l'appelle.
 * Les rendre modifiables ici aussi ferait deux chemins pour un même geste. */
type FormFiche = {
  etapeId: string | null;
  origineId: string | null;
  origineSupportId: string | null;
  vocationId: string | null;
  typeContactId: string | null;
  actionCommercialeId: string | null;
  notes: string;
};

/** Valeur de `InteractionDto.categorie` qui n'apprend rien dans le journal
 * d'une prospection. Les trois autres valeurs réelles — « Dossier de vente
 * (Réservation) », « (Livraison) », « Réclamation » — sont, elles, des
 * exceptions à signaler. Chaîne littérale parce que la catégorie n'est pas
 * exposée en référentiel : c'est le libellé que porte la vue légataire. */
const CATEGORIE_INTERACTION_ORDINAIRE = 'Prospection';

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
      {error && <span className="text-micro text-destructive">{error}</span>}
    </div>
  );
}

/** Une ligne d'issue, pour un canal.
 *
 * Chaque canal a son état propre et **l'asymétrie est la norme** : 99 % des
 * prospects portent un numéro exploitable contre 57 % une adresse email, donc
 * « parti sur WhatsApp, pas par email » est le cas courant. N'afficher que le
 * `envoye` d'ensemble reviendrait à le taire une fois sur deux.
 *
 * Les motifs ne sont pas interchangeables : `DESTINATAIRE_ABSENT` demande
 * d'obtenir la coordonnée, `NUMERO_INEXPLOITABLE` de réparer celle qui existe.
 * Deux gestes différents, donc deux phrases différentes. */
function LigneCanal({ nom, canal }: { nom: 'Email' | 'WhatsApp'; canal?: CanalEnvoiDto }) {
  if (!canal) return null;

  if (canal.envoye) {
    const plans = canal.nombrePiecesJointes ?? 0;
    return (
      <span className="text-micro text-(--success)">
        {nom} : envoyé à {canal.destinataire || 'ce prospect'}
        {plans > 0 ? ` avec ${plans} plan${plans > 1 ? 's' : ''}` : ''}.
      </span>
    );
  }

  const explication =
    canal.motif === 'DESTINATAIRE_ABSENT'
      ? nom === 'Email'
        ? "aucune adresse email sur la fiche — renseignez-la, puis relancez."
        : 'aucun numéro sur la fiche — renseignez-le, puis relancez.'
      : canal.motif === 'NUMERO_INEXPLOITABLE'
        ? 'le numéro de la fiche est inutilisable (longueur anormale ou ligne fixe) — corrigez-le, puis relancez.'
        : canal.motif === 'SERVICE_INACTIF'
          ? "service d'envoi inactif — prévenez l'administrateur."
          : `non envoyé (${canal.motif || 'motif non précisé'}).`;

  return (
    <span className="text-micro text-(--amber)">
      {nom} : {explication}
    </span>
  );
}

/** Renvoi de la confirmation de visite, sur une interaction qui planifie un
 * rendez-vous. Le message part sur **deux canaux tentés indépendamment**,
 * email et WhatsApp : l'échec de l'un n'empêche jamais l'autre.
 *
 * L'issue s'affiche en ligne plutôt qu'en toast : elle porte les destinataires
 * retenus, que le commercial doit pouvoir relire, et un motif par canal qui lui
 * dit quoi faire ensuite. Un toast disparaîtrait avant qu'il ait vérifié.
 *
 * `envoye: false` n'est **pas** rendu comme une erreur : c'est un 200. */
function ConfirmationVisiteButton({ prospectionId, interactionId }: { prospectionId: string; interactionId: string }) {
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
      // Ne restent ici que les vraies erreurs : 404 (introuvable ou hors
      // périmètre) et 409 (aucun rendez-vous à confirmer).
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

/** Nombre saisi au clavier français : la virgule décimale est acceptée, et un
 * champ vide vaut « non renseigné » plutôt que 0 — la distinction compte, le
 * backend traitant l'absence de `prix` comme « partir du prix catalogue ». */
function nombreSaisi(v: string): number | undefined {
  const t = v.trim().replace(',', '.');
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** Envoi de l'**offre de prix** — second temps de l'après-visite, là où le
 * remerciement, lui, part tout seul au passage à l'étape « 4 APRES VISITES ».
 * L'offre demande un prix qu'un humain doit arrêter, d'où ce formulaire.
 *
 * **Le garde-fou du lot est l'essentiel de cet écran.** Le montant vient du
 * lot, et le lot n'est renseigné que sur 7 % des prospections de cette étape
 * (94 sur 1 266) : sans lui l'appel répond 409. Plutôt que de laisser partir
 * neuf clics sur dix pour rien, le bouton reste visible mais inactif, avec le
 * geste à faire et un lien vers l'onglet « Article » — qui porte déjà le
 * rattachement (`ChoixArticleSection`). Le 409 est tout de même rattrapé : le
 * serveur reste seul juge, et l'étape peut changer sous nos pieds.
 *
 * Rendu sous le sélecteur d'étape et **seulement à partir de l'étape 4** :
 * avant, un bouton perpétuellement grisé ne serait que du bruit. */
function OffrePrixSection({
  prospectionId,
  articleId,
  onVoirArticle,
}: {
  prospectionId: string;
  articleId?: string;
  onVoirArticle: () => void;
}) {
  const modes = useModesPaiement();
  const [ouvert, setOuvert] = useState(false);
  const [remise, setRemise] = useState('');
  const [prix, setPrix] = useState('');
  const [modePaiementId, setModePaiementId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [resultat, setResultat] = useState<ResultatEnvoiOffreDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sansLot = !articleId;
  const remiseVal = nombreSaisi(remise);
  const prixVal = nombreSaisi(prix);
  const remiseInvalide = remiseVal !== undefined && (remiseVal < 0 || remiseVal > 100);
  const prixInvalide = prixVal !== undefined && prixVal <= 0;

  async function envoyer() {
    setBusy(true);
    setError(null);
    setResultat(null);
    // Champs vides omis : un corps vide est un appel valide qui signifie
    // « plein tarif du lot ». Envoyer `remisePercent: 0` reviendrait au même
    // montant mais interdirait la réutilisation d'une offre existante, le
    // backend ne réutilisant que si l'appel n'impose ni remise ni prix.
    const body: EnvoyerOffrePrixRequest = {};
    if (remiseVal !== undefined) body.remisePercent = remiseVal;
    if (prixVal !== undefined) body.prix = prixVal;
    if (modePaiementId) body.modePaiementId = modePaiementId;
    if (notes.trim()) body.notes = notes.trim();
    try {
      setResultat(await envoyerOffrePrix(prospectionId, body));
    } catch (err) {
      // Le 409 n'est pas une panne : lot manquant, ou étape qui n'est plus la
      // bonne. Le message du backend porte déjà le geste à faire.
      setError(
        err instanceof ApiError && err.status === 409
          ? err.message
          : err instanceof Error
            ? err.message
            : "Échec de l'envoi de l'offre.",
      );
    } finally {
      setBusy(false);
    }
  }

  // 8 prospects sur 10 n'ont pas d'adresse à cette étape (19,7 % contre 99,7 %
  // de numéros exploitables) : sans ce rappel, l'avertissement ambre de
  // `LigneCanal` se lit comme un incident alors que c'est la normale.
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
          {/* L'offre est créée avant l'envoi et le reste quoi qu'il arrive :
              son numéro s'affiche donc même quand les deux canaux échouent,
              sans quoi le commercial la croirait perdue et en régénérerait une
              sous un autre numéro. */}
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
  const { data: p, loading, error, refetch } = useApi(() => getProspection(id!), [id], 'prospection');
  // Cascade reference down to the linked Prospect — same pipeline-chain
  // convention as Dossier's own "Prospection" reference: each stage links
  // to the one before it. Only fetched once the prospection actually
  // resolved to a prospect (unset while still a pré-prospection).
  const linkedProspect = useApi(() => (p?.prospectId ? getProspect(p.prospectId) : Promise.resolve(null)), [p?.prospectId], 'prospection-prospect');
  const [interactionsPage, setInteractionsPage] = useState(0);
  const interactions = useApi(() => listInteractions(id!, { page: interactionsPage, size: 20 }), [id, interactionsPage], 'prospection-interactions');

  // L'endpoint email-visite n'accepte que les interactions qui planifient un
  // rendez-vous, et répond 409 sinon. `necessiteDateRdv` du référentiel porte
  // exactement cette liste (« Rendez vous pris », « RDV reporté », « Le prospect
  // veut faire une visite du projet ») — s'y adosser évite de coder ces
  // libellés métier en dur, et couvre le cas « visite » que `dateRdv` seul
  // manquerait puisque celui-ci ne vaut que pour les deux premiers.
  const resultatsInteraction = useResultatsInteraction();
  const resultatsAvecRdv = useMemo(
    () => new Set((resultatsInteraction.data ?? []).filter((r) => r.necessiteDateRdv).map((r) => r.id)),
    [resultatsInteraction.data],
  );
  // Parcours pré-prospect → prospect → prospection — GET
  // /api/prospections/{id}/historique, distinct from the interactions/
  // "Actions" timeline above: this one is the two transitions the API
  // writes automatically ("Prospect créé et lié", "Transformée en
  // prospection"), not manually-logged calls/visits/notes.
  const [parcoursPage, setParcoursPage] = useState(0);
  const parcours = useApi(() => listProspectionHistorique(id!, { page: parcoursPage, size: 20 }), [id, parcoursPage], 'prospection-parcours');
  const { commerciaux } = useAppData();
  const { user } = useAuth();
  // A commercial assigning themselves doesn't need the "pick a commercial"
  // dropdown at all — `user.employeeId` is the CfgTier id created for their
  // account (POST /api/utilisateurs), the same id space `commerciaux`
  // (CfgTier rows of kind commercial) uses, so this resolves whenever the
  // logged-in employee actually is one of the assignable commerciaux.
  const ownCommercial = commerciaux.find((c) => c.id === user?.employeeId) ?? null;
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [showCreateProspect, setShowCreateProspect] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [transformCommercial, setTransformCommercial] = useState<string | null>(null);
  const [showArchiver, setShowArchiver] = useState(false);
  const [raisonId, setRaisonId] = useState<string | null>(null);
  const [raisonTexte, setRaisonTexte] = useState('');
  const [busy, setBusy] = useState(false);
  // « Étape » par défaut, comme le dossier ouvre sur « Statut » : la première
  // question devant une fiche est où elle en est, pas quels sont ses termes.
  const [tab, setTab] = useState<ProspectionTab>('etape');
  const [saving, setSaving] = useState(false);

  /* Le formulaire est **toujours** ouvert : la fiche du logiciel de bureau
     n'a pas de mode consultation, on y corrige une source de contact en la
     changeant. L'ancien couple « Modifier / Enregistrer » ajoutait un clic
     avant chaque correction et un état de plus à tenir. */
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
  /* Les supports sont servis **par origine** : changer la source de contact
     recharge la liste, et le brouillon — pas la valeur du serveur — est ce qui
     la pilote, sinon le champ proposerait les supports de l'ancienne origine
     jusqu'au prochain enregistrement. */
  const supports = useApi(
    () => (form.valeurs.origineId ? getSupportsForOrigine(form.valeurs.origineId) : Promise.resolve([])),
    [form.valeurs.origineId],
    'prospection-supports',
  );

  const autresTranches = useApi(() => (id ? listProspectionAutresTranches(id) : Promise.resolve([])), [id], 'prospection-autres-tranches');
  const [devisPage, setDevisPage] = useState(0);
  const devis = useApi(() => listDevis(id!, { page: devisPage, size: 20 }), [id, devisPage], 'prospection-devis');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  }

  // `!p` : cf. DossierDetail — une prospection déjà vue se repeint depuis le
  // cache, la revalidation restant invisible.
  if (loading && !p) return <PageShell title={isPreRoute ? 'Pré-prospection' : 'Prospection'}><LoadingState /></PageShell>;
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
  const isPre = !p.prospectId;
  /* Le parcours n'a de sens que sur une prospection ouverte et dans le
     pipeline : une clôturée ou une garée sur une voie de côté
     (« À rappeler », « Affaires à suivre ») n'a pas de rang à montrer. */
  const showStepper = !p.fermee && !isSideTrackEtape(p.etape) && stageIdx >= 0;
  const commercialItems = commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id }));
  // Dossier déjà issu de cette prospection, s'il existe. Le lien vit dans
  // `activite` (vue légataire), pas au premier niveau du DTO. Hoisté ici parce
  // que le narrowing d'un `p.activite?.dossierId` testé en JSX ne survit pas
  // jusqu'au closure du onClick.
  const dossierIssu = p.activite?.dossierId
    ? { id: p.activite.dossierId, code: p.activite.dossierCode }
    : null;
  // Rang 1 du guide : les deux seuls indicateurs de l'en-tête, donc toujours
  // visibles quand ils existent. Hoistés pour la même raison que `dossierIssu`
  // — et parce que `null` doit rester distinct de `0` : « aucune interaction »
  // et « bloc d'activité absent » ne se disent pas de la même façon.
  const joursInactivite = typeof p.activite?.joursInactivite === 'number' ? p.activite.joursInactivite : null;
  const nbInteractions = typeof p.activite?.nbInteractions === 'number' ? p.activite.nbInteractions : null;

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

  /** Enregistre la fiche. Deux endpoints, appelés **seulement si leurs champs
   * ont bougé** : `PATCH /{id}` porte la qualification, `PATCH /{id}/etape`
   * porte l'étape et écrit une ligne d'historique. Appeler les deux
   * systématiquement inscrirait des changements d'étape qui n'ont pas eu lieu.
   *
   * La clôture garde son propre geste : elle est destructive et demande une
   * raison, elle n'a pas sa place derrière le même bouton que six listes
   * déroulantes. */
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
      // Le brouillon devient la base avant le refetch : sans ça, le formulaire
      // resterait « modifié » le temps de l'aller-retour, et sa propre garde
      // anti-écrasement empêcherait la resynchronisation.
      form.confirmer(form.valeurs);
      await refetch();
      showToast('Fiche enregistrée.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
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

  return (
    <PageShell
      title={name}
      crumbs={[{ label: listLabel, to: listPath }, { label: p.code || name }]}
      fullHeight
      icon={isPreRoute ? <UserPlus /> : <Users />}
      accent={sectionAccent}
      accentBg={isPreRoute ? 'var(--sec-preprospection-bg)' : 'var(--sec-prospection-bg)'}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <ProspectionDocumentButtons prospectionId={p.id} hasProspect={!!p.prospectId} />
          <Button variant="outline" size="sm" onClick={() => showToast('Intégration VOIP à venir.')}>
            <Phone data-icon="inline-start" /> Appeler
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowInteractionForm(true)}>
            Ajouter une action
          </Button>
          {!p.fermee && !showArchiver && (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowArchiver(true)}
              disabled={busy}
            >
              Clôturer
            </Button>
          )}
          <Separator orientation="vertical" className="h-6" />
          {/* L'action propre à l'état courant reste seule, après le filet :
              c'est la seule de la barre qui fasse avancer la prospection. */}
          {isPre ? (
            <Button variant="outline" size="sm" onClick={() => setShowCreateProspect(true)}>
              <Plus data-icon="inline-start" /> Créer prospect
            </Button>
          ) : !p.commercialId ? (
            ownCommercial ? (
              <Button size="sm" onClick={() => handleTransform(ownCommercial.id)} disabled={busy}>
                Transformer · {commercialLabel(ownCommercial)}
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <Select items={commercialItems} value={transformCommercial} onValueChange={(v) => setTransformCommercial(v as string | null)}>
                  <SelectTrigger size="sm" className="w-44">
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
                <Button size="sm" onClick={() => transformCommercial && handleTransform(transformCommercial)} disabled={!transformCommercial || busy}>
                  Transformer
                </Button>
              </div>
            )
          ) : dossierIssu ? (
            <Button size="sm" onClick={() => navigate(`/dossiers/${dossierIssu.id}`)}>
              <ArrowUpRight data-icon="inline-start" /> Dossier {dossierIssu.code ?? ''}
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate(`/prospections/${p.id}/nouveau-dossier`)} disabled={p.fermee}>
              Créer un dossier
            </Button>
          )}
        </div>
      }
    >
      <FicheShell
        ongletActif={tab}
        onOngletChange={(v) => setTab(v as ProspectionTab)}
        /* ---------------------------------------------------------------
           Bande 1 — l'identité. Le logiciel de bureau met le code dans le
           titre de la fenêtre et l'étape dans un champ du formulaire ; ici
           les deux montent dans une bande unique avec les indicateurs
           d'activité, qui n'existent pas là-bas et sont ce que le guide
           backend désigne comme le champ le plus utile du lot.
           --------------------------------------------------------------- */
        identite={
          <Card padded={false} accent={sectionAccent}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
              <Badge tone="neutral" className="font-mono">{p.code || '—'}</Badge>
              <h2 className="min-w-0 truncate text-label font-semibold text-foreground">{name}</h2>
              {isPre && <Badge tone="amber">Non qualifiée</Badge>}
              <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge>
              {joursInactivite !== null && <InactiviteBadge jours={joursInactivite} />}

              <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-muted-foreground">
                <span>Créée le {formatDate(p.dateDocument)}</span>
                <span>{p.commercialNom || '— non assigné —'}</span>
                {p.societeCode && <span>Société {p.societeCode}</span>}
                {nbInteractions !== null && <span>{nbInteractions} interaction{nbInteractions > 1 ? 's' : ''}</span>}
                {/* `null` ≠ `0` : une pré-prospection n'a pas de bloc
                    d'activité, elle n'a pas « zéro interaction ». */}
                {!p.activite && <span className="italic">Activité non disponible</span>}
              </span>
            </div>

            {/* Le marqueur de tri passe avant tout le reste : une fiche sur
                cinq du vivier est un doublon ou du spam encore rangé à
                « 1 A TRAITER », et rien d'autre à l'écran ne le dit. */}
            {(p.marqueurTri || p.noteQualification) && (
              <div className="border-t border-border px-3 py-1.5">
                <MarqueurTri p={p} />
              </div>
            )}

            {dossierIssu && (
              <div className="border-t border-border px-3 py-1.5">
                <DossierIssuBanner
                  dossierId={p.activite?.dossierId}
                  dossierCode={p.activite?.dossierCode}
                  statutDossier={p.activite?.statutDossier}
                />
              </div>
            )}
          </Card>
        }
        /* ---------------------------------------------------------------
           Bande 2 — le formulaire. Même contenu et même ordre de lecture
           que le formulaire du logiciel de bureau, sur quatre colonnes au
           lieu de deux : le libellé passe au-dessus du champ, ce qui rend
           la moitié de la largeur que la colonne de libellés occupait.
           C'est cette moitié qui laisse la place aux onglets sans faire
           défiler la page.

           Tout ce qui est modifiable l'est **en même temps** : un seul
           Enregistrer, qui n'appelle que les endpoints dont les champs ont
           bougé.
           --------------------------------------------------------------- */
        formulaire={
          <Card padded={false}>
            <div className="p-3">
              <GrilleFiche>
                <ChampLecture label="Code" valeur={p.code} aide="Attribué par le système, non modifiable." />
                <ChampLecture label="Date" valeur={formatDate(p.dateDocument)} aide="Date de création, non modifiable." />
                {/* Une pré-prospection n'a pas de fiche tiers : le lead vit
                    dans les trois champs `temp*`, qui sont ses seules
                    coordonnées. Le logiciel de bureau les rend modifiables ;
                    `ModifierProspectionRequest` ne les porte pas, d'où le
                    cadenas plutôt qu'un champ qui perdrait la saisie. */}
                {isPre ? (
                  <>
                    <ChampLecture
                      label="Description"
                      valeur={p.tempDescription}
                      aide="Le nom saisi à la capture du lead. Absent de ModifierProspectionRequest — demande backend en cours."
                    />
                    <ChampLecture
                      label="Téléphone"
                      valeur={p.tempTel}
                      aide="Idem : servi, mais non modifiable par l'API."
                    />
                    <ChampLecture label="Email" valeur={p.tempEmail} aide="Idem : servi, mais non modifiable par l'API." />
                  </>
                ) : (
                  <>
                    <ChampLecture
                      label="Prospect"
                      aide="La fiche tiers se modifie depuis l'onglet Contacts."
                      valeur={
                        p.prospectId ? (
                          <Link to={`/prospects/${p.prospectId}`} className="text-(--info) hover:underline">
                            {p.prospectNom || p.prospectCode || 'Voir la fiche'}
                          </Link>
                        ) : (
                          p.tempDescription || p.prospectNom
                        )
                      }
                    />
                    <ChampLecture
                      label="Commercial"
                      valeur={p.commercialNom}
                      aide="Assigné à la transformation ; aucun endpoint ne le change ensuite."
                    />
                  </>
                )}

                <ChampLecture
                  label="Tranche"
                  valeur={p.trancheDescription || p.trancheCode}
                  aide="Se modifie dans l'onglet « Choix article » — le serveur l'expose sur un endpoint distinct."
                />
                {/* Article : mesuré à 0,2 % sur les pré-prospections. Le guide
                    est explicite — ne pas lui réserver de place. L'onglet
                    « Choix article » reste là pour en poser un. */}
                {!isPre && (
                  <ChampLecture
                    label="Article"
                    valeur={p.articleCode ? `${p.articleCode}${p.articleDescription ? ` · ${p.articleDescription}` : ''}` : null}
                    aide="Se modifie dans l'onglet « Choix article »."
                  />
                )}
                <ChampRef
                  id="f-etape"
                  label="Nature"
                  aide="L'« étape » du pipeline — appelée Nature dans le logiciel de bureau."
                  valeur={form.valeurs.etapeId}
                  onChange={(v) => form.set('etapeId', v)}
                  items={referentielItems(etapes.data)}
                  modifie={form.aChange('etapeId')}
                />
                <ChampRef
                  id="f-action"
                  label="Action commerciale"
                  valeur={form.valeurs.actionCommercialeId}
                  onChange={(v) => form.set('actionCommercialeId', v)}
                  items={referentielItems(actionsCommerciales.data)}
                  modifie={form.aChange('actionCommercialeId')}
                />

                <ChampRef
                  id="f-origine"
                  label="Source de contact"
                  valeur={form.valeurs.origineId}
                  /* Changer l'origine invalide le support : les supports sont
                     servis *par* origine, et garder l'ancien enverrait un
                     couple incohérent. */
                  onChange={(v) => {
                    form.set('origineId', v);
                    form.set('origineSupportId', null);
                  }}
                  items={referentielItems(origines.data)}
                  modifie={form.aChange('origineId')}
                />
                <ChampRef
                  id="f-support"
                  label="Support"
                  aide="Campagne précise, servie selon la source de contact choisie."
                  valeur={form.valeurs.origineSupportId}
                  onChange={(v) => form.set('origineSupportId', v)}
                  items={referentielItems(supports.data ?? [])}
                  modifie={form.aChange('origineSupportId')}
                />
                <ChampRef
                  id="f-typeContact"
                  label="Type"
                  aide="Type de contact : téléphone entrant, visite, web…"
                  valeur={form.valeurs.typeContactId}
                  onChange={(v) => form.set('typeContactId', v)}
                  items={referentielItems(typesContact.data)}
                  modifie={form.aChange('typeContactId')}
                />
                <ChampRef
                  id="f-vocation"
                  label="Vocation"
                  valeur={form.valeurs.vocationId}
                  onChange={(v) => form.set('vocationId', v)}
                  items={referentielItems(vocations.data)}
                  modifie={form.aChange('vocationId')}
                />
              </GrilleFiche>

              <div className="mt-2 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                <ChampNotes
                  id="f-notes"
                  label="Notes"
                  lignes={3}
                  valeur={form.valeurs.notes}
                  onChange={(v) => form.set('notes', v)}
                  modifie={form.aChange('notes')}
                  className="md:col-span-2"
                />

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 self-start md:col-span-1 xl:col-span-2">
                  {/* La tranche est renseignée sur 95,5 % des pré-prospections,
                      et la société en dérive : elle reste utile ici. */}
                  <ChampLecture label="Société" valeur={p.societeLibelle || p.societeCode} aide="Dérivée de la tranche, jamais saisie." />
                  {isPre ? (
                    <ChampLecture
                      label="Commercial"
                      valeur={p.commercialNom}
                      aide="Vide tant que la pré-prospection n'est pas transformée — mesuré sur 14 fiches, aucune n'en porte."
                    />
                  ) : (
                    <ChampLecture
                      label="Ancien client"
                      valeur={p.ancienClient === null || p.ancienClient === undefined ? null : p.ancienClient ? 'Oui' : 'Non'}
                      aide="Servi par la fiche mais absent de ModifierProspectionRequest : lecture seule tant que le backend ne l'expose pas."
                    />
                  )}
                  <ChampLecture label="Type de tiers" valeur={p.typeProspectLibelle || p.typeProspect} />
                  <ChampLecture
                    label="Mobile"
                    valeur={p.mobileProspect ? `+${p.indicatifMobile ?? ''} ${p.mobileProspect}`.replace('+ ', '') : (p.tempTel ?? null)}
                    aide="L'indicatif est servi sans le « + » — il est composé ici."
                  />
                  {!isPre && <ChampLecture label="Email" valeur={p.emailFiche || p.tempEmail} className="col-span-2" />}
                  {/* Clôture : mesurée à 0 % sur les pré-prospections — aucune
                      n'est jamais clôturée. Pas de place réservée. */}
                  {!isPre && p.fermee && (
                    <>
                      <ChampLecture label="Date d'archivage" valeur={formatDate(p.dateFermeture)} />
                      <ChampLecture label="Raison" valeur={p.raisonFermeture} />
                    </>
                  )}
                </div>
              </div>

              {showArchiver && (
                <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-label font-semibold text-destructive">Clôturer la prospection</span>
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
                      Confirmer la clôture
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        }
        /* ---------------------------------------------------------------
           La barre n'existe que s'il y a quelque chose à enregistrer, et
           elle se place au contact du formulaire plutôt qu'en pied de page.
           Elle nomme ce qui a bougé : à quinze champs, « 2 modifications »
           ne dit pas lesquelles.
           --------------------------------------------------------------- */
        barreAction={
          form.estModifie ? (
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
          ) : undefined
        }
        /* ---------------------------------------------------------------
           Bande 3 — les onglets du logiciel de bureau, dans son ordre. Sept
           sur une prospection, **cinq sur une pré-prospection** : ni Offres ni
           Contacts, exactement comme là-bas. Ce n'est pas un raccourci — un
           lead non transformé n'a pas de fiche tiers à montrer, et une offre
           suppose un article, mesuré à 0,2 % sur cette population.
           Rien de ce que l'écran savait faire n'est perdu : les offres, le
           journal et le sélecteur d'article en cascade sont relogés tels
           quels. Ce qui s'ajoute, ce sont les quatre sous-collections dont
           les fonctions existaient depuis des mois sans aucun appelant.
           --------------------------------------------------------------- */
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
                    {/* Sur mobile, les cinq libellés serrés dans ~68 px chacun
                        formeraient une échelle illisible : on ne nomme que
                        l'étape courante. */}
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

                {/* L'étape se change ici **ou** par le champ « Nature » du
                    formulaire, qui passe par le même endpoint. Deux chemins
                    pour un même geste, assumés : celui-ci montre le parcours,
                    l'autre se corrige au fil de la saisie. */}
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
                        modification non enregistrée — le bouton Enregistrer est sous le formulaire
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
                  items={autresTranches.data ?? []}
                  onRemove={async (itemId) => { await removeProspectionAutreTranche(p.id, itemId); autresTranches.refetch(); }}
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
                {/* L'offre de prix n'a de sens qu'après les visites. Elle
                    suivait le sélecteur d'étape ; elle suit maintenant
                    l'article, qui est ce sur quoi elle porte. */}
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
              <div className="flex flex-col gap-3 p-3">
                <ActiviteCard activite={p.activite} accent={sectionAccent} />

                {interactions.loading && !interactions.data && <LoadingState />}
                {interactions.error && <ErrorState message={interactions.error} />}
                {interactions.data && interactions.data.content.length === 0 && (
                  <p className="text-label text-muted-foreground">Aucune action enregistrée pour cette prospection.</p>
                )}
                {interactions.data && interactions.data.content.length > 0 && (
                  /* Table dense au lieu de la timeline (demande du 20/09) :
                     une ligne par action, triée serveur. Les règles
                     d'affichage de l'ancienne timeline sont conservées :
                     `categorie` n'apparaît que hors de l'ordinaire
                     (« Prospection » = 46 666 lignes sur 48 160 — la badger
                     partout serait 20 fois le même mot par page), et la
                     tranche seulement quand elle diverge de celle de la
                     prospection. */
                  /* Sans cadre propre : le panneau d'onglet fournit déjà le
                     sien — bordure sur bordure était un cadre dans le cadre. */
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
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
                            {/* La note entière, jamais tronquée (demande du
                                20/09) : la cellule replie le texte et la ligne
                                grandit — h-(--row-h) est un minimum, pas un
                                plafond. min-w évite que la colonne s'écrase,
                                max-w qu'elle avale la table. */}
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

                {/* Le parcours — les deux transitions que l'API écrit
                    elle-même — reste sous le journal manuel plutôt que dans
                    un onglet à lui : c'est la même chronologie, vue par
                    l'autre bout. */}
                <div className="border-t border-border pt-3">
                  <div className="mb-2 text-micro font-medium text-muted-foreground">
                    Parcours ({parcours.data?.totalElements ?? 0})
                  </div>
                  {parcours.data && parcours.data.content.length === 0 && (
                    <p className="text-body text-muted-foreground">
                      Aucune transition tracée — apparaîtra dès que cette fiche sera liée à un prospect ou transformée.
                    </p>
                  )}
                  {parcours.data && parcours.data.content.length > 0 && (
                    <TimelineList>
                      {parcours.data.content.map((h, i) => (
                        <TimelineRow
                          key={h.id}
                          dernier={i === parcours.data!.content.length - 1}
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
                          <Button variant="outline" size="sm" onClick={() => navigate(`/prospects/${p.prospectId}`)}>
                            <ArrowUpRight data-icon="inline-start" /> Ouvrir la fiche prospect
                          </Button>
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
      {error && <p className="text-body text-destructive">{error}</p>}
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
  onRemove,
  onEdited,
  navigate,
}: {
  prospectionId: string;
  item: { id: string; trancheId?: string; tranche?: string; articleId?: string; article?: string };
  onRemove: (itemId: string) => Promise<void>;
  onEdited: () => Promise<void>;
  navigate: (path: string) => void;
}) {
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
  return (
    <Card title="Articles associés">
      <div className="flex flex-col gap-2">
        {items.length === 0 && <span className="text-body text-muted-foreground">Aucun article associé pour l'instant.</span>}
        {items.map((t) => (
          <ArticleAssocieRow key={t.id} prospectionId={prospectionId} item={t} onRemove={onRemove} onEdited={onEdited} navigate={navigate} />
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

