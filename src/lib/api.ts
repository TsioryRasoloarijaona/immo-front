// Real API client — talks to the Spring Boot backend described in
// docs/api-docsV0.json. No more static JSON / mock mutation layer: every
// function here issues an actual HTTP request.

import { clearCachedValues } from './apiCache';
import type {
  AffecterProjetsRequest,
  AjouterAutreTrancheRequest,
  AjouterCategorieRequest,
  AjouterProfilRequest,
  AjouterTypeBienRequest,
  AjouterVilleRequest,
  ArchiverProspectionRequest,
  ArticleDetailDto,
  ArticleListItemDto,
  ArticleStatut,
  ChangerEtapeRequest,
  ChangerMotDePasseRequest,
  ChangerStatutRequest,
  ClientListItemDto,
  CommercialListItemDto,
  CompleterProfilRequest,
  ConnexionRequest,
  ContactProspectDto,
  CreerContactProspectRequest,
  CreerDevisRequest,
  CreerDossierRequest,
  CreerEcheanceRequest,
  CreerEmployeRequest,
  CreerEmployeResponse,
  CreerInteractionRequest,
  CreerProspectRequest,
  CreerProspectionRequest,
  CreerReglementRequest,
  DashboardDto,
  DevisDto,
  DevisPageDto,
  DossierDetailDto,
  DossierListItemDto,
  EcheanceDto,
  EncaissementDto,
  EtapeSuivanteDto,
  EvenementCalendrierDto,
  HistoriqueDto,
  HistoriqueEvenementDto,
  HotlineResultDto,
  InteractionDto,
  ModifierEcheanceRequest,
  ModifierProspectRequest,
  ModifierProspectionRequest,
  ModifierStatutReglementRequest,
  ModifierTranchePrincipaleRequest,
  MontantsDossierDto,
  OrigineProspectionDto,
  PageDto,
  Pageable,
  PayeurDto,
  PaysDto,
  PieceJointeDto,
  ProfilCategorieDto,
  ProjetDetailDto,
  ProjetListItemDto,
  PerformanceCommercialDto,
  ProjetPerimetreDto,
  ProspectDetailDto,
  ProspectListItemDto,
  ProspectionAutreTrancheDto,
  ProspectionCategorieDto,
  ProspectionDetailDto,
  ProspectionListItemDto,
  ProspectionProfilDto,
  ProspectionTypeBienDto,
  ProspectionVilleDto,
  ReferentielItemDto,
  ReglementDto,
  ReglementProspectDto,
  ReinitialiserMotDePasseResponse,
  ResultatInteractionDto,
  SchemaFinancementDto,
  SimulerSchemaFinancementRequest,
  TitreDto,
  TransformerProspectionRequest,
  TrancheDetailDto,
  TrancheListItemDto,
  TypeReglementDto,
  UtilisateurCourantDto,
  UtilisateurListItemDto,
  UUID,
  VilleDto,
} from '../types';

/** Default page size used whenever a caller doesn't specify one. */
export const DEFAULT_PAGE_SIZE = 20;

function withPageable(
  params: Record<string, string | number | boolean | string[] | undefined | null> | undefined,
  pageable?: Pageable,
): Record<string, string | number | boolean | string[] | undefined | null> {
  return {
    ...params,
    page: pageable?.page ?? 0,
    size: pageable?.size ?? DEFAULT_PAGE_SIZE,
    sort: pageable?.sort,
  };
}

// `back_end_url` (if set — see .env) always wins, for pointing at a
// specific/remote backend. The name has no `VITE_` prefix on purpose (Vercel
// rejected that one), so `vite.config.ts` declares an `envPrefix` entry for
// it — without that, Vite would not inject it and this would silently be
// `undefined` in the production bundle.
// Otherwise, fall back to the *same host the page
// was loaded from*, port 8080 — not a hardcoded 'localhost'. A hardcoded
// localhost default works fine when both frontend and backend run on the
// developer's own machine, but breaks for anyone else on the network: a
// phone/laptop that loads the frontend from the dev machine's LAN IP
// (e.g. http://192.168.1.50:5173) would still send API calls to its own
// "localhost:8080", which has no backend running on it at all — this is
// the actual cause behind "backend unreachable from another device."
// `window.location.hostname` is whatever host the browser used to reach
// this page, so it's correct in every case: localhost, 127.0.0.1, or a LAN
// IP — no per-device/per-network configuration needed.
export const API_BASE_URL: string =
  (import.meta.env.back_end_url as string | undefined)?.replace(/\/$/, '') ||
  `${window.location.protocol}//${window.location.hostname}:8080`;

export class ApiError extends Error {
  status: number;
  /** Corps ProblemDetail (RFC 7807) parsé, quand la réponse en portait un.
   * Sans lui, un 409 métier n'est qu'une phrase : `PATCH .../statut` renvoie
   * par exemple `transitionsAutorisees` à côté de `detail`, et c'est la seule
   * façon de proposer les cibles réellement possibles à l'utilisateur. */
  problem?: Record<string, unknown>;
  constructor(status: number, message: string, problem?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

/** Lit le corps d'erreur une seule fois et en tire (message lisible, corps
 * ProblemDetail). Spring renvoie `{detail, title, status, …}` : on affiche
 * `detail` (ou `title`) plutôt que de déverser le JSON brut, tout en gardant
 * l'objet parsé pour les appelants qui ont besoin d'un champ métier précis.
 * Partagé par `performRequest` et l'upload multipart — les deux seuls
 * endroits qui construisent une `ApiError` à partir d'une réponse HTTP. */
async function readErrorBody(res: Response, fallback: string): Promise<{ message: string; problem?: Record<string, unknown> }> {
  let text: string;
  try {
    text = await res.text();
  } catch {
    return { message: fallback };
  }
  if (!text) return { message: fallback };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { message: `${fallback} — ${text.slice(0, 300)}` };
  }
  const problem = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : undefined;
  const detail =
    typeof problem?.detail === 'string' ? problem.detail : typeof problem?.title === 'string' ? problem.title : null;
  return { message: detail || `${fallback} — ${text.slice(0, 300)}`, problem };
}

type QueryValue = string | number | boolean | string[] | undefined | null;

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      for (const item of v) usp.append(k, item);
      continue;
    }
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

// ---------------------------------------------------------------------------
// GET cache — every navigation (switching tabs, going back to a list you
// just left, …) used to re-hit the backend even when nothing changed.
// GET responses are now cached in memory by full URL (method is implicit —
// only GETs are cached) for CACHE_TTL_MS, and in-flight requests for the
// same URL are deduplicated instead of firing twice. Any mutating call
// (POST/PATCH/PUT/DELETE) that succeeds clears the whole cache — simpler
// and safer than trying to invalidate just the affected resource, and the
// cache is cheap to rebuild.
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  expiresAt: number;
  promise: Promise<unknown>;
}

const getCache = new Map<string, CacheEntry>();

/** Point unique par lequel remonte l'expiration de session.
 *
 * Le cookie JWT est `httpOnly` : le front ne peut ni le lire ni connaître sa
 * date d'expiration, et la spec n'expose aucun endpoint de rafraîchissement.
 * Un 401 sur un appel quelconque est donc le **seul** signal disponible pour
 * savoir que la session est morte.
 *
 * Sans cet accrochage, `AuthProvider` — qui n'interroge `/api/mon-compte` qu'au
 * montage — restait indéfiniment sur `status: 'authenticated'` après
 * l'expiration : chaque page affichait son propre bandeau d'erreur, les
 * référentiels se vidaient, et seul un rafraîchissement complet finissait par
 * ramener l'écran de connexion.
 *
 * `auth.tsx` s'abonne au montage ; l'abonné est unique, il n'y a qu'un
 * `AuthProvider`. */
type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

/** Un 401 sur le formulaire de connexion n'est pas une expiration : c'est un
 * mauvais identifiant, et il doit rester au formulaire — le transformer en
 * « session expirée » afficherait un message absurde à quelqu'un qui n'a
 * jamais été connecté. */
function signalerSiSessionExpiree(url: string, status: number): void {
  if (status !== 401) return;
  if (url.includes('/api/auth/connexion')) return;
  unauthorizedHandler?.();
}

/** Escape hatch for callers that need a guaranteed-fresh read (e.g. after an
 * out-of-band change). Not needed for normal use — mutations already clear
 * the cache automatically. */
export function clearApiCache(): void {
  getCache.clear();
  clearCachedValues();
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  opts?: { body?: unknown; query?: Record<string, QueryValue> },
): Promise<T> {
  const url = `${API_BASE_URL}${path}${buildQuery(opts?.query)}`;

  if (method === 'GET') {
    const cached = getCache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.promise as Promise<T>;
    }
    const promise = performRequest<T>(method, url, opts);
    getCache.set(url, { expiresAt: Date.now() + CACHE_TTL_MS, promise });
    // A failed request must not poison the cache for the next attempt.
    promise.catch(() => getCache.delete(url));
    return promise;
  }

  const result = await performRequest<T>(method, url, opts);
  clearApiCache();
  return result;
}

