// Real API client — talks to the Spring Boot backend described in
// docs/api-docsV0.json. No more static JSON / mock mutation layer: every
// function here issues an actual HTTP request.

import type {
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
  CreerInteractionRequest,
  CreerProspectRequest,
  CreerReglementRequest,
  DashboardDto,
  DevisDto,
  DossierDetailDto,
  DossierListItemDto,
  EcheanceDto,
  EtapeSuivanteDto,
  EvenementCalendrierDto,
  HistoriqueDto,
  HistoriqueEvenementDto,
  HotlineResultDto,
  InteractionDto,
  ModifierEcheanceRequest,
  ModifierProspectRequest,
  ModifierProspectionRequest,
  MontantsDossierDto,
  OrigineProspectionDto,
  PageDto,
  Pageable,
  PaysDto,
  PieceJointeDto,
  ProfilCategorieDto,
  ProjetDetailDto,
  ProjetListItemDto,
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
  TitreDto,
  TransformerProspectionRequest,
  TrancheDetailDto,
  TrancheListItemDto,
  UtilisateurCourantDto,
  UUID,
  VilleDto,
} from '../types';

/** Default page size used whenever a caller doesn't specify one. */
export const DEFAULT_PAGE_SIZE = 20;

function withPageable(
  params: Record<string, string | number | boolean | undefined | null> | undefined,
  pageable?: Pageable,
): Record<string, string | number | boolean | string[] | undefined | null> {
  return {
    ...params,
    page: pageable?.page ?? 0,
    size: pageable?.size ?? DEFAULT_PAGE_SIZE,
    sort: pageable?.sort,
  };
}

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
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

/** Escape hatch for callers that need a guaranteed-fresh read (e.g. after an
 * out-of-band change). Not needed for normal use — mutations already clear
 * the cache automatically. */
export function clearApiCache(): void {
  getCache.clear();
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
  getCache.clear();
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
    // Spring's default error body is a ProblemDetail ({detail, title, status, …}) —
    // surface `detail` (or `title`) directly instead of dumping raw JSON.
    let message = `${method} ${url} a échoué (${res.status})`;
    try {
      const text = await res.text();
      if (text) {
        try {
          const parsed: unknown = JSON.parse(text);
          const detail =
            parsed && typeof parsed === 'object' && 'detail' in parsed && typeof (parsed as { detail?: unknown }).detail === 'string'
              ? (parsed as { detail: string }).detail
              : parsed && typeof parsed === 'object' && 'title' in parsed && typeof (parsed as { title?: unknown }).title === 'string'
                ? (parsed as { title: string }).title
                : null;
          message = detail || `${message} — ${text.slice(0, 300)}`;
        } catch {
          message = `${message} — ${text.slice(0, 300)}`;
        }
      }
    } catch {
      // ignore — fall back to the status-only message
    }
    throw new ApiError(res.status, message);
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
  params?: { search?: string; type?: string },
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

export function listProspections(
  params?: {
    etape?: string;
    origine?: string;
    commercial?: UUID;
    search?: string;
    ouvertes?: boolean;
  },
  pageable?: Pageable,
): Promise<PageDto<ProspectionListItemDto>> {
  return request('GET', '/api/prospections', { query: withPageable(params, pageable) });
}

export function getProspection(id: UUID): Promise<ProspectionDetailDto> {
  return request('GET', `/api/prospections/${id}`);
}

export function listPreProspections(pageable?: Pageable): Promise<PageDto<ProspectionListItemDto>> {
  return request('GET', '/api/pre-prospections', { query: withPageable(undefined, pageable) });
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

// ---------------------------------------------------------------------------
// Dossiers
// ---------------------------------------------------------------------------

export function listDossiers(
  params?: {
    statut?: string;
    commercial?: UUID;
    projet?: UUID;
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
async function fetchByteEndpointBlob(url: string, mime: string): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: 'include' });
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

function fetchPieceJointeBlob(dossierId: UUID, pieceId: UUID, extension: string | undefined): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/${dossierId}/pieces-jointes/${pieceId}/fichier`;
  return fetchByteEndpointBlob(url, mimeForExtension(extension));
}

/** Shared by the dossier's generated-document endpoints
 * (`/documents/fiche-reservation`, `/documents/acte-reservation`, …) — same
 * `format: byte` shape, just a different document kind in the path. */
function fetchDossierDocumentBlob(dossierId: UUID, docKind: 'fiche-reservation' | 'acte-reservation', format: 'pdf' | 'docx'): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/${dossierId}/documents/${docKind}?format=${format}`;
  return fetchByteEndpointBlob(url, mimeForExtension(format));
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

export async function downloadPieceJointe(dossierId: UUID, pieceId: UUID, filename: string, extension?: string): Promise<void> {
  const blob = await fetchPieceJointeBlob(dossierId, pieceId, extension);
  triggerBlobDownload(blob, filename);
}

export async function viewPieceJointe(dossierId: UUID, pieceId: UUID, extension?: string): Promise<void> {
  const win = window.open('', '_blank');
  try {
    const blob = await fetchPieceJointeBlob(dossierId, pieceId, extension);
    showBlobInTab(win, blob);
  } catch (err) {
    win?.close();
    throw err;
  }
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

// ---------------------------------------------------------------------------
// Tranches / Projets / Articles
// ---------------------------------------------------------------------------

export function getTranche(id: UUID): Promise<TrancheDetailDto> {
  return request('GET', `/api/tranches/${id}`);
}

export function listTrancheArticles(
  trancheId: UUID,
  params?: { statut?: ArticleStatut },
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

export function getArticle(id: UUID): Promise<ArticleDetailDto> {
  return request('GET', `/api/articles/${id}`);
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

export function rechercherHotline(telephone: string): Promise<HotlineResultDto> {
  return request('GET', '/api/hotline/recherche', { query: { telephone } });
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

/** Réservé au rôle Administrateur — génère un mot de passe temporaire à
 * communiquer hors-bande, jamais renvoyé une seconde fois. */
export function reinitialiserMotDePasse(admUserId: UUID): Promise<ReinitialiserMotDePasseResponse> {
  return request('POST', `/api/utilisateurs/${admUserId}/reinitialiser-mot-de-passe`);
}