async function performRequest<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string,
  opts?: { body?: unknown; query?: Record<string, QueryValue> },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: opts?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
      // Auth (V4) rides on an httpOnly `access_token` cookie set by
      // /api/auth/connexion — without `include`, cross-origin dev setups
      // (frontend on a different port than the backend) would silently
      // never send it back, and every call would look like a 401.
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, `Impossible de joindre l'API (${API_BASE_URL}). Vérifiez que le backend tourne.`);
  }
  if (!res.ok) {
    signalerSiSessionExpiree(url, res.status);
    const { message, problem } = await readErrorBody(res, `${method} ${url} a échoué (${res.status})`);
    throw new ApiError(res.status, message, problem);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Prospects
// ---------------------------------------------------------------------------

export function listProspects(
  params?: {
    search?: string;
    /** Repeatable — pass several to OR-match any of them. Backend today only
     * binds the first value of a repeated `type` param (see
     * docs/filtres-avances.md); kept as `string[]` here so the UI is ready
     * the moment the backend adds real array support. */
    type?: string[];
  },
  pageable?: Pageable,
): Promise<PageDto<ProspectListItemDto>> {
  return request('GET', '/api/prospects', { query: withPageable(params, pageable) });
}

export function getProspect(id: UUID): Promise<ProspectDetailDto> {
  return request('GET', `/api/prospects/${id}`);
}

// "Clients" (V4) — anyone who's the clientId of at least one dossier, with
// server-aggregated totals. Distinct controller from /api/prospects, but
// /api/clients/{id} returns the same ProspectDetailDto shape.
export function listClients(params?: { search?: string }, pageable?: Pageable): Promise<PageDto<ClientListItemDto>> {
  return request('GET', '/api/clients', { query: withPageable(params, pageable) });
}

export function getClient(id: UUID): Promise<ProspectDetailDto> {
  return request('GET', `/api/clients/${id}`);
}

export function listClientDossiers(clientId: UUID, pageable?: Pageable): Promise<PageDto<DossierListItemDto>> {
  return request('GET', `/api/clients/${clientId}/dossiers`, { query: withPageable(undefined, pageable) });
}

export function createProspect(body: CreerProspectRequest): Promise<ProspectDetailDto> {
  return request('POST', '/api/prospects', { body });
}

export function updateProspect(id: UUID, body: ModifierProspectRequest): Promise<ProspectDetailDto> {
  return request('PATCH', `/api/prospects/${id}`, { body });
}

export function listProspectContacts(prospectId: UUID): Promise<ContactProspectDto[]> {
  return request('GET', `/api/prospects/${prospectId}/contacts`);
}

export function addProspectContact(prospectId: UUID, body: CreerContactProspectRequest): Promise<ContactProspectDto> {
  return request('POST', `/api/prospects/${prospectId}/contacts`, { body });
}

export function removeProspectContact(prospectId: UUID, contactId: UUID): Promise<void> {
  return request('DELETE', `/api/prospects/${prospectId}/contacts/${contactId}`);
}

export function listProspectReglements(prospectId: UUID, pageable?: Pageable): Promise<PageDto<ReglementProspectDto>> {
  return request('GET', `/api/prospects/${prospectId}/reglements`, { query: withPageable(undefined, pageable) });
}

export function listProspectProspections(prospectId: UUID, pageable?: Pageable): Promise<PageDto<ProspectionListItemDto>> {
  return request('GET', `/api/prospects/${prospectId}/prospections`, { query: withPageable(undefined, pageable) });
}

export function listProspectDossiers(prospectId: UUID, pageable?: Pageable): Promise<PageDto<DossierListItemDto>> {
  return request('GET', `/api/prospects/${prospectId}/dossiers`, { query: withPageable(undefined, pageable) });
}

export function listProspectHistorique(prospectId: UUID, pageable?: Pageable): Promise<PageDto<HistoriqueDto>> {
  return request('GET', `/api/prospects/${prospectId}/historique`, { query: withPageable(undefined, pageable) });
}

// ---------------------------------------------------------------------------
// Prospections / Pré-prospections
// ---------------------------------------------------------------------------

/** Shared filter shape for /api/prospections and /api/pre-prospections — the
 * two endpoints list the same underlying table (see CLAUDE.md) and accept
 * the same filter set, for UI consistency with /api/dossiers. All fields
 * below are real, repeatable-where-noted server-side params on both
 * endpoints as of docs/api-docsV4.json's 88-route revision (confirmed
 * 2026-08-22 — see docs/filtres-avances.md for the backend ask history). */
export interface ProspectionFilterParams {
  [key: string]: string | number | boolean | string[] | undefined | null;
  /** Repeatable — pass several to OR-match any of them. */
  etape?: string[];
  /** Repeatable — pass several to OR-match any of them. */
  origine?: string[];
  /** Repeatable — pass several to OR-match any of them. */
  commercial?: UUID[];
  /** Repeatable — pass several to OR-match prospections whose tranche is any of them. */
  trancheId?: UUID[];
  /** ISO-8601 datetime, inclusive lower bound on `dateDocument`. */
  dateDebut?: string;
  /** ISO-8601 datetime, inclusive upper bound on `dateDocument`. */
  dateFin?: string;
  search?: string;
  ouvertes?: boolean;
}

export function listProspections(
  params?: ProspectionFilterParams,
  pageable?: Pageable,
): Promise<PageDto<ProspectionListItemDto>> {
  return request('GET', '/api/prospections', { query: withPageable(params, pageable) });
}

export function getProspection(id: UUID): Promise<ProspectionDetailDto> {
  return request('GET', `/api/prospections/${id}`);
}

/** `POST /api/prospections` (from_front.md demande #9, livré) — crée une
 * prospection qualifiée pour un prospect existant. `prospectId` obligatoire
 * (400 sinon) ; pas de contrepartie pour un lead brut/non identifié, voir
 * plutôt le flux pré-prospection (`creerProspectFromPreProspection`/
 * `transformerProspection`, si câblés) pour ce cas-là. */
export function createProspection(body: CreerProspectionRequest): Promise<ProspectionDetailDto> {
  return request('POST', '/api/prospections', { body });
}

/** Piste d'audit paginée (plus récent en premier) des deux transitions du
 * parcours pré-prospect → prospect → prospection que cette API trace
 * elle-même — "Prospect créé et lié" (POST /api/pre-prospections/{id}/
 * creer-prospect) et "Transformée en prospection" (POST /api/prospections/
 * {id}/transformer). Comble une lacune réelle d'Omran : ces deux
 * transitions n'y sont tracées nulle part (ComProspection.UserUpdateDateTime
 * reste NULL même après transformation, la ligne étant mutée en place). La
 * date de création du pré-prospect n'est pas dupliquée ici, elle reste sur
 * ProspectionDetailDto.dateDocument. Le stade "Dossier de vente" a son
 * propre historique séparé, voir listHistoriqueDossier. */
export function listProspectionHistorique(id: UUID, pageable?: Pageable): Promise<PageDto<HistoriqueDto>> {
  return request('GET', `/api/prospections/${id}/historique`, { query: withPageable(undefined, pageable) });
}

export function listPreProspections(
  params?: ProspectionFilterParams,
  pageable?: Pageable,
): Promise<PageDto<ProspectionListItemDto>> {
  return request('GET', '/api/pre-prospections', { query: withPageable(params, pageable) });
}

export function creerProspectFromPreProspection(id: UUID, body: CreerProspectRequest): Promise<ProspectionDetailDto> {
  return request('POST', `/api/pre-prospections/${id}/creer-prospect`, { body });
}

export function transformerProspection(id: UUID, body: TransformerProspectionRequest): Promise<ProspectionDetailDto> {
  return request('POST', `/api/prospections/${id}/transformer`, { body });
}

export function changerEtapeProspection(id: UUID, body: ChangerEtapeRequest): Promise<ProspectionDetailDto> {
  return request('PATCH', `/api/prospections/${id}/etape`, { body });
}

export function archiverProspection(id: UUID, body: ArchiverProspectionRequest): Promise<ProspectionDetailDto> {
  return request('PATCH', `/api/prospections/${id}/archiver`, { body });
}

export function modifierProspection(id: UUID, body: ModifierProspectionRequest): Promise<ProspectionDetailDto> {
  return request('PATCH', `/api/prospections/${id}`, { body });
}

/** The only endpoint that changes a prospection's tranche/article
 * "principal" — distinct from `addProspectionAutreTranche`, which manages
 * independent secondary interests and never touches `trancheId`/`articleId`.
 * See `ModifierTranchePrincipaleRequest`. */
export function modifierTranchePrincipale(id: UUID, body: ModifierTranchePrincipaleRequest): Promise<ProspectionDetailDto> {
  return request('PATCH', `/api/prospections/${id}/tranche-principale`, { body });
}

export function listInteractions(prospectionId: UUID, pageable?: Pageable): Promise<PageDto<InteractionDto>> {
  return request('GET', `/api/prospections/${prospectionId}/interactions`, { query: withPageable(undefined, pageable) });
}

export function addInteraction(prospectionId: UUID, body: CreerInteractionRequest): Promise<InteractionDto> {
  return request('POST', `/api/prospections/${prospectionId}/interactions`, { body });
}

// --- Prospection sub-collections: villes / types-bien / profils /
// catégories / autres-tranches / devis ---

export function listProspectionVilles(prospectionId: UUID): Promise<ProspectionVilleDto[]> {
  return request('GET', `/api/prospections/${prospectionId}/villes`);
}
export function addProspectionVille(prospectionId: UUID, body: AjouterVilleRequest): Promise<ProspectionVilleDto> {
  return request('POST', `/api/prospections/${prospectionId}/villes`, { body });
}
export function removeProspectionVille(prospectionId: UUID, itemId: UUID): Promise<void> {
  return request('DELETE', `/api/prospections/${prospectionId}/villes/${itemId}`);
}

export function listProspectionTypesBien(prospectionId: UUID): Promise<ProspectionTypeBienDto[]> {
  return request('GET', `/api/prospections/${prospectionId}/types-bien`);
}
export function addProspectionTypeBien(prospectionId: UUID, body: AjouterTypeBienRequest): Promise<ProspectionTypeBienDto> {
  return request('POST', `/api/prospections/${prospectionId}/types-bien`, { body });
}
export function removeProspectionTypeBien(prospectionId: UUID, itemId: UUID): Promise<void> {
  return request('DELETE', `/api/prospections/${prospectionId}/types-bien/${itemId}`);
}

export function listProspectionProfils(prospectionId: UUID): Promise<ProspectionProfilDto[]> {
  return request('GET', `/api/prospections/${prospectionId}/profils`);
}
export function addProspectionProfil(prospectionId: UUID, body: AjouterProfilRequest): Promise<ProspectionProfilDto> {
  return request('POST', `/api/prospections/${prospectionId}/profils`, { body });
}
export function removeProspectionProfil(prospectionId: UUID, itemId: UUID): Promise<void> {
  return request('DELETE', `/api/prospections/${prospectionId}/profils/${itemId}`);
}

export function listProspectionCategories(prospectionId: UUID): Promise<ProspectionCategorieDto[]> {
  return request('GET', `/api/prospections/${prospectionId}/categories`);
}
export function addProspectionCategorie(prospectionId: UUID, body: AjouterCategorieRequest): Promise<ProspectionCategorieDto> {
  return request('POST', `/api/prospections/${prospectionId}/categories`, { body });
}
export function removeProspectionCategorie(prospectionId: UUID, itemId: UUID): Promise<void> {
  return request('DELETE', `/api/prospections/${prospectionId}/categories/${itemId}`);
}

export function listProspectionAutresTranches(prospectionId: UUID): Promise<ProspectionAutreTrancheDto[]> {
  return request('GET', `/api/prospections/${prospectionId}/autres-tranches`);
}
export function addProspectionAutreTranche(prospectionId: UUID, body: AjouterAutreTrancheRequest): Promise<ProspectionAutreTrancheDto> {
  return request('POST', `/api/prospections/${prospectionId}/autres-tranches`, { body });
}
export function removeProspectionAutreTranche(prospectionId: UUID, itemId: UUID): Promise<void> {
  return request('DELETE', `/api/prospections/${prospectionId}/autres-tranches/${itemId}`);
}

export function listDevis(prospectionId: UUID, pageable?: Pageable): Promise<PageDto<DevisDto>> {
  return request('GET', `/api/prospections/${prospectionId}/devis`, { query: withPageable(undefined, pageable) });
}
export function creerDevis(prospectionId: UUID, body: CreerDevisRequest): Promise<DevisDto> {
  return request('POST', `/api/prospections/${prospectionId}/devis`, { body });
}
/** Détail complet d'une offre, y compris le HT/TTC de l'onglet "Montants"
 * (`montants`) — la liste (`listDevis`) renvoie déjà ce détail complet par
 * offre, donc cet endpoint sert surtout à re-fetcher une offre isolément. */
export function getDevisById(prospectionId: UUID, devisId: UUID): Promise<DevisDto> {
  return request('GET', `/api/prospections/${prospectionId}/devis/${devisId}`);
}

/** Filtres pour la liste globale des offres (page `/offres`, tout
 * `Vente > Offres` de l'ancien Omran) — mêmes conventions que
 * `ProspectionFilterParams`/`DossierFilterParams` (liste répétable pour le
 * multi-select `trancheId`, plage `dateDebut`/`dateFin` sur `dateDocument`).
 * Confirmé dans `docs/api-docsV4.json` (`GET /api/devis`) — voir
 * `docs/filtres-avances.md` §Offres. */
export interface DevisFilterParams {
  [key: string]: string | number | boolean | string[] | undefined | null;
  search?: string;
  /** Repeatable — pass several to OR-match any of them. */
  trancheId?: UUID[];
  commercial?: UUID;
  /** ISO-8601 datetime, inclusive lower bound on `dateDocument`. */
  dateDebut?: string;
  /** ISO-8601 datetime, inclusive upper bound on `dateDocument`. */
  dateFin?: string;
}

/** `GET /api/devis` — liste globale, cross-prospections, des offres émises.
 * Réponse `DevisPageDto` : mêmes champs qu'une page standard plus
 * `sommePrixVenteTTCPage` (somme des prix TTC de la page courante
 * uniquement — pas un total plein-filtre, voir le type). */
export function listOffres(params?: DevisFilterParams, pageable?: Pageable): Promise<DevisPageDto> {
  return request('GET', '/api/devis', { query: withPageable(params, pageable) });
}

// ---------------------------------------------------------------------------
// Dossiers
// ---------------------------------------------------------------------------

export type DossierChampDate =
  | 'RESERVATION'
  | 'CONCRETISATION'
  | 'COMPROMIS'
  | 'ENVOI_NOTAIRE'
  | 'CREDIT_DEBLOQUE'
  | 'MINUTE'
  | 'REMISE_DES_CLES'
  | 'FORMALISATION'
  | 'ANNULATION';

export function listDossiers(
  params?: {
    /** Repeatable — pass several to OR-match any of them. */
    statut?: string[];
    commercial?: UUID;
    /** Filters by Entité/Projet (`CfgProject.id`), matched via the dossier's main article. */
    projet?: UUID;
    /** Repeatable — pass several to OR-match dossiers with an article in any of them. */
    trancheId?: UUID[];
    /** Milestone `dateDebut`/`dateFin` applies to. Ignored if neither is set. Default: RESERVATION. */
    champDate?: DossierChampDate;
    /** ISO-8601 datetime, inclusive lower bound on `champDate`. */
    dateDebut?: string;
    /** ISO-8601 datetime, inclusive upper bound on `champDate`. */
    dateFin?: string;
    search?: string;
  },
  pageable?: Pageable,
): Promise<PageDto<DossierListItemDto>> {
  return request('GET', '/api/dossiers', { query: withPageable(params, pageable) });
}

export function getDossier(id: UUID): Promise<DossierDetailDto> {
  return request('GET', `/api/dossiers/${id}`);
}

export function createDossier(body: CreerDossierRequest): Promise<DossierDetailDto> {
  return request('POST', '/api/dossiers', { body });
}

/** Preview step of the dossier creation wizard — computes the same "Schéma
 * de financement" `POST /api/dossiers` would generate, without creating or
 * persisting anything. Call again on every articleIds/prix change. */
export function simulerSchemaFinancement(body: SimulerSchemaFinancementRequest): Promise<SchemaFinancementDto> {
  return request('POST', '/api/dossiers/simulation-financement', { body });
}

export function changerStatutDossier(id: UUID, body: ChangerStatutRequest): Promise<DossierDetailDto> {
  return request('PATCH', `/api/dossiers/${id}/statut`, { body });
}

export function getEtapesSuivantes(id: UUID): Promise<EtapeSuivanteDto[]> {
  return request('GET', `/api/dossiers/${id}/statut/etapes-suivantes`);
}

export function listHistoriqueDossier(id: UUID, pageable?: Pageable): Promise<PageDto<HistoriqueEvenementDto>> {
  return request('GET', `/api/dossiers/${id}/historique`, { query: withPageable(undefined, pageable) });
}

export function getMontantsDossier(id: UUID): Promise<MontantsDossierDto> {
  return request('GET', `/api/dossiers/${id}/montants`);
}

export function listPiecesJointes(dossierId: UUID): Promise<PieceJointeDto[]> {
  return request('GET', `/api/dossiers/${dossierId}/pieces-jointes`);
}

/** Dépôt d'un fichier en `multipart/form-data` — ne peut pas passer par
 * `request()`, qui encode toujours le corps en JSON. Deux endpoints
 * l'utilisent (pièces jointes de dossier, preuves de paiement d'un
 * règlement) ; ils partagent la même convention côté serveur : le fichier
 * est le champ de formulaire `fichier`, tandis que `description` et `typeId`
 * voyagent en **query string**, pas dans le corps. Aucun `Content-Type`
 * n'est posé à la main — le navigateur doit générer la boundary lui-même.
 * Vide le cache GET au succès, comme toute mutation, pour que la liste des
 * pièces jointes se rafraîchisse. */
async function postMultipart<T>(path: string, file: File, query?: Record<string, QueryValue>): Promise<T> {
  const form = new FormData();
  form.set('fichier', file);
  const url = `${API_BASE_URL}${path}${buildQuery(query)}`;
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', body: form, credentials: 'include' });
  } catch {
    throw new ApiError(0, `Impossible de joindre l'API (${API_BASE_URL}). Vérifiez que le backend tourne.`);
  }
  if (!res.ok) {
    signalerSiSessionExpiree(url, res.status);
    const { message, problem } = await readErrorBody(res, `POST ${url} a échoué (${res.status})`);
    throw new ApiError(res.status, message, problem);
  }
  clearApiCache();
  return res.json() as Promise<T>;
}

/** `POST /api/dossiers/{id}/pieces-jointes`. `description` est une légende
 * libre — absente, le backend retombe sur le nom de fichier d'origine.
 * `typeId` (AdmAttachedFileType.PKey, voir `getTypesPieceJointe`) est
 * optionnel — absent = type non renseigné. */
export function uploadPieceJointe(dossierId: UUID, file: File, description?: string, typeId?: UUID): Promise<PieceJointeDto> {
  return postMultipart<PieceJointeDto>(`/api/dossiers/${dossierId}/pieces-jointes`, file, { description, typeId });
}

/** `DELETE /api/dossiers/{id}/pieces-jointes/{pieceId}` — suppression
 * **logique** : la pièce disparaît de `listPiecesJointes` et son `.../fichier`
 * renvoie désormais 404, mais le fichier reste sur le stockage en attendant un
 * balayage hors ligne. Récupérable en base, jamais via l'API — d'où la
 * confirmation exigée côté UI. L'auteur de la suppression est déduit du token,
 * jamais envoyé d'ici. Réponse `204` sans corps ; rejouer le `DELETE` renvoie
 * 404, la pièce n'étant plus visible. */
export function removePieceJointe(dossierId: UUID, pieceId: UUID): Promise<void> {
  return request('DELETE', `/api/dossiers/${dossierId}/pieces-jointes/${pieceId}`);
}

const EXTENSION_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  txt: 'text/plain',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** PieceJointeDto carries no mimeType — the only signal available is the
 * file's extension. Falls back to a generic binary type (forces a download,
 * never renders garbled) when the extension is unknown or absent. */
function mimeForExtension(extension: string | undefined): string {
  const ext = (extension ?? '').replace(/^\./, '').toLowerCase();
  return EXTENSION_MIME[ext] ?? 'application/octet-stream';
}

/** Shared by every `format: byte` file endpoint (pièces jointes, fiche de
 * réservation, …): Spring *could* serialize the byte[] as JSON (base64
 * string or a raw `[137,80,78,...]` number array) instead of real binary —
 * this handles either shape and always returns a proper Blob, tagged with
 * the given MIME type, so a "view" can render inline instead of forcing a
 * download. */
async function fetchByteEndpointBlob(url: string, mime: string, init?: RequestInit): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: 'include', ...init });
  } catch {
    throw new ApiError(0, `Impossible de joindre l'API (${API_BASE_URL}). Vérifiez que le backend tourne.`);
  }
  if (!res.ok) {
    throw new ApiError(res.status, `Téléchargement échoué (${res.status}).`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  let blob: Blob;
  if (contentType.includes('application/json') || contentType.includes('text/plain')) {
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
    if (typeof parsed === 'string') {
      // Base64 (optionally as a data URI) → real bytes.
      const base64 = parsed.includes(',') && parsed.trim().startsWith('data:') ? parsed.split(',', 2)[1] : parsed;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      blob = new Blob([bytes], { type: mime });
    } else if (Array.isArray(parsed)) {
      // Raw byte[] serialized as a JSON number array.
      blob = new Blob([new Uint8Array(parsed as number[])], { type: mime });
    } else {
      blob = new Blob([text], { type: mime });
    }
  } else {
    const raw = await res.blob();
    // Re-tag with the guessed MIME when the server didn't send a useful
    // content-type (e.g. octet-stream/empty) — a Blob's `type` is
    // immutable, so this means constructing a new one from its bytes.
    blob = raw.type && raw.type !== 'application/octet-stream' ? raw : new Blob([raw], { type: mime });
  }

  if (blob.size === 0) {
    throw new ApiError(res.status, "Le fichier renvoyé par l'API est vide.");
  }
  return blob;
}

/** `GET /api/articles/{id}/pieces-jointes` — read-only counterpart of the
 * dossier's pièces jointes: mostly plans (PLAN/PLAN_ARCHITECTE/PLAN_ETAGE),
 * same `PieceJointeDto` shape, but no upload endpoint exists for articles
 * (no `POST` documented) — view/download only. */
export function listArticlePiecesJointes(articleId: UUID): Promise<PieceJointeDto[]> {
  return request('GET', `/api/articles/${articleId}/pieces-jointes`);
}

/** `GET /api/articles/{id}/pieces-jointes/{pieceId}/fichier` — plan ou autre
 * pièce de l'article. Redirection `302` vers le stockage, cf.
 * {@link openStoredFileInTab}. */
export function openArticlePieceJointeFichier(articleId: UUID, pieceId: UUID): void {
  openStoredFileInTab(`${API_BASE_URL}/api/articles/${articleId}/pieces-jointes/${pieceId}/fichier`);
}

/** Shared by the dossier's generated-document endpoints that offer both
 * `pdf`/`docx` (`/documents/fiche-reservation`, `/documents/acte-reservation`)
 * — same `format: byte` shape, just a different document kind in the path. */
function fetchDossierDocumentBlob(dossierId: UUID, docKind: 'fiche-reservation' | 'acte-reservation', format: 'pdf' | 'docx'): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/${dossierId}/documents/${docKind}?format=${format}`;
  return fetchByteEndpointBlob(url, mimeForExtension(format));
}

/** Shared by the dossier's generated-document endpoints that are PDF-only —
 * no `format` query param exists on these, unlike `fetchDossierDocumentBlob`
 * above (see e.g. Fiche Bancaire's "pas de variante Word pour ce document"). */
export type DossierPdfOnlyDocKind = 'fiche-visite-technique' | 'fiche-dossier-vente' | 'fiche-bancaire' | 'fiche-trop-percu';
function fetchDossierPdfOnlyDocumentBlob(dossierId: UUID, docKind: DossierPdfOnlyDocKind): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/${dossierId}/documents/${docKind}`;
  return fetchByteEndpointBlob(url, mimeForExtension('pdf'));
}

/** `GET /api/dossiers/{id}/reglements/{reglementId}/documents/recu` — the
 * "Reçu de règlement" ("ATTESTATION DE RÉCEPTION CHEQUE") for one specific
 * règlement, not the whole dossier — unlike `DossierPdfOnlyDocKind` above,
 * this needs a second id in the path, so it gets its own fetch helper
 * rather than being folded into that union. PDF-only. */
function fetchRecuReglementBlob(dossierId: UUID, reglementId: UUID): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/${dossierId}/reglements/${reglementId}/documents/recu`;
  return fetchByteEndpointBlob(url, mimeForExtension('pdf'));
}

/** `GET /api/dossiers/{id}/reglements/{reglementId}/documents/autorisation-versement`
 * — the "Autorisation d'Encaissement" for one specific règlement
 * (`StlSettlement.PKey`), authorizing the client's bank to release that
 * règlement's amount. Scoped to the règlement, *not* the échéance: the
 * fields that give the document its value (compte destinataire, mode de
 * versement, tiers payeur) are populated on the règlement in real data and
 * almost never on the échéance. Same per-row-id shape as
 * `fetchRecuReglementBlob` above. PDF-only. */
function fetchAutorisationVersementBlob(dossierId: UUID, reglementId: UUID): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/${dossierId}/reglements/${reglementId}/documents/autorisation-versement`;
  return fetchByteEndpointBlob(url, mimeForExtension('pdf'));
}

/** Shared by the prospection's generated-document endpoints
 * (`/documents/nda`, `/documents/fiche`) — PDF-only, prospection-scoped
 * (no devisId in the path, unlike the offer document). */
export type ProspectionPdfDocKind = 'nda' | 'fiche';
function fetchProspectionDocumentBlob(prospectionId: UUID, docKind: ProspectionPdfDocKind): Promise<Blob> {
  const url = `${API_BASE_URL}/api/prospections/${prospectionId}/documents/${docKind}`;
  return fetchByteEndpointBlob(url, mimeForExtension('pdf'));
}

/** `/api/prospections/{id}/devis/{devisId}/document` — the "Fiche Offre
 * vente" PDF, reproducing the legacy Offre form exactly (entête, onglet
 * "Montants" HT/TTC, tableau des sous-articles). PDF-only, unlike the
 * dossier documents which also offer `docx`. */
function fetchDevisDocumentBlob(prospectionId: UUID, devisId: UUID): Promise<Blob> {
  const url = `${API_BASE_URL}/api/prospections/${prospectionId}/devis/${devisId}/document`;
  return fetchByteEndpointBlob(url, mimeForExtension('pdf'));
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately after click() races the browser's actual save
  // against the URL being invalidated — a known cause of 0-byte downloads
  // (the save hasn't finished reading the blob yet). Give it a beat.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

/** Opens a blob inline in a new tab (PDF/image/text render directly;
 * anything else the browser doesn't know how to display just downloads —
 * normal browser behaviour, not something to special-case here).
 *
 * `win` must be opened synchronously by the caller, *before* the async
 * fetch that produces the blob, so it stays tied to the click's
 * user-gesture and isn't blocked as a popup. */
function showBlobInTab(win: Window | null, blob: Blob): void {
  if (!win) {
    throw new ApiError(0, "Le navigateur a bloqué l'ouverture d'un nouvel onglet.");
  }
  const objectUrl = URL.createObjectURL(blob);
  win.location.href = objectUrl;
  // Left un-revoked deliberately — the viewer tab keeps reading from this
  // URL for as long as it's open; revoking on a timer would risk cutting
  // off a still-open preview.
}

/** Ouvre un fichier stocké sur S3/MinIO. Les endpoints `.../fichier` des
 * pièces jointes ne renvoient pas de binaire : ils répondent `302` vers une
 * URL présignée, valable quelques minutes (cf. `docs/api-docsV4.json`).
 *
 * On ne peut donc pas les `fetch` comme les documents générés : la
 * redirection conserve `credentials: 'include'`, or ni S3 ni MinIO ne renvoie
 * `Access-Control-Allow-Credentials`, et le CORS rejette la réponse. Une
 * navigation, elle, n'est pas soumise au CORS et envoie quand même le cookie
 * JWT (même site — seul le port diffère). D'où l'ouverture d'un onglet.
 *
 * Conséquence assumée : « Voir » et « Télécharger » déclenchent la même
 * navigation. C'est le `Content-Disposition` du stockage qui décide de
 * l'affichage ou de l'enregistrement, et aucun paramètre `download` n'existe
 * côté API pour l'influencer. Le nom du fichier vient lui aussi du stockage,
 * qui reprend la description de la pièce.
 *
 * L'onglet est ouvert de façon synchrone, sans `await` en amont, pour rester
 * rattaché au geste utilisateur et ne pas être bloqué comme popup. */
function openStoredFileInTab(url: string): void {
  const win = window.open('', '_blank');
  if (!win) {
    throw new ApiError(0, "Le navigateur a bloqué l'ouverture d'un nouvel onglet.");
  }
  win.location.href = url;
}

/** `GET /api/dossiers/{id}/pieces-jointes/{pieceId}/fichier` — redirection
 * `302` vers le stockage, cf. {@link openStoredFileInTab}. */
export function openPieceJointeFichier(dossierId: UUID, pieceId: UUID): void {
  openStoredFileInTab(`${API_BASE_URL}/api/dossiers/${dossierId}/pieces-jointes/${pieceId}/fichier`);
}

export async function downloadFicheReservation(dossierId: UUID, filename: string, format: 'pdf' | 'docx' = 'pdf'): Promise<void> {
  const blob = await fetchDossierDocumentBlob(dossierId, 'fiche-reservation', format);
  triggerBlobDownload(blob, filename);
}

export async function viewFicheReservation(dossierId: UUID, format: 'pdf' | 'docx' = 'pdf'): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const blob = await fetchDossierDocumentBlob(dossierId, 'fiche-reservation', format);
    showBlobInTab(win, blob);
  } catch (err) {
    win?.close();
    throw err;
  }
}

export async function downloadActeReservation(dossierId: UUID, filename: string, format: 'pdf' | 'docx' = 'pdf'): Promise<void> {
  const blob = await fetchDossierDocumentBlob(dossierId, 'acte-reservation', format);
  triggerBlobDownload(blob, filename);
}

export async function viewActeReservation(dossierId: UUID, format: 'pdf' | 'docx' = 'pdf'): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const blob = await fetchDossierDocumentBlob(dossierId, 'acte-reservation', format);
    showBlobInTab(win, blob);
  } catch (err) {
    win?.close();
    throw err;
  }
}

export async function downloadDevisDocument(prospectionId: UUID, devisId: UUID, filename: string): Promise<void> {
  const blob = await fetchDevisDocumentBlob(prospectionId, devisId);
  triggerBlobDownload(blob, filename);
}

export async function viewDevisDocument(prospectionId: UUID, devisId: UUID): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const blob = await fetchDevisDocumentBlob(prospectionId, devisId);
    showBlobInTab(win, blob);
  } catch (err) {
    win?.close();
    throw err;
  }
}

export async function downloadDossierPdfOnlyDocument(dossierId: UUID, docKind: DossierPdfOnlyDocKind, filename: string): Promise<void> {
  const blob = await fetchDossierPdfOnlyDocumentBlob(dossierId, docKind);
  triggerBlobDownload(blob, filename);
}

export async function viewDossierPdfOnlyDocument(dossierId: UUID, docKind: DossierPdfOnlyDocKind): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const blob = await fetchDossierPdfOnlyDocumentBlob(dossierId, docKind);
    showBlobInTab(win, blob);
  } catch (err) {
    win?.close();
    throw err;
  }
}

/** `POST /api/dossiers/documents/{kind}` — batch counterpart of the 6
 * single-dossier generated documents above: one concatenated PDF covering
 * every id in `dossierIds`, in order. Always PDF-only, even for the two
 * kinds (`fiche-reservation`/`acte-reservation`) that offer a Word variant
 * in single mode — no batch docx exists. Used by `DossiersList.tsx`'s
 * multi-select "Générer un document" toolbar. */
export type DossierBatchDocKind = 'fiche-reservation' | 'acte-reservation' | DossierPdfOnlyDocKind;

export const DOSSIER_BATCH_DOC_LABELS: Record<DossierBatchDocKind, string> = {
  'fiche-reservation': 'Fiche de réservation',
  'acte-reservation': 'Acte de réservation',
  'fiche-visite-technique': 'Fiche visite technique',
  'fiche-dossier-vente': 'Fiche dossier de vente',
  'fiche-bancaire': 'Fiche bancaire',
  'fiche-trop-percu': 'Fiche trop perçu',
};

function fetchDossiersDocumentsEnLotBlob(kind: DossierBatchDocKind, dossierIds: UUID[]): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/documents/${kind}`;
  return fetchByteEndpointBlob(url, mimeForExtension('pdf'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dossierIds }),
  });
}

export async function downloadDossiersDocumentsEnLot(kind: DossierBatchDocKind, dossierIds: UUID[], filename: string): Promise<void> {
  const blob = await fetchDossiersDocumentsEnLotBlob(kind, dossierIds);
  triggerBlobDownload(blob, filename);
}

export async function viewDossiersDocumentsEnLot(kind: DossierBatchDocKind, dossierIds: UUID[]): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const blob = await fetchDossiersDocumentsEnLotBlob(kind, dossierIds);
    showBlobInTab(win, blob);
  } catch (err) {
    win?.close();
    throw err;
  }
}

export async function downloadRecuReglement(dossierId: UUID, reglementId: UUID, filename: string): Promise<void> {
  const blob = await fetchRecuReglementBlob(dossierId, reglementId);
  triggerBlobDownload(blob, filename);
}

export async function viewRecuReglement(dossierId: UUID, reglementId: UUID): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const blob = await fetchRecuReglementBlob(dossierId, reglementId);
    showBlobInTab(win, blob);
  } catch (err) {
    win?.close();
    throw err;
  }
}

export async function downloadAutorisationVersement(dossierId: UUID, reglementId: UUID, filename: string): Promise<void> {
  const blob = await fetchAutorisationVersementBlob(dossierId, reglementId);
  triggerBlobDownload(blob, filename);
}

export async function viewAutorisationVersement(dossierId: UUID, reglementId: UUID): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const blob = await fetchAutorisationVersementBlob(dossierId, reglementId);
    showBlobInTab(win, blob);
  } catch (err) {
    win?.close();
    throw err;
  }
}

export async function downloadProspectionDocument(prospectionId: UUID, docKind: ProspectionPdfDocKind, filename: string): Promise<void> {
  const blob = await fetchProspectionDocumentBlob(prospectionId, docKind);
  triggerBlobDownload(blob, filename);
}

export async function viewProspectionDocument(prospectionId: UUID, docKind: ProspectionPdfDocKind): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const blob = await fetchProspectionDocumentBlob(prospectionId, docKind);
    showBlobInTab(win, blob);
  } catch (err) {
    win?.close();
    throw err;
  }
}

export function listEcheances(dossierId: UUID, pageable?: Pageable): Promise<PageDto<EcheanceDto>> {
  return request('GET', `/api/dossiers/${dossierId}/echeancier`, { query: withPageable(undefined, pageable) });
}

export function addEcheance(dossierId: UUID, body: CreerEcheanceRequest): Promise<EcheanceDto> {
  return request('POST', `/api/dossiers/${dossierId}/echeancier`, { body });
}

export function updateEcheance(dossierId: UUID, echeanceId: UUID, body: ModifierEcheanceRequest): Promise<EcheanceDto> {
  return request('PATCH', `/api/dossiers/${dossierId}/echeancier/${echeanceId}`, { body });
}

export function addReglement(dossierId: UUID, echeanceId: UUID, body: CreerReglementRequest): Promise<ReglementDto> {
  return request('POST', `/api/dossiers/${dossierId}/echeancier/${echeanceId}/reglements`, { body });
}

/** Historique complet des règlements d'une échéance (type/banque/payeur/
 * référence par ligne) — contrepartie en lecture de `addReglement`, derrière
 * le seul total `montantRegle`/`reste` que `listEcheances` renvoie. Pas
 * paginé côté API (tableau simple). */
export function listEcheanceReglements(dossierId: UUID, echeanceId: UUID): Promise<ReglementDto[]> {
  return request('GET', `/api/dossiers/${dossierId}/echeancier/${echeanceId}/reglements`);
}

/** `GET /api/dossiers/{id}/payeurs` — candidats du champ « Réglé par »
 * (`CreerReglementRequest.payeurId`, obligatoire) : acquéreur principal du
 * dossier puis co-acquéreurs. Liste vide si le dossier n'a aucun acquéreur
 * rattaché — auquel cas aucun règlement n'est saisissable. Noter que la
 * liste est indicative et non fermée côté serveur (un tiers payeur est
 * accepté) ; faute de recherche de tiers dans cette app, c'est néanmoins la
 * seule source de l'UI. */
export function listPayeurs(dossierId: UUID): Promise<PayeurDto[]> {
  return request('GET', `/api/dossiers/${dossierId}/payeurs`);
}

/** `GET .../reglements/{reglementId}/pieces-jointes` — les preuves de
 * paiement d'un règlement (chèques scannés, avis de virement, reçus), plus
 * récente d'abord. Leur présence est ce qui autorise le passage à `POINTED`. */
export function listReglementPiecesJointes(dossierId: UUID, reglementId: UUID): Promise<PieceJointeDto[]> {
  return request('GET', `/api/dossiers/${dossierId}/reglements/${reglementId}/pieces-jointes`);
}

/** `POST .../reglements/{reglementId}/pieces-jointes` — dépose un justificatif
 * d'encaissement. `typeId` est facultatif et laissé vide en pratique : les
 * preuves de paiement réelles n'en portent aucune. `creePar` est déduit du
 * token côté serveur, jamais envoyé d'ici. */
export function uploadReglementPieceJointe(
  dossierId: UUID,
  reglementId: UUID,
  file: File,
  description?: string,
  typeId?: UUID,
): Promise<PieceJointeDto> {
  return postMultipart<PieceJointeDto>(
    `/api/dossiers/${dossierId}/reglements/${reglementId}/pieces-jointes`,
    file,
    { description, typeId },
  );
}

/** `GET .../reglements/{reglementId}/pieces-jointes/{pieceId}/fichier` — la
 * preuve de paiement. Redirection `302` vers le stockage, cf.
 * {@link openStoredFileInTab}. */
export function openReglementPieceJointeFichier(dossierId: UUID, reglementId: UUID, pieceId: UUID): void {
  openStoredFileInTab(
    `${API_BASE_URL}/api/dossiers/${dossierId}/reglements/${reglementId}/pieces-jointes/${pieceId}/fichier`,
  );
}

/** `DELETE .../reglements/{reglementId}/pieces-jointes/{pieceId}` — retire un
 * justificatif d'encaissement. Mêmes effets que {@link removePieceJointe}
 * (suppression logique, `204` sans corps), **plus une règle propre au
 * règlement** : un règlement `POINTED` ne peut pas perdre sa *dernière* preuve
 * (409). C'est elle qui a autorisé le pointage ; un règlement pointé sans
 * justificatif serait un trou d'audit. Supprimer une pièce parmi plusieurs, ou
 * n'importe quelle pièce d'un règlement `IN_WORK`/`CANCELED`, passe
 * normalement. Pour remplacer l'unique preuve d'un règlement pointé : déposer
 * la nouvelle d'abord, supprimer l'ancienne ensuite. */
export function removeReglementPieceJointe(dossierId: UUID, reglementId: UUID, pieceId: UUID): Promise<void> {
  return request('DELETE', `/api/dossiers/${dossierId}/reglements/${reglementId}/pieces-jointes/${pieceId}`);
}

/** `PATCH .../reglements/{reglementId}/statut` — pointage (`POINTED`) ou
 * annulation (`CANCELED`) depuis `IN_WORK`. Les deux cibles sont terminales :
 * repartir de l'une d'elles renvoie 409, avec `transitionsAutorisees` dans le
 * corps ProblemDetail (lisible via `ApiError.problem`). Pointer sans aucune
 * pièce jointe renvoie également 409. */
export function modifierStatutReglement(
  dossierId: UUID,
  reglementId: UUID,
  body: ModifierStatutReglementRequest,
): Promise<ReglementDto> {
  return request('PATCH', `/api/dossiers/${dossierId}/reglements/${reglementId}/statut`, { body });
}

// ---------------------------------------------------------------------------
// Encaissements — catalogue transverse des règlements de Dossiers de vente
// (reprend l'écran legacy Vente > Encaissements Vente), tous dossiers
// confondus. Distinct de listEcheanceReglements (scopé à une échéance).
// ---------------------------------------------------------------------------

export type EncaissementChampDate = 'DATE_PIECE' | 'DATE_ECHEANCE' | 'DATE_REGLEMENT';

/** `GET /api/encaissements/{id}` — pas encore livré côté backend (demandé,
 * voir instructions/from_front.md #3) ; câblé dès maintenant comme tout
 * autre écran de détail de l'app (`getDossier`, `getProspection`…) plutôt
 * que de faire naviguer `/encaissements/:id` sans vrai fetch. 404 tant que
 * l'endpoint n'existe pas — EncaissementDetail.tsx affiche l'erreur telle
 * quelle jusque-là. */
export function getEncaissement(id: UUID): Promise<EncaissementDto> {
  return request('GET', `/api/encaissements/${id}`);
}

export function listEncaissements(
  params?: {
    entiteId?: UUID[];
    typeId?: UUID[];
    /** IN_WORK/POINTED/CANCELED confirmés — voir EncaissementEtat. */
    etat?: string[];
    compteId?: UUID;
    depotId?: UUID;
    dossierId?: UUID;
    tierId?: UUID;
    reference?: string;
    search?: string;
    comptabilise?: boolean;
    montantDe?: number;
    montantA?: number;
    /** Jalon sur lequel s'appliquent dateDebut/dateFin — ignoré si les deux
     * sont absents. Défaut serveur : DATE_PIECE. */
    champDate?: EncaissementChampDate;
    dateDebut?: string;
    dateFin?: string;
  },
  pageable?: Pageable,
): Promise<PageDto<EncaissementDto>> {
  return request('GET', '/api/encaissements', { query: withPageable(params, pageable) });
}

export const getEntitesReferentiel = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/entites');
export const getComptesReferentiel = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/comptes');
export const getDepotsReferentiel = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/depots');
/** `StkKind` — instructions/from_front.md #4, alimente le filtre `natureId`
 * de `GET /api/articles`/`GET /api/tranches/{id}/articles`. */
export const getNatures = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/natures');
/** `StkFloor` — instructions/from_front.md #4, alimente le filtre `etageId`
 * de `GET /api/articles`/`GET /api/tranches/{id}/articles`. */
export const getEtages = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/etages');

// ---------------------------------------------------------------------------
// Tranches / Projets / Articles
// ---------------------------------------------------------------------------

export function getTranche(id: UUID): Promise<TrancheDetailDto> {
  return request('GET', `/api/tranches/${id}`);
}

/** Filtres de parité avec la grille legacy "Articles" (instructions/from_front.md
 * #4), partagés par `listArticles`/`listTrancheArticles` — bornes `prixDe`/
 * `prixA` sur `comSalePrice`, `surfaceDe`/`surfaceA` sur `area`, toutes
 * inclusives et indépendamment optionnelles. */
export type ArticleListFilters = {
  entiteId?: UUID;
  natureId?: UUID;
  vocationId?: UUID;
  etageId?: UUID;
  prixDe?: number;
  prixA?: number;
  surfaceDe?: number;
  surfaceA?: number;
};

/** Catalogue transverse — toutes tranches confondues, restreint aux entités
 * juridiques actives (ADMOD/GHRIZA) côté serveur. Contrairement à
 * `listTrancheArticles`, `statut` absent renvoie DISPONIBLE **et** OCCUPE
 * (vraie vue "tout le patrimoine"), pas juste DISPONIBLE. */
export function listArticles(
  params?: { search?: string; trancheId?: UUID[]; statut?: ArticleStatut; categorieId?: UUID[]; typeId?: UUID[] } & ArticleListFilters,
  pageable?: Pageable,
): Promise<PageDto<ArticleListItemDto>> {
  return request('GET', '/api/articles', { query: withPageable(params, pageable) });
}

export function listTrancheArticles(
  trancheId: UUID,
  params?: { statut?: ArticleStatut; categorieId?: UUID[]; typeId?: UUID[] } & ArticleListFilters,
  pageable?: Pageable,
): Promise<PageDto<ArticleListItemDto>> {
  return request('GET', `/api/tranches/${trancheId}/articles`, { query: withPageable(params, pageable) });
}

export function listProjets(pageable?: Pageable): Promise<PageDto<ProjetListItemDto>> {
  return request('GET', '/api/projets', { query: withPageable(undefined, pageable) });
}

export function getProjet(id: UUID): Promise<ProjetDetailDto> {
  return request('GET', `/api/projets/${id}`);
}

export function listProjetTranches(projetId: UUID, pageable?: Pageable): Promise<PageDto<TrancheListItemDto>> {
  return request('GET', `/api/projets/${projetId}/tranches`, { query: withPageable(undefined, pageable) });
}

/** Flat tranches listing (optionally scoped to one Entité/Projet) — added
 * alongside the `trancheId` filter on `/api/dossiers` so callers no longer
 * need the `listProjets` + `listProjetTranches` N+1 aggregate (still used by
 * `TranchesList.tsx`'s full-portfolio view, which has other needs). */
export function listTranches(params?: { projetId?: UUID }, pageable?: Pageable): Promise<PageDto<TrancheListItemDto>> {
  return request('GET', '/api/tranches', { query: withPageable(params, pageable) });
}

export function getArticle(id: UUID): Promise<ArticleDetailDto> {
  return request('GET', `/api/articles/${id}`);
}

/** Dropdown "Projet" — first link of the cascade Projet → Tranche → Article
 * → Sous-article, to narrow the Tranche dropdown below it. */
export function getProjetsReferentiel(): Promise<ReferentielItemDto[]> {
  return request('GET', '/api/referentiels/projets');
}

/** Dropdown "Tranche" — all tranches, or only those of `projetId` if given
 * (second link of the cascade). Unpaginated, meant to populate a `<select>`
 * directly (unlike `listTranches`, which is paginated). */
export function getTranchesReferentiel(projetId?: UUID): Promise<ReferentielItemDto[]> {
  return request('GET', '/api/referentiels/tranches', { query: { projetId } });
}

/** Filters shared by `getArticlesReferentiel`/`getSousArticlesReferentiel` —
 * `categorieId`/`typeId` mirror the legacy "Catégorie"/"Type" checkbox
 * cascade (repeatable, OR'd server-side); absent = no restriction. */
export interface ArticleReferentielFilters {
  statut?: ArticleStatut;
  categorieId?: UUID[];
  typeId?: UUID[];
}

/** Root articles (hors sous-articles) of a tranche, filtered by availability
 * (default DISPONIBLE) and optionally by catégorie/type — reproduces the
 * legacy qualification form's checkbox cascade before picking the article
 * itself from the resulting filtered list (not a dropdown of every article).
 * Each entry already carries its catégorie/type libellés and code/description
 * for display without a separate call. Last link of the cascade Projet →
 * Tranche → Article before optionally picking a sous-article. */
export function getArticlesReferentiel(trancheId: UUID, filters?: ArticleReferentielFilters): Promise<ArticleListItemDto[]> {
  return request('GET', '/api/referentiels/articles', { query: { trancheId, ...filters } });
}

/** Sous-articles of an article (e.g. a parking spot or cave attached to a
 * lot), same availability/catégorie/type filtering as `getArticlesReferentiel`. */
export function getSousArticlesReferentiel(articleId: UUID, filters?: ArticleReferentielFilters): Promise<ArticleListItemDto[]> {
  return request('GET', '/api/referentiels/sous-articles', { query: { articleId, ...filters } });
}

// ---------------------------------------------------------------------------
// Dashboard / Commerciaux
// ---------------------------------------------------------------------------

export function getDashboard(): Promise<DashboardDto> {
  return request('GET', '/api/dashboard');
}

export function listCommerciaux(pageable?: Pageable): Promise<PageDto<CommercialListItemDto>> {
  return request('GET', '/api/commerciaux', { query: withPageable(undefined, pageable) });
}

// ---------------------------------------------------------------------------
// Hotline — recherche par numéro de téléphone (V4). Ne renvoie jamais 404 :
// même un numéro inconnu répond 200 avec `connu: false` et des listes vides.
// ---------------------------------------------------------------------------

/** Critère de recherche hotline. **Exactement un des deux** : le serveur
 * répond 400 si les deux sont fournis, comme s'il n'y en a aucun. Le type en
 * union plutôt qu'un objet à deux champs optionnels rend cette exclusivité
 * impossible à violer depuis l'appelant. */
export type CritereHotline = { telephone: string } | { nom: string };

/** `GET /api/hotline/recherche` — tout ce que le système sait d'un appelant,
 * en une requête.
 *
 * Par téléphone : espaces, tirets, parenthèses et indicatif sont ignorés, et
 * la recherche n'est pas plafonnée. Par nom : sous-chaîne insensible à la
 * casse et aux accents, **2 caractères minimum** (400 en deçà) et **plafond de
 * 20 fiches** — au-delà, `tronque` vaut true et doit être montré à l'agent.
 *
 * Ne renvoie jamais 404 : un critère sans correspondance répond 200 avec
 * `connu: false` et des listes vides. */
export function rechercherHotline(critere: CritereHotline): Promise<HotlineResultDto> {
  return request('GET', '/api/hotline/recherche', { query: { ...critere } });
}

// ---------------------------------------------------------------------------
// Calendrier — rendez-vous/visites planifiés (V4). debut/fin doivent être
// des date-time ISO (voir toApiDateTime dans lib/format.ts) ; l'API répond
// aussi en 400 avec un tableau vide si fin < debut.
// ---------------------------------------------------------------------------

export function getEvenementsCalendrier(debut: string, fin: string): Promise<EvenementCalendrierDto[]> {
  return request('GET', '/api/calendrier/evenements', { query: { debut, fin } });
}

// ---------------------------------------------------------------------------
// Référentiels — lookup tables backing every UUID picker in the app. Most
// are plain unpaginated lists; getVilles is the one paginated + searchable
// exception (real cities table, potentially large).
// ---------------------------------------------------------------------------

export const getVocations = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/vocations');
export const getTypesResidence = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/types-residence');
export const getTypesRelationContact = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/types-relation-contact');
export const getTypesPieceIdentite = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/types-piece-identite');
export const getTypesPieceJointe = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/types-piece-jointe');
export const getTypesContactProspection = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/types-contact-prospection');
export const getTypesBienReferentiel = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/types-bien');
export const getTitres = (): Promise<TitreDto[]> => request('GET', '/api/referentiels/titres');
export const getTierTypes = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/tier-types');
export const getTierKindsForType = (typeId: UUID): Promise<ReferentielItemDto[]> =>
  request('GET', `/api/referentiels/tier-types/${typeId}/kinds`);
export const getSituationsFamiliales = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/situations-familiales');
export const getSexes = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/sexes');
export const getSalaires = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/salaires');
export const getRegimesMatrimoniaux = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/regimes-matrimoniaux');
export const getRaisonsCloture = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/raisons-cloture');
// Rôles applicatifs (AdmRole) assignables à un compte — alimente les cases à
// cocher "Rôles" de POST /api/utilisateurs (voir NouvelUtilisateur.tsx). Le
// `code` (pas l'id) est ce que CreerEmployeRequest.roles attend.
export const getRoles = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/roles');
// Types d'employé (CfgTierKind, pré-filtrés sur CfgTierType "EMP") — alimente
// le champ "Type d'employé" de POST /api/utilisateurs. Le `code` est ce que
// CreerEmployeRequest.typeEmployeCode attend.
export const getTypesEmploye = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/types-employe');
export const getProfilsProspection = (): Promise<ProfilCategorieDto[]> => request('GET', '/api/referentiels/profils-prospection');
export const getProfessions = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/professions');
export const getPays = (): Promise<PaysDto[]> => request('GET', '/api/referentiels/pays');
export const getOriginesProspection = (): Promise<OrigineProspectionDto[]> => request('GET', '/api/referentiels/origines-prospection');
export const getSupportsForOrigine = (origineId: UUID): Promise<ReferentielItemDto[]> =>
  request('GET', `/api/referentiels/origines-prospection/${origineId}/supports`);
export const getNationalites = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/nationalites');
export const getEtapesProspection = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/etapes-prospection');
export const getCategoriesBien = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/categories-bien');
export const getCategoriesEcheance = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/categories-echeance');
export const getActionsCommerciales = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/actions-commerciales');
export const getModesPaiement = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/modes-paiement');
// Distinct de modes-paiement (StlSettlementType, pas ComPaymentMethod) —
// alimente le Select `typeId` de "Ajouter un règlement" (AddReglementRow).
export const getTypesReglement = (): Promise<TypeReglementDto[]> => request('GET', '/api/referentiels/types-reglement');
// Alimente le Select `banqueId`, affiché seulement quand le type de
// règlement choisi a banqueObligatoire === true.
export const getBanques = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/banques');
// Dropdown "Résultat" de la boîte de dialogue Action — chaque entrée indique
// via necessiteDateRdv/alerteRecommandee comment adapter InteractionForm.
export const getResultatsInteraction = (): Promise<ResultatInteractionDto[]> => request('GET', '/api/referentiels/resultats-interaction');

export function getVillesReferentiel(
  params?: { paysId?: UUID; search?: string },
  pageable?: Pageable,
): Promise<PageDto<VilleDto>> {
  return request('GET', '/api/referentiels/villes', { query: withPageable(params, pageable) });
}

// ---------------------------------------------------------------------------
// Authentification / Mon compte (V4) — connexion pose un cookie JWT httpOnly
// `access_token` (jamais lu ni manipulé côté front, juste transporté par
// `credentials: 'include'` sur chaque requête, voir plus haut). Tant que
// mustChangePassword/!profileCompleted, tout le reste de l'API répond 403 —
// c'est AuthProvider (lib/auth.tsx) qui applique ce garde-fou côté UI.
// ---------------------------------------------------------------------------

export function connexion(body: ConnexionRequest): Promise<UtilisateurCourantDto> {
  return request('POST', '/api/auth/connexion', { body });
}

export function deconnexion(): Promise<void> {
  return request('POST', '/api/auth/deconnexion');
}

export function getMonCompte(): Promise<UtilisateurCourantDto> {
  return request('GET', '/api/mon-compte');
}

export function changerMotDePasse(body: ChangerMotDePasseRequest): Promise<UtilisateurCourantDto> {
  return request('POST', '/api/mon-compte/changer-mot-de-passe', { body });
}

export function completerProfil(body: CompleterProfilRequest): Promise<UtilisateurCourantDto> {
  return request('PATCH', '/api/mon-compte/profil', { body });
}

/** Réservé au rôle Administrateur — annuaire des comptes (AdmUser) avec
 * fiche employé et rôles. `search` filtre sur identifiant/description/email
 * (sous-chaîne, insensible à la casse) ; `disabled` sur le statut
 * activé/désactivé (absent = tous les comptes). Seuls filtres exposés par
 * l'API — pas de filtre par rôle ou type d'employé côté serveur. */
export function listUtilisateurs(
  params?: { search?: string; disabled?: boolean },
  pageable?: Pageable,
): Promise<PageDto<UtilisateurListItemDto>> {
  return request('GET', '/api/utilisateurs', { query: withPageable(params, pageable) });
}

/** Réservé au rôle Administrateur — génère un mot de passe temporaire à
 * communiquer hors-bande, jamais renvoyé une seconde fois. */
export function reinitialiserMotDePasse(admUserId: UUID): Promise<ReinitialiserMotDePasseResponse> {
  return request('POST', `/api/utilisateurs/${admUserId}/reinitialiser-mot-de-passe`);
}

/** Réservé au rôle Administrateur — crée en une fois la fiche employé
 * (CfgTier), le compte de connexion (AdmUser) et ses rôles ; le mot de passe
 * temporaire renvoyé n'est jamais réémis, à communiquer hors-bande. */
export function creerEmploye(body: CreerEmployeRequest): Promise<CreerEmployeResponse> {
  return request('POST', '/api/utilisateurs', { body });
}

/** Réservé au rôle Administrateur — projets actuellement affectés à ce
 * compte (périmètre commercial brut, pas le périmètre effectif : un compte
 * exempté — Administrateur, Direction Générale — peut avoir une liste non
 * vide sans être filtré). 404 si l'AdmUser n'existe pas. */
export function getProjetsUtilisateur(admUserId: UUID): Promise<ProjetPerimetreDto[]> {
  return request('GET', `/api/utilisateurs/${admUserId}/projets`);
}

/** Réservé au rôle Administrateur — remplacement intégral du périmètre
 * projet de ce compte (état final des cases à cocher, pas un delta). Une
 * liste vide retire toute restriction ; le backend 400 sur un corps sans
 * `projetIds` (absent/null), donc `projetIds` doit toujours être un tableau
 * explicite ici — jamais `undefined`. Les lignes d'habilitation société/
 * tranche/projet-travaux préexistantes de l'utilisateur sont préservées
 * côté serveur (voir FEATURE-perimetre-commercial.md §9bis.4). 400 si un
 * `projetId` est inconnu, 404 si l'AdmUser n'existe pas. */
export function remplacerProjetsUtilisateur(admUserId: UUID, projetIds: UUID[]): Promise<ProjetPerimetreDto[]> {
  const body: AffecterProjetsRequest = { projetIds };
  return request('PUT', `/api/utilisateurs/${admUserId}/projets`, { body });
}

// ---------------------------------------------------------------------------
// KPI commerciaux — indicateurs de performance sur une période.
//
// `du`/`au` sont des dates **nues** (`YYYY-MM-DD`, format: date dans la spec),
// pas des date-time. Ne PAS leur appliquer le gabarit `T00:00:00`/`T23:59:59`
// des listes (ProspectionsList, EncaissementsList) : ces endpoints-là filtrent
// sur des colonnes date-time, ceux-ci non, et une valeur suffixée repart en 400
// « date non parsable ». La valeur d’un <input type="date"> passe telle quelle.
//
// Les deux paramètres sont optionnels ; omis, le serveur retient les 30 derniers
// jours, `au` inclus jusqu’à 23:59:59.
// ---------------------------------------------------------------------------

/** `GET /api/kpi/commerciaux` — classement des commerciaux sur la période, les
 * plus performants d’abord (dossiers créés décroissant, puis appels passés).
 * **403 hors rôle `Administrateur`.**
 *
 * Seuls les commerciaux ayant au moins une ligne sur la période apparaissent :
 * ne jamais présenter cette liste comme l’effectif complet de
 * `GET /api/commerciaux` (60 des 75 comptes réels sont désactivés). Un tableau
 * vide est une réponse normale, pas une erreur. 400 si `du` est postérieure à
 * `au` ou si une date n’est pas parsable. */
export function listPerformancesCommerciaux(params?: { du?: string; au?: string }): Promise<PerformanceCommercialDto[]> {
  return request('GET', '/api/kpi/commerciaux', { query: { du: params?.du, au: params?.au } });
}

/** `GET /api/kpi/commerciaux/moi` — les indicateurs du commercial rattaché au
 * compte connecté.
 *
 * **200 avec tous les compteurs à zéro** quand rien n’a été fait sur la période
 * — ce n’est pas une erreur et cela ne doit pas s’afficher comme un état vide.
 * Le **404 est réservé** au compte non rattaché à un employé : il n’y a alors
 * aucun commercial dont parler, ce qui mérite son propre message. */
export function getMesPerformances(params?: { du?: string; au?: string }): Promise<PerformanceCommercialDto> {
  return request('GET', '/api/kpi/commerciaux/moi', { query: { du: params?.du, au: params?.au } });
}
