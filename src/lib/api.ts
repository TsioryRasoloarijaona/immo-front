import { clearCachedValues } from './apiCache';
import type {
  ActionnaireDto,
  DeviseDto,
  EntiteJuridiqueDto,
  EntiteJuridiqueEcritureDto,
  GroupeActionnairesDto,
  ActionRecente,
  PorteeActionsRecentes,
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
  BordereauDto,
  DecompteDetailDto,
  DecompteListItemDto,
  LotDetailDto,
  LotListItemDto,
  ProjetChantierDetailDto,
  ProjetChantierListItemDto,
  ReferentielsChantierDto,
  ChangerEtapeRequest,
  ChangerMotDePasseRequest,
  ChangerStatutRequest,
  ClientListItemDto,
  ColonneDto,
  GranulariteGroupe,
  PageGroupesDto,
  TriGroupes,
  CommercialListItemDto,
  CompleterProfilRequest,
  ConnexionRequest,
  ContactProspectDto,
  CreerContactProspectRequest,
  CreerDevisRequest,
  CreerDossierRequest,
  CreerEcheanceRequest,
  CreerInteractionRequest,
  CreerPreProspectionRequest,
  CreerProspectRequest,
  CleApiCreeeDto,
  CleApiDto,
  CreerCleApiRequest,
  CreerProspectionRequest,
  CreerReglementRequest,
  DashboardDto,
  DevisDto,
  DevisPageDto,
  DossierDetailDto,
  DossierListItemDto,
  EcheanceDto,
  EncaissementDetailDto,
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
  NouveauPreProspectDto,
  PieceJointeDto,
  PreProspectionCreeeDto,
  RapportImportPreProspectionsDto,
  StatutLigneImport,
  RelanceProspectionDto,
  SyntheseAnnuelleDto,
  EcheanceRelance,
  PorteeRelance,
  ProfilCategorieDto,
  ProjetDetailDto,
  ProjetEcritureDto,
  ArticleEcritureDto,
  SousArticleEcritureDto,
  AffectationSousArticleDto,
  ProjetListItemDto,
  PerformanceCommercialDto,
  ProjetPerimetreDto,
  ProspectDetailDto,
  ProspectDoublonDto,
  ProspectionExistanteDto,
  RechercheDoublonsProspectParams,
  LierProspectRequest,
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
  ReinitialiserMotDePasseRequest,
  ReinitialiserMotDePasseResponse,
  ResultatEnvoiVisiteDto,
  EnvoyerOffrePrixRequest,
  FiltresAvancesProspection,
  ResultatEnvoiOffreDto,
  ResultatInteractionDto,
  SuiviActionDto,
  SchemaFinancementDto,
  SimulerSchemaFinancementRequest,
  SynchronisationResultatDto,
  TitreDto,
  TransformerProspectionRequest,
  TrancheDetailDto,
  TrancheEcritureDto,
  TrancheListItemDto,
  TypeReglementDto,
  UtilisateurCourantDto,
  UtilisateurListItemDto,
  UUID,
  VilleDto,
  ZoneProjetDto,
  ZoneProjetEcritureDto,
  LigneAuditDto,
  NoteDto,
  CreerNoteRequest,
  PorteurNote,
  LignesTrancheDto,
  TerrainTrancheDto,
  TerrainTrancheEcritureDto,
  TerrainDisponibleDto,
  EtageTrancheDto,
  EtageTrancheEcritureDto,
  PlancherCouvertDto,
  PlancherCouvertEcritureDto,
  FraisTrancheDto,
  FraisTrancheEcritureDto,
} from '../types';

export const DEFAULT_PAGE_SIZE = 20;

type ParamsRequete = Record<string, string | number | boolean | string[] | undefined | null>;

function withPageable(params: ParamsRequete | undefined, pageable?: Pageable): ParamsRequete {
  return {
    ...params,
    page: pageable?.page ?? 0,
    size: pageable?.size ?? DEFAULT_PAGE_SIZE,
    sort: pageable?.sort,
  };
}

// `back_end_url` n'a pas de préfixe `VITE_` : sans son entrée `envPrefix` dans
// vite.config.ts, il vaudrait `undefined` en production, sans erreur.
// Repli sur l'hôte de la page, pas 'localhost' : un appareil du réseau local appellerait le sien.
export const API_BASE_URL: string =
  (import.meta.env.back_end_url)?.replace(/\/$/, '') ||
  `${window.location.protocol}//${window.location.hostname}:8080`;

const MESSAGE_API_INJOIGNABLE = `Impossible de joindre l'API (${API_BASE_URL}). Vérifiez que le backend tourne.`;

export class ApiError extends Error {
  status: number;
  problem?: Record<string, unknown>;
  constructor(status: number, message: string, problem?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

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
  return { message: detailProblem(problem) || `${fallback} — ${text.slice(0, 300)}`, problem };
}

function detailProblem(problem: Record<string, unknown> | undefined): string | null {
  if (typeof problem?.detail === 'string') return problem.detail;
  if (typeof problem?.title === 'string') return problem.title;
  return null;
}

type QueryValue = string | number | boolean | string[] | undefined | null;

export interface ParamsGroupes {
  /** Doit être `groupable` dans le catalogue, sinon 400 (`colonnesValides`). */
  groupBy: string;
  /** Jetons, pas noms de colonne : `prix` = somme, `prix:AVG` = fonction nommée.
   * Fonctions permises par colonne dans `ColonneDto.fonctions`, sinon 400 ;
   * jamais de liste en dur (voir `jetonAgregat`). */
  agregats?: string[];
  granularite?: GranulariteGroupe;
  tri?: TriGroupes;
  /** Défaut serveur `false`, qui fait disparaître des lignes sans le dire : le front
   * envoie toujours `true` (voir `useGroupement`). */
  inclureSansValeur?: boolean;
}

/** `granularite` doit répéter celle passée à `/groupes` : sinon le serveur rend
 * `totalElements: 0` en HTTP 200, un écran vide sans message. */
export interface ParamsDepliage {
  groupeColonne: string;
  /** `null` désigne le groupe sans valeur ; une clé `''` s'y confondrait (`buildQuery` l'écarte). */
  groupeValeur?: string | null;
  granularite?: GranulariteGroupe;
}

function withGroupes(
  query: Record<string, QueryValue>,
  groupes: ParamsGroupes,
): Record<string, QueryValue> {
  query.groupBy = groupes.groupBy;
  if (groupes.agregats && groupes.agregats.length > 0) query.agregats = groupes.agregats;
  if (groupes.granularite) query.granularite = groupes.granularite;
  if (groupes.tri) query.tri = groupes.tri;
  if (groupes.inclureSansValeur !== undefined) query.inclureSansValeur = groupes.inclureSansValeur;
  return query;
}

function withDepliage(
  query: Record<string, QueryValue>,
  depliage?: ParamsDepliage,
): Record<string, QueryValue> {
  if (!depliage) return query;
  query.groupeColonne = depliage.groupeColonne;
  query.groupeValeur = depliage.groupeValeur ?? undefined;
  if (depliage.granularite) query.granularite = depliage.granularite;
  return query;
}

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

// Toute mutation réussie vide le cache entier. Le sondage de session d'auth.tsx
// doit rester plus espacé que ce TTL.
const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  expiresAt: number;
  promise: Promise<unknown>;
}

const getCache = new Map<string, CacheEntry>();

/** Cookie JWT httpOnly, pas de rafraîchissement : un 401 est le seul signal
 * d'expiration. Abonné unique, l'`AuthProvider`. */
type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

/** Pour un 401 d'un autre client partageant le cookie (`lib/virements.ts`). */
export function signalerSessionExpiree(): void {
  unauthorizedHandler?.();
}

/** Un 401 sur le formulaire de connexion est un mauvais identifiant, pas une expiration. */
function signalerSiSessionExpiree(url: string, status: number): void {
  if (status !== 401) return;
  if (url.includes('/api/auth/connexion')) return;
  unauthorizedHandler?.();
}

export function clearApiCache(): void {
  getCache.clear();
  clearCachedValues();
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  // `lecture` : POST sans effet (simulation) — ne vide pas les caches, sinon un
  // `useApi` qui l'appelle relancerait sa propre requête.
  opts?: { body?: unknown; query?: Record<string, QueryValue>; lecture?: boolean },
): Promise<T> {
  const url = `${API_BASE_URL}${path}${buildQuery(opts?.query)}`;

  if (method === 'GET') {
    const cached = getCache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.promise as Promise<T>;
    }
    const promise = performRequest<T>(method, url, opts);
    getCache.set(url, { expiresAt: Date.now() + CACHE_TTL_MS, promise });
    // Un échec ne doit pas rester en cache pour la tentative suivante.
    promise.catch(() => getCache.delete(url));
    return promise;
  }

  const result = await performRequest<T>(method, url, opts);
  if (!opts?.lecture) clearApiCache();
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
      // Sans `include`, le cookie httpOnly n'est pas renvoyé en cross-origin : tout finirait en 401.
      credentials: 'include',
    });
  } catch {
    throw new ApiError(0, MESSAGE_API_INJOIGNABLE);
  }
  if (!res.ok) {
    signalerSiSessionExpiree(url, res.status);
    const { message, problem } = await readErrorBody(res, `${method} ${url} a échoué (${res.status})`);
    throw new ApiError(res.status, message, problem);
  }
  return lireCorpsJson<T>(res);
}

async function lireCorpsJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export function listProspects(
  params?: {
    search?: string;
    /** Le serveur ne lie que la première valeur d'un `type` répété. */
    type?: string[];
  },
  pageable?: Pageable,
  /** Un nom hors catalogue renvoie 400 ; `id` est servi qu'on le demande ou non. */
  options?: { colonnes?: string[] },
): Promise<PageDto<ProspectListItemDto>> {
  const query: Record<string, QueryValue> = withPageable(params, pageable);
  if (options?.colonnes && options.colonnes.length > 0) query.colonnes = options.colonnes;
  return request('GET', '/api/prospects', { query });
}

export function getColonnesProspects(): Promise<ColonneDto[]> {
  return request('GET', '/api/referentiels/colonnes/prospects');
}

export function getProspect(id: UUID): Promise<ProspectDetailDto> {
  return request('GET', `/api/prospects/${id}`);
}

/** `trancheId` réservé aux administrateurs : 403 sinon. */
export function listClients(params?: { search?: string; trancheId?: UUID }, pageable?: Pageable): Promise<PageDto<ClientListItemDto>> {
  return request('GET', '/api/clients', { query: withPageable(params, pageable) });
}

export function getClient(id: UUID): Promise<ProspectDetailDto> {
  return request('GET', `/api/clients/${id}`);
}

/** 409 + `doublons` sur tout homonyme (cas courant) sauf `ignorerDoublons: true` :
 * lire avec `doublonsDepuisErreur`, faire choisir, puis renvoyer. */
export function createProspect(body: CreerProspectRequest): Promise<ProspectDetailDto> {
  return request('POST', '/api/prospects', { body });
}

/** Prévient pendant la saisie ; ne dispense pas de gérer le 409 de `createProspect`.
 * @public endpoint servi, pas encore branché sur un écran */
export function rechercherDoublonsProspect(params: RechercheDoublonsProspectParams): Promise<ProspectDoublonDto[]> {
  return request('GET', '/api/prospects/doublons', { query: { ...params } });
}

export function doublonsDepuisErreur(err: unknown): ProspectDoublonDto[] | null {
  if (!(err instanceof ApiError) || err.status !== 409) return null;
  const doublons = err.problem?.doublons;
  return Array.isArray(doublons) ? (doublons as ProspectDoublonDto[]) : null;
}

export function prospectionExistanteDepuisErreur(err: unknown): ProspectionExistanteDto | null {
  if (!(err instanceof ApiError) || err.status !== 409) return null;
  const existante = err.problem?.prospectionExistante;
  return existante && typeof existante === 'object' && typeof (existante as { id?: unknown }).id === 'string'
    ? (existante as ProspectionExistanteDto)
    : null;
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

export interface ProspectionFilterParams {
  [key: string]: string | number | boolean | string[] | undefined | null;
  etape?: string[];
  origine?: string[];
  commercial?: UUID[];
  trancheId?: UUID[];
  /** Date-heure ISO (pas une date seule), borne incluse. */
  dateDebut?: string;
  /** Date-heure ISO (pas une date seule), borne incluse. */
  dateFin?: string;
  search?: string;
  ouvertes?: boolean;
}

/** `colonnes` hors de `ProspectionFilterParams` : /api/pre-prospections le refuse.
 * L'omettre n'est pas neutre : la vue légataire n'est pas lue et les colonnes
 * `ACTIVITE`/`CONVERSION` manquent. Nom hors catalogue → 400. */
export function listProspections(
  params?: ProspectionFilterParams,
  pageable?: Pageable,
  options?: {
    colonnes?: string[];
    /** Aplati en paramètres plats, pas sérialisé en objet : la spec déclare un objet
     * `filtres` (`required`), artefact springdoc ; Spring lie des paramètres plats. */
    filtres?: FiltresAvancesProspection;
    depliage?: ParamsDepliage;
  },
): Promise<PageDto<ProspectionListItemDto>> {
  const query: Record<string, QueryValue> = withPageable(params, pageable);
  if (options?.colonnes && options.colonnes.length > 0) query.colonnes = options.colonnes;
  ajouterFiltres(query, options?.filtres);
  if (options?.depliage) withDepliage(query, options.depliage);
  return request('GET', '/api/prospections', { query });
}

function ajouterFiltres(query: Record<string, QueryValue>, filtres: FiltresAvancesProspection | undefined): void {
  for (const [cle, valeur] of Object.entries(filtres ?? {})) {
    // `false` et `0` sont des filtres légitimes : seuls `undefined` et `[]` sont écartés.
    if (valeur === undefined) continue;
    if (Array.isArray(valeur) && valeur.length === 0) continue;
    query[cle] = valeur as QueryValue;
  }
}

/** Colonnes `ACTIVITE`/`CONVERSION` non groupables (vue légataire) : se fier à
 * `groupable` du catalogue, ne pas le redéduire. */
export function listProspectionsGroupes(
  params: ProspectionFilterParams | undefined,
  groupes: ParamsGroupes,
  pageable?: Pageable,
  options?: { filtres?: FiltresAvancesProspection },
): Promise<PageGroupesDto> {
  const query = withGroupes(withPageable(params, pageable), groupes);
  ajouterFiltres(query, options?.filtres);
  return request('GET', '/api/prospections/groupes', { query });
}

export function getColonnesProspections(): Promise<ColonneDto[]> {
  return request('GET', '/api/referentiels/colonnes/prospections');
}

export function getProspection(id: UUID): Promise<ProspectionDetailDto> {
  return request('GET', `/api/prospections/${id}`);
}

export function createProspection(body: CreerProspectionRequest): Promise<ProspectionDetailDto> {
  return request('POST', '/api/prospections', { body });
}

/** Malgré le chemin, part aussi par WhatsApp : un bloc par canal, `envoye` vrai si
 * l'un a abouti. Un 200 avec `envoye: false` (sans coordonnée) n'est pas une erreur. */
export function renvoyerEmailVisite(prospectionId: UUID, interactionId: UUID): Promise<ResultatEnvoiVisiteDto> {
  return request('POST', `/api/prospections/${prospectionId}/interactions/${interactionId}/email-visite`);
}

/** `remisePercent` est un pourcentage (5 = 5 %), pas un ratio. Le 409 (lot non
 * rattaché) est courant : l'afficher comme une étape, pas une erreur, et ne rien
 * déduire de la forme de son corps. `envoye: false` sur un 200 n'est pas un échec. */
export function envoyerOffrePrix(id: UUID, body?: EnvoyerOffrePrixRequest): Promise<ResultatEnvoiOffreDto> {
  return request('POST', `/api/prospections/${id}/offre-prix`, { body: body ?? {} });
}

export function listProspectionHistorique(id: UUID, pageable?: Pageable): Promise<PageDto<HistoriqueDto>> {
  return request('GET', `/api/prospections/${id}/historique`, { query: withPageable(undefined, pageable) });
}

export function listPreProspections(
  params?: ProspectionFilterParams,
  pageable?: Pageable,
  options?: { depliage?: ParamsDepliage },
): Promise<PageDto<ProspectionListItemDto>> {
  const query = withDepliage(withPageable(params, pageable), options?.depliage);
  return request('GET', '/api/pre-prospections', { query });
}

/** `prospectNom` et `commercialNom` y sont toujours nuls : le serveur accepte de
 * grouper dessus, c'est à l'écran de ne pas les proposer. */
export function listPreProspectionsGroupes(
  params: ProspectionFilterParams | undefined,
  groupes: ParamsGroupes,
  pageable?: Pageable,
): Promise<PageGroupesDto> {
  return request('GET', '/api/pre-prospections/groupes', {
    query: withGroupes(withPageable(params, pageable), groupes),
  });
}

/** 409 + `doublons` comme `createProspect`. Personne existante →
 * `lierProspectAPreProspection` ; sinon renvoyer avec `ignorerDoublons: true`. */
export function creerProspectFromPreProspection(id: UUID, body: CreerProspectRequest): Promise<ProspectionDetailDto> {
  return request('POST', `/api/pre-prospections/${id}/creer-prospect`, { body });
}

/** 409 + `prospectionExistante` si ce prospect a déjà une prospection ouverte sur le projet. */
export function lierProspectAPreProspection(id: UUID, body: LierProspectRequest): Promise<ProspectionDetailDto> {
  return request('POST', `/api/pre-prospections/${id}/lier-prospect`, { body });
}

/** Réponse enveloppée `{ preProspection, doublons }` : doublons signalés, jamais refusés. */
export function creerPreProspection(body: CreerPreProspectionRequest): Promise<PreProspectionCreeeDto> {
  return request('POST', '/api/pre-prospections', { body });
}

export interface ImportPreProspectionsParams {
  /** Toutes les lignes du fichier y sont rattachées. */
  trancheId: UUID;
  etapeId?: UUID;
  origineId?: UUID;
  origineSupportId?: UUID;
  typeContactId?: UUID;
  actionCommercialeId?: UUID;
  /** Absent : les deux. Vide, `DEJA_IMPORTEE` ou `ERREUR` → 400. */
  statuts?: StatutImportable[];
}

export type StatutImportable = Extract<StatutLigneImport, 'NOUVELLE' | 'DOUBLON'>;

export function apercuImportPreProspections(fichier: File): Promise<RapportImportPreProspectionsDto> {
  return postMultipart<RapportImportPreProspectionsDto>('/api/pre-prospections/import/apercu', fichier);
}

/** Renvoyer le même fichier qu'à l'aperçu ; les lignes `ERREUR` n'empêchent pas les autres. */
export function importerPreProspections(fichier: File, params: ImportPreProspectionsParams): Promise<RapportImportPreProspectionsDto> {
  return postMultipart<RapportImportPreProspectionsDto>('/api/pre-prospections/import', fichier, { ...params });
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

/** Seul `fermee` repasse à `false` : date et motif de clôture restent, les relances
 * ne sont pas réarmées. 409 si la prospection n'est pas archivée. */
export function desarchiverProspection(id: UUID): Promise<ProspectionDetailDto> {
  return request('PATCH', `/api/prospections/${id}/desarchiver`);
}

export function modifierProspection(id: UUID, body: ModifierProspectionRequest): Promise<ProspectionDetailDto> {
  return request('PATCH', `/api/prospections/${id}`, { body });
}

/** Seul moyen de changer `trancheId`/`articleId` : `addProspectionAutreTranche` n'y touche jamais. */
export function modifierTranchePrincipale(id: UUID, body: ModifierTranchePrincipaleRequest): Promise<ProspectionDetailDto> {
  return request('PATCH', `/api/prospections/${id}/tranche-principale`, { body });
}

export function listInteractions(prospectionId: UUID, pageable?: Pageable): Promise<PageDto<InteractionDto>> {
  return request('GET', `/api/prospections/${prospectionId}/interactions`, { query: withPageable(undefined, pageable) });
}

export function addInteraction(prospectionId: UUID, body: CreerInteractionRequest): Promise<InteractionDto> {
  return request('POST', `/api/prospections/${prospectionId}/interactions`, { body });
}

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

/** Sans prospect lié (pré-prospection) : liste vide, jamais une erreur. */
export function listProspectionContacts(prospectionId: UUID): Promise<ContactProspectDto[]> {
  return request('GET', `/api/prospections/${prospectionId}/contacts`);
}
/** 400 si la prospection n'a pas encore de prospect. */
export function addProspectionContact(prospectionId: UUID, body: CreerContactProspectRequest): Promise<ContactProspectDto> {
  return request('POST', `/api/prospections/${prospectionId}/contacts`, { body });
}

export function listDevis(prospectionId: UUID, pageable?: Pageable): Promise<PageDto<DevisDto>> {
  return request('GET', `/api/prospections/${prospectionId}/devis`, { query: withPageable(undefined, pageable) });
}
export function creerDevis(prospectionId: UUID, body: CreerDevisRequest): Promise<DevisDto> {
  return request('POST', `/api/prospections/${prospectionId}/devis`, { body });
}

export interface DevisFilterParams {
  [key: string]: string | number | boolean | string[] | undefined | null;
  search?: string;
  trancheId?: UUID[];
  commercial?: UUID;
  /** Date-heure ISO (pas une date seule), borne incluse. */
  dateDebut?: string;
  /** Date-heure ISO (pas une date seule), borne incluse. */
  dateFin?: string;
}

/** `sommePrixVenteTTCPage` : somme de la page courante seulement, pas du filtre entier. */
export function listOffres(params?: DevisFilterParams, pageable?: Pageable): Promise<DevisPageDto> {
  return request('GET', '/api/devis', { query: withPageable(params, pageable) });
}

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

/** Alias et non `interface` à dessein : seul un alias d'objet reçoit la signature
 * d'index implicite qui le rend assignable au `Record` de `withPageable`. */
export type DossierFilterParams = {
  statut?: string[];
  commercial?: UUID;
  /** Rapproché via l'article principal du dossier. */
  projet?: UUID;
  trancheId?: UUID[];
  /** Défaut serveur RESERVATION ; ignoré sans `dateDebut`/`dateFin`. */
  champDate?: DossierChampDate;
  /** Date-heure ISO (pas une date seule), borne incluse. */
  dateDebut?: string;
  /** Date-heure ISO (pas une date seule), borne incluse. */
  dateFin?: string;
  search?: string;
};

export function listDossiers(
  params?: DossierFilterParams,
  pageable?: Pageable,
  /** Nom hors catalogue → 400. Les groupes `PATRIMOINE`/`ORIGINE` coûtent des
   * jointures par ligne : ne les demander qu'affichés. */
  options?: {
    colonnes?: string[];
    depliage?: ParamsDepliage;
  },
): Promise<PageDto<DossierListItemDto>> {
  const query: Record<string, QueryValue> = withPageable(params, pageable);
  if (options?.colonnes && options.colonnes.length > 0) query.colonnes = options.colonnes;
  withDepliage(query, options?.depliage);
  return request('GET', '/api/dossiers', { query });
}

export function listDossiersGroupes(
  params: DossierFilterParams | undefined,
  groupes: ParamsGroupes,
  pageable?: Pageable,
): Promise<PageGroupesDto> {
  return request('GET', '/api/dossiers/groupes', {
    query: withGroupes(withPageable(params, pageable), groupes),
  });
}

export function getColonnesDossiers(): Promise<ColonneDto[]> {
  return request('GET', '/api/referentiels/colonnes/dossiers');
}

export function getDossier(id: UUID): Promise<DossierDetailDto> {
  return request('GET', `/api/dossiers/${id}`);
}

export function createDossier(body: CreerDossierRequest): Promise<DossierDetailDto> {
  return request('POST', '/api/dossiers', { body });
}

export function simulerSchemaFinancement(body: SimulerSchemaFinancementRequest): Promise<SchemaFinancementDto> {
  return request('POST', '/api/dossiers/simulation-financement', { body, lecture: true });
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

/** Les autres champs voyagent en query string, pas dans le corps. Pas de
 * `Content-Type` à la main : le navigateur doit poser la boundary. */
async function postMultipart<T>(path: string, file: File, query?: Record<string, QueryValue>): Promise<T> {
  const form = new FormData();
  form.set('fichier', file);
  const url = `${API_BASE_URL}${path}${buildQuery(query)}`;
  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', body: form, credentials: 'include' });
  } catch {
    throw new ApiError(0, MESSAGE_API_INJOIGNABLE);
  }
  if (!res.ok) {
    signalerSiSessionExpiree(url, res.status);
    const { message, problem } = await readErrorBody(res, `POST ${url} a échoué (${res.status})`);
    throw new ApiError(res.status, message, problem);
  }
  clearApiCache();
  return lireCorpsJson<T>(res);
}

export function uploadPieceJointe(dossierId: UUID, file: File, description?: string, typeId?: UUID): Promise<PieceJointeDto> {
  return postMultipart<PieceJointeDto>(`/api/dossiers/${dossierId}/pieces-jointes`, file, { description, typeId });
}

/** Irréversible via l'API (d'où la confirmation à l'écran) ; rejouer le DELETE renvoie 404. */
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

/** `PieceJointeDto` n'a pas de type MIME : l'extension est le seul indice. */
function mimeForExtension(extension: string | undefined): string {
  const ext = (extension ?? '').replace(/^\./, '').toLowerCase();
  return EXTENSION_MIME[ext] ?? 'application/octet-stream';
}

function blobDepuisTexte(text: string, mime: string): Blob {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }
  if (typeof parsed === 'string') {
    const base64 = parsed.includes(',') && parsed.trim().startsWith('data:') ? parsed.split(',', 2)[1] : parsed;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  if (Array.isArray(parsed)) return new Blob([new Uint8Array(parsed as number[])], { type: mime });
  return new Blob([text], { type: mime });
}

/** Un `format: byte` peut arriver en JSON (chaîne base64 ou tableau de nombres)
 * au lieu de binaire : les deux formes sont gérées. */
async function fetchByteEndpointBlob(url: string, mime: string, init?: RequestInit): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(url, { credentials: 'include', ...init });
  } catch {
    throw new ApiError(0, MESSAGE_API_INJOIGNABLE);
  }
  if (!res.ok) {
    signalerSiSessionExpiree(url, res.status);
    const { message, problem } = await readErrorBody(res, `Téléchargement échoué (${res.status}).`);
    throw new ApiError(res.status, message, problem);
  }

  const contentType = res.headers.get('content-type') ?? '';
  let blob: Blob;
  if (contentType.includes('application/json') || contentType.includes('text/plain')) {
    blob = blobDepuisTexte(await res.text(), mime);
  } else {
    const raw = await res.blob();
    // `Blob.type` est immuable : pour corriger un type absent ou générique, on reconstruit.
    blob = raw.type && raw.type !== 'application/octet-stream' ? raw : new Blob([raw], { type: mime });
  }

  if (blob.size === 0) {
    throw new ApiError(res.status, "Le fichier renvoyé par l'API est vide.");
  }
  return blob;
}

export function listArticlePiecesJointes(articleId: UUID): Promise<PieceJointeDto[]> {
  return request('GET', `/api/articles/${articleId}/pieces-jointes`);
}

/** Redirection 302 vers le stockage : voir {@link openStoredFileInTab}. */
export function openArticlePieceJointeFichier(articleId: UUID, pieceId: UUID): void {
  openStoredFileInTab(`${API_BASE_URL}/api/articles/${articleId}/pieces-jointes/${pieceId}/fichier`);
}

function fetchDossierDocumentBlob(dossierId: UUID, docKind: 'fiche-reservation' | 'acte-reservation', format: 'pdf' | 'docx'): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/${dossierId}/documents/${docKind}?format=${format}`;
  return fetchByteEndpointBlob(url, mimeForExtension(format));
}

export type DossierPdfOnlyDocKind = 'fiche-visite-technique' | 'fiche-dossier-vente' | 'fiche-bancaire' | 'fiche-trop-percu';
function fetchDossierPdfOnlyDocumentBlob(dossierId: UUID, docKind: DossierPdfOnlyDocKind): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/${dossierId}/documents/${docKind}`;
  return fetchByteEndpointBlob(url, mimeForExtension('pdf'));
}

function fetchRecuReglementBlob(dossierId: UUID, reglementId: UUID): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/${dossierId}/reglements/${reglementId}/documents/recu`;
  return fetchByteEndpointBlob(url, mimeForExtension('pdf'));
}

/** Par règlement et non par échéance : compte, mode de versement et tiers payeur
 * ne sont renseignés que sur le règlement dans les données réelles. */
function fetchAutorisationVersementBlob(dossierId: UUID, reglementId: UUID): Promise<Blob> {
  const url = `${API_BASE_URL}/api/dossiers/${dossierId}/reglements/${reglementId}/documents/autorisation-versement`;
  return fetchByteEndpointBlob(url, mimeForExtension('pdf'));
}

export type ProspectionPdfDocKind = 'nda' | 'fiche';
function fetchProspectionDocumentBlob(prospectionId: UUID, docKind: ProspectionPdfDocKind): Promise<Blob> {
  const url = `${API_BASE_URL}/api/prospections/${prospectionId}/documents/${docKind}`;
  return fetchByteEndpointBlob(url, mimeForExtension('pdf'));
}

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
  // Révoquer juste après click() fait la course avec l'enregistrement : fichier de 0 octet.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

function showBlobInTab(win: Window | null, blob: Blob): void {
  if (!win) {
    throw new ApiError(0, "Le navigateur a bloqué l'ouverture d'un nouvel onglet.");
  }
  const objectUrl = URL.createObjectURL(blob);
  win.location.href = objectUrl;
  // Jamais révoquée : l'onglet de visualisation la relit tant qu'il est ouvert.
}

/** Onglet ouvert **avant** le premier `await` (geste utilisateur), fermé si le chargement échoue. */
async function ouvrirBlobDansOnglet(charger: () => Promise<Blob>): Promise<void> {
  const win = window.open('', '_blank');
  try {
    showBlobInTab(win, await charger());
  } catch (err) {
    win?.close();
    throw err;
  }
}

/** `.../fichier` répond 302 vers une URL présignée : un `fetch` avec credentials est
 * rejeté par le CORS du stockage, une navigation non. D'où un onglet, ouvert sans
 * `await` en amont (bloqueur de popups) ; « Voir » et « Télécharger » y sont identiques. */
function openStoredFileInTab(url: string): void {
  const win = window.open('', '_blank');
  if (!win) {
    throw new ApiError(0, "Le navigateur a bloqué l'ouverture d'un nouvel onglet.");
  }
  win.location.href = url;
}

/** Redirection 302 vers le stockage : voir {@link openStoredFileInTab}. */
export function openPieceJointeFichier(dossierId: UUID, pieceId: UUID): void {
  openStoredFileInTab(`${API_BASE_URL}/api/dossiers/${dossierId}/pieces-jointes/${pieceId}/fichier`);
}

export async function downloadFicheReservation(dossierId: UUID, filename: string, format: 'pdf' | 'docx' = 'pdf'): Promise<void> {
  const blob = await fetchDossierDocumentBlob(dossierId, 'fiche-reservation', format);
  triggerBlobDownload(blob, filename);
}

export function viewFicheReservation(dossierId: UUID, format: 'pdf' | 'docx' = 'pdf'): Promise<void> {
  return ouvrirBlobDansOnglet(() => fetchDossierDocumentBlob(dossierId, 'fiche-reservation', format));
}

export async function downloadActeReservation(dossierId: UUID, filename: string, format: 'pdf' | 'docx' = 'pdf'): Promise<void> {
  const blob = await fetchDossierDocumentBlob(dossierId, 'acte-reservation', format);
  triggerBlobDownload(blob, filename);
}

export function viewActeReservation(dossierId: UUID, format: 'pdf' | 'docx' = 'pdf'): Promise<void> {
  return ouvrirBlobDansOnglet(() => fetchDossierDocumentBlob(dossierId, 'acte-reservation', format));
}

export async function downloadDevisDocument(prospectionId: UUID, devisId: UUID, filename: string): Promise<void> {
  const blob = await fetchDevisDocumentBlob(prospectionId, devisId);
  triggerBlobDownload(blob, filename);
}

export function viewDevisDocument(prospectionId: UUID, devisId: UUID): Promise<void> {
  return ouvrirBlobDansOnglet(() => fetchDevisDocumentBlob(prospectionId, devisId));
}

export async function downloadDossierPdfOnlyDocument(dossierId: UUID, docKind: DossierPdfOnlyDocKind, filename: string): Promise<void> {
  const blob = await fetchDossierPdfOnlyDocumentBlob(dossierId, docKind);
  triggerBlobDownload(blob, filename);
}

export function viewDossierPdfOnlyDocument(dossierId: UUID, docKind: DossierPdfOnlyDocKind): Promise<void> {
  return ouvrirBlobDansOnglet(() => fetchDossierPdfOnlyDocumentBlob(dossierId, docKind));
}

/** En lot, toujours PDF, même pour les types qui ont une variante Word à l'unité. */
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

export function viewDossiersDocumentsEnLot(kind: DossierBatchDocKind, dossierIds: UUID[]): Promise<void> {
  return ouvrirBlobDansOnglet(() => fetchDossiersDocumentsEnLotBlob(kind, dossierIds));
}

export async function downloadRecuReglement(dossierId: UUID, reglementId: UUID, filename: string): Promise<void> {
  const blob = await fetchRecuReglementBlob(dossierId, reglementId);
  triggerBlobDownload(blob, filename);
}

export function viewRecuReglement(dossierId: UUID, reglementId: UUID): Promise<void> {
  return ouvrirBlobDansOnglet(() => fetchRecuReglementBlob(dossierId, reglementId));
}

export async function downloadAutorisationVersement(dossierId: UUID, reglementId: UUID, filename: string): Promise<void> {
  const blob = await fetchAutorisationVersementBlob(dossierId, reglementId);
  triggerBlobDownload(blob, filename);
}

export function viewAutorisationVersement(dossierId: UUID, reglementId: UUID): Promise<void> {
  return ouvrirBlobDansOnglet(() => fetchAutorisationVersementBlob(dossierId, reglementId));
}

export async function downloadProspectionDocument(prospectionId: UUID, docKind: ProspectionPdfDocKind, filename: string): Promise<void> {
  const blob = await fetchProspectionDocumentBlob(prospectionId, docKind);
  triggerBlobDownload(blob, filename);
}

export function viewProspectionDocument(prospectionId: UUID, docKind: ProspectionPdfDocKind): Promise<void> {
  return ouvrirBlobDansOnglet(() => fetchProspectionDocumentBlob(prospectionId, docKind));
}

export function listEcheances(dossierId: UUID, pageable?: Pageable): Promise<PageDto<EcheanceDto>> {
  return request('GET', `/api/dossiers/${dossierId}/echeancier`, { query: withPageable(undefined, pageable) });
}

export function addEcheance(dossierId: UUID, body: CreerEcheanceRequest): Promise<EcheanceDto> {
  return request('POST', `/api/dossiers/${dossierId}/echeancier`, { body });
}

/** @public endpoint servi, pas encore branché sur un écran */
export function updateEcheance(dossierId: UUID, echeanceId: UUID, body: ModifierEcheanceRequest): Promise<EcheanceDto> {
  return request('PATCH', `/api/dossiers/${dossierId}/echeancier/${echeanceId}`, { body });
}

export function addReglement(dossierId: UUID, echeanceId: UUID, body: CreerReglementRequest): Promise<ReglementDto> {
  return request('POST', `/api/dossiers/${dossierId}/echeancier/${echeanceId}/reglements`, { body });
}

export function listEcheanceReglements(dossierId: UUID, echeanceId: UUID): Promise<ReglementDto[]> {
  return request('GET', `/api/dossiers/${dossierId}/echeancier/${echeanceId}/reglements`);
}

/** Liste vide : aucun règlement saisissable. Indicative seulement, le serveur accepte
 * aussi un tiers payeur. */
export function listPayeurs(dossierId: UUID): Promise<PayeurDto[]> {
  return request('GET', `/api/dossiers/${dossierId}/payeurs`);
}

/** Leur présence conditionne le passage à `POINTED`. */
export function listReglementPiecesJointes(dossierId: UUID, reglementId: UUID): Promise<PieceJointeDto[]> {
  return request('GET', `/api/dossiers/${dossierId}/reglements/${reglementId}/pieces-jointes`);
}

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

/** Vise l'endpoint, jamais l'URL présignée (elle expire, l'endpoint la renouvelle).
 * L'aperçu en `<iframe>` ne tient que parce que le stockage ne pose ni
 * `X-Frame-Options` ni CSP. */
export function urlReglementPieceJointeFichier(dossierId: UUID, reglementId: UUID, pieceId: UUID): string {
  return `${API_BASE_URL}/api/dossiers/${dossierId}/reglements/${reglementId}/pieces-jointes/${pieceId}/fichier`;
}

/** Redirection 302 vers le stockage : voir {@link openStoredFileInTab}. */
export function openReglementPieceJointeFichier(dossierId: UUID, reglementId: UUID, pieceId: UUID): void {
  openStoredFileInTab(urlReglementPieceJointeFichier(dossierId, reglementId, pieceId));
}

/** 409 sur la dernière preuve d'un règlement `POINTED` : déposer la nouvelle d'abord. */
export function removeReglementPieceJointe(dossierId: UUID, reglementId: UUID, pieceId: UUID): Promise<void> {
  return request('DELETE', `/api/dossiers/${dossierId}/reglements/${reglementId}/pieces-jointes/${pieceId}`);
}

/** `POINTED` et `CANCELED` sont terminaux (409 + `transitionsAutorisees`) ; pointer
 * sans pièce jointe rend aussi 409. */
export function modifierStatutReglement(
  dossierId: UUID,
  reglementId: UUID,
  body: ModifierStatutReglementRequest,
): Promise<ReglementDto> {
  return request('PATCH', `/api/dossiers/${dossierId}/reglements/${reglementId}/statut`, { body });
}

export type EncaissementChampDate = 'DATE_PIECE' | 'DATE_ECHEANCE' | 'DATE_REGLEMENT';

/** Hors périmètre → 404 et non 403 (pas d'énumération) ; un id non UUID → 404 aussi. */
export function getEncaissement(id: UUID): Promise<EncaissementDetailDto> {
  return request('GET', `/api/encaissements/${id}`);
}

export function listEncaissements(
  params?: {
    entiteId?: UUID[];
    typeId?: UUID[];
    etat?: string[];
    compteId?: UUID;
    depotId?: UUID;
    dossierId?: UUID;
    /** Un règlement à cheval sur deux tranches remonte pour les deux. */
    trancheId?: UUID[];
    tierId?: UUID;
    reference?: string;
    search?: string;
    comptabilise?: boolean;
    montantDe?: number;
    montantA?: number;
    /** Défaut serveur DATE_PIECE ; ignoré sans `dateDebut`/`dateFin`. */
    champDate?: EncaissementChampDate;
    dateDebut?: string;
    dateFin?: string;
  },
  pageable?: Pageable,
  /** Nom hors catalogue → 400. */
  options?: { colonnes?: string[]; depliage?: ParamsDepliage },
): Promise<PageDto<EncaissementDto>> {
  const query: Record<string, QueryValue> = withPageable(params, pageable);
  if (options?.colonnes && options.colonnes.length > 0) query.colonnes = options.colonnes;
  withDepliage(query, options?.depliage);
  return request('GET', '/api/encaissements', { query });
}

export function getColonnesEncaissements(): Promise<ColonneDto[]> {
  return request('GET', '/api/referentiels/colonnes/encaissements');
}

export function getColonnesSuiviActions(): Promise<ColonneDto[]> {
  return request('GET', '/api/referentiels/colonnes/suivi-actions');
}

/** Fin **exclue** : `dateDebut <= DocDate < dateFin` ; un jour J =
 * `dateDebut=J T00:00` et `dateFin=J+1 T00:00`. */
export type SuiviActionsFilterParams = {
  dateDebut?: string;
  dateFin?: string;
  /** Tranche résolue : celle de la prospection, sinon de l'article. */
  trancheId?: string[];
  /** `UserName` de l'action, égalité exacte. */
  utilisateur?: string[];
  /** Même référentiel que `getTypesContactProspection`. */
  typeId?: string[];
  categorieId?: string[];
  systeme?: boolean;
};

/** Seules les propriétés de l'action sont triables. */
export function listSuiviActions(
  params: SuiviActionsFilterParams,
  pageable?: Pageable,
  options?: { colonnes?: string[]; depliage?: ParamsDepliage },
): Promise<PageDto<SuiviActionDto>> {
  const query: Record<string, QueryValue> = withPageable(params, pageable);
  if (options?.colonnes && options.colonnes.length > 0) query.colonnes = options.colonnes;
  withDepliage(query, options?.depliage);
  return request('GET', '/api/suivi-actions', { query });
}

/** `agregats` rend 400 : rien n'est agrégeable ici. */
export function listSuiviActionsGroupes(
  params: SuiviActionsFilterParams,
  groupes: ParamsGroupes,
  pageable?: Pageable,
): Promise<PageGroupesDto> {
  return request('GET', '/api/suivi-actions/groupes', {
    query: withGroupes(withPageable(params, pageable), groupes),
  });
}

/** `dossierId`/`dossierCode` non groupables : un règlement peut couvrir plusieurs
 * dossiers et serait compté plusieurs fois. Se fier à `groupable` du catalogue. */
export function listEncaissementsGroupes(
  params: Parameters<typeof listEncaissements>[0],
  groupes: ParamsGroupes,
  pageable?: Pageable,
): Promise<PageGroupesDto> {
  return request('GET', '/api/encaissements/groupes', {
    query: withGroupes(withPageable(params, pageable), groupes),
  });
}

export const getEntitesReferentiel = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/entites');
export const getComptesReferentiel = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/comptes');
export const getDepotsReferentiel = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/depots');
export const getNatures = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/natures');
export const getEtages = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/etages');

// ---------------------------------------------------------------- Module Chantier (lecture seule)

/** Une fiche hors périmètre répond 404 comme un id inconnu : `null` pour rendre la page `NotFound`. */
export function nullSiIntrouvable<T>(promesse: Promise<T>): Promise<T | null> {
  return promesse.catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
}

export function getReferentielsChantier(): Promise<ReferentielsChantierDto> {
  return request('GET', '/api/chantier/referentiels');
}

export function listProjetsChantier(): Promise<ProjetChantierListItemDto[]> {
  return request('GET', '/api/chantier/projets');
}

export function getProjetChantier(id: UUID): Promise<ProjetChantierDetailDto> {
  return request('GET', `/api/chantier/projets/${id}`);
}

export interface FiltresLotsChantier {
  statutId?: UUID;
  typeId?: UUID;
  fournisseurId?: UUID;
  search?: string;
}

/** Tri admis : code, description, dateDebut, dateFin, statutOrdre, typeCode, fournisseurNom (sinon 400). */
export function listLotsProjetChantier(
  projetId: UUID,
  filtres?: FiltresLotsChantier,
  pageable?: Pageable,
): Promise<PageDto<LotListItemDto>> {
  return request('GET', `/api/chantier/projets/${projetId}/lots`, { query: withPageable({ ...filtres }, pageable) });
}

export function getLotChantier(id: UUID): Promise<LotDetailDto> {
  return request('GET', `/api/chantier/lots/${id}`);
}

export function getBordereauLot(id: UUID): Promise<BordereauDto> {
  return request('GET', `/api/chantier/lots/${id}/bordereau`);
}

export function listDecomptesLot(id: UUID): Promise<DecompteListItemDto[]> {
  return request('GET', `/api/chantier/lots/${id}/decomptes`);
}

export interface FiltresDecomptesChantier {
  projetId?: UUID;
  lotId?: UUID;
  fournisseurId?: UUID;
  /** `YYYY-MM-DD`, bornes incluses. */
  du?: string;
  au?: string;
  statutFactureId?: UUID;
  /** `true` = seulement les non facturés ; absent = pas de filtre. */
  sansFacture?: boolean;
  search?: string;
}

/** Tri admis : dateDocument, code, numero, montantHT, montantTTC, netAPayer, lotCode, projetCode, fournisseurNom. */
export function listDecomptesChantier(
  filtres?: FiltresDecomptesChantier,
  pageable?: Pageable,
): Promise<PageDto<DecompteListItemDto>> {
  return request('GET', '/api/chantier/decomptes', { query: withPageable({ ...filtres }, pageable) });
}

export function getDecompteChantier(id: UUID): Promise<DecompteDetailDto> {
  return request('GET', `/api/chantier/decomptes/${id}`);
}

export function getTranche(id: UUID): Promise<TrancheDetailDto> {
  return request('GET', `/api/tranches/${id}`);
}

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

/** `statut` absent : DISPONIBLE **et** OCCUPE, contrairement à `listTrancheArticles`. */
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

/** `search` : code, libellé, entité, ville, casse ignorée, côté serveur. */
export function listProjets(pageable?: Pageable, params?: { search?: string }): Promise<PageDto<ProjetListItemDto>> {
  return request('GET', '/api/projets', { query: withPageable(params, pageable) });
}

/** Corps de création pré-rempli depuis l'entité (code et libellé compris) ; ne crée rien. 404 entité inconnue. */
export function getDefautsEntiteProjet(entiteId: UUID): Promise<ProjetEcritureDto> {
  return request('GET', `/api/projets/defauts-entite/${entiteId}`);
}

/** Administrateur. 409 (message à afficher) tant qu'une tranche, un article… référence le programme. */
export function deleteProjet(id: UUID): Promise<void> {
  return request('DELETE', `/api/projets/${id}`);
}

export function listZonesProjet(projetId: UUID): Promise<ZoneProjetDto[]> {
  return request('GET', `/api/projets/${projetId}/zones`);
}

/** Administrateur. 409 : code déjà pris par une zone sœur. */
export function createZoneProjet(projetId: UUID, body: ZoneProjetEcritureDto): Promise<ZoneProjetDto> {
  return request('POST', `/api/projets/${projetId}/zones`, { body });
}

export function updateZoneProjet(projetId: UUID, zoneId: UUID, body: ZoneProjetEcritureDto): Promise<ZoneProjetDto> {
  return request('PATCH', `/api/projets/${projetId}/zones/${zoneId}`, { body });
}

/** 409 si la zone a des sous-zones ou une réclamation SAV. */
export function deleteZoneProjet(projetId: UUID, zoneId: UUID): Promise<void> {
  return request('DELETE', `/api/projets/${projetId}/zones/${zoneId}`);
}

export function getProjet(id: UUID): Promise<ProjetDetailDto> {
  return request('GET', `/api/projets/${id}`);
}

export function listProjetTranches(projetId: UUID, pageable?: Pageable): Promise<PageDto<TrancheListItemDto>> {
  return request('GET', `/api/projets/${projetId}/tranches`, { query: withPageable(undefined, pageable) });
}

export function listTranches(
  params?: { projetId?: UUID; search?: string },
  pageable?: Pageable,
  /** Un nom hors catalogue renvoie 400 ; `id` est servi qu'on le demande ou non. */
  options?: { colonnes?: string[] },
): Promise<PageDto<TrancheListItemDto>> {
  const query: Record<string, QueryValue> = withPageable(params, pageable);
  if (options?.colonnes && options.colonnes.length > 0) query.colonnes = options.colonnes;
  return request('GET', '/api/tranches', { query });
}

export function getColonnesTranches(): Promise<ColonneDto[]> {
  return request('GET', '/api/tranches/colonnes');
}

type ReferentielPatrimoine =
  | 'standings'
  | 'niveaux-terrain'
  | 'rubriques-tranche'
  | 'personnels'
  | 'plans-comptables'
  | 'tiers-autrui';

/** Listes des fiches programme et tranche (`/api/referentiels-patrimoine/…`). */
export function getReferentielPatrimoine(ressource: ReferentielPatrimoine): Promise<ReferentielItemDto[]> {
  return request('GET', `/api/referentiels-patrimoine/${ressource}`);
}

/** Projets de travaux proposés comme « Projet de facturation » ; `entiteId` absent = tous. */
export function getProjetsFacturation(entiteId?: UUID): Promise<ReferentielItemDto[]> {
  return request('GET', '/api/referentiels-patrimoine/projets-facturation', { query: { entiteId } });
}

/** Administrateur seulement (403 sinon). 409 : code déjà pris, sur toute la table. */
export function createProjet(body: ProjetEcritureDto): Promise<ProjetDetailDto> {
  return request('POST', '/api/projets', { body });
}

export function updateProjet(id: UUID, body: ProjetEcritureDto): Promise<ProjetDetailDto> {
  return request('PATCH', `/api/projets/${id}`, { body });
}

// ---------------------------------------------------------------- Entités juridiques (FEATURE-entites-juridiques.md)

export type FiltreActif = 'true' | 'false' | 'tous';

/** Entités où l'utilisateur est habilité (toutes pour un administrateur), actives ou non. */
export function listEntitesJuridiques(params: { actif?: FiltreActif; search?: string }): Promise<EntiteJuridiqueDto[]> {
  return request('GET', '/api/entites-juridiques', { query: params });
}

/** Fiche complète, répartition comprise ; 404 hors habilitation. */
export function getEntiteJuridique(id: UUID): Promise<EntiteJuridiqueDto> {
  return request('GET', `/api/entites-juridiques/${id}`);
}

export function listDevises(): Promise<DeviseDto[]> {
  return request('GET', '/api/entites-juridiques/devises');
}

/** Administrateur. 409 : code déjà pris ; 400 sur `nombreActionnaires` / `nombreParts` si la répartition ne suit pas. */
export function createEntiteJuridique(body: EntiteJuridiqueEcritureDto): Promise<EntiteJuridiqueDto> {
  return request('POST', '/api/entites-juridiques', { body });
}

/** Administrateur. `actif` modifiable : effet immédiat sur tout le CRM. */
export function updateEntiteJuridique(id: UUID, body: EntiteJuridiqueEcritureDto): Promise<EntiteJuridiqueDto> {
  return request('PATCH', `/api/entites-juridiques/${id}`, { body });
}

/** Administrateur. 409 (message à afficher) tant qu'un programme, un tiers, un règlement… référence l'entité. */
export function deleteEntiteJuridique(id: UUID): Promise<void> {
  return request('DELETE', `/api/entites-juridiques/${id}`);
}

/** Administrateur. Enregistre le groupe et `nombreParts` (absent = celui enregistré), recalcule la répartition dessus. */
export function chargerRepartitionDepuisGroupe(id: UUID, groupeId: UUID, nombreParts?: number): Promise<EntiteJuridiqueDto> {
  return request('POST', `/api/entites-juridiques/${id}/repartition/depuis-groupe/${groupeId}`, { query: { nombreParts } });
}

export function listActionnaires(): Promise<ActionnaireDto[]> {
  return request('GET', '/api/actionnaires');
}

export function listGroupesActionnaires(): Promise<GroupeActionnairesDto[]> {
  return request('GET', '/api/groupes-actionnaires');
}

/** Administrateur seulement. Code unique sur toute la table, pas par programme. */
export function createTranche(body: TrancheEcritureDto): Promise<TrancheDetailDto> {
  return request('POST', '/api/tranches', { body });
}

/** `projetId` différent de l'actuel : 400. */
export function updateTranche(id: UUID, body: TrancheEcritureDto): Promise<TrancheDetailDto> {
  return request('PATCH', `/api/tranches/${id}`, { body });
}

/** Administrateur. 409 : le `detail` liste les tables qui référencent la tranche. */
export function deleteTranche(id: UUID): Promise<void> {
  return request('DELETE', `/api/tranches/${id}`);
}

export function listTerrainsTranche(id: UUID): Promise<TerrainTrancheDto[]> {
  return request('GET', `/api/tranches/${id}/terrains`);
}

/** Administrateur. 400 : `champ` = `lignes[i].<champ>`. */
export function saveTerrainsTranche(id: UUID, lignes: TerrainTrancheEcritureDto[]): Promise<TerrainTrancheDto[]> {
  return request('PUT', `/api/tranches/${id}/terrains`, { body: { lignes } satisfies LignesTrancheDto<TerrainTrancheEcritureDto> });
}

export function getTerrainsDisponibles(): Promise<TerrainDisponibleDto[]> {
  return request('GET', '/api/tranches/terrains-disponibles');
}

export function listEtagesTranche(id: UUID): Promise<EtageTrancheDto[]> {
  return request('GET', `/api/tranches/${id}/etages`);
}

export function saveEtagesTranche(id: UUID, lignes: EtageTrancheEcritureDto[]): Promise<EtageTrancheDto[]> {
  return request('PUT', `/api/tranches/${id}/etages`, { body: { lignes } satisfies LignesTrancheDto<EtageTrancheEcritureDto> });
}

export function listPlancherCouvert(id: UUID): Promise<PlancherCouvertDto[]> {
  return request('GET', `/api/tranches/${id}/plancher-couvert`);
}

/** Réécrit aussi le plancher couvert de la fiche (Σ des surfaces). */
export function savePlancherCouvert(id: UUID, lignes: PlancherCouvertEcritureDto[]): Promise<PlancherCouvertDto[]> {
  return request('PUT', `/api/tranches/${id}/plancher-couvert`, { body: { lignes } satisfies LignesTrancheDto<PlancherCouvertEcritureDto> });
}

export function listFraisTranche(id: UUID): Promise<FraisTrancheDto[]> {
  return request('GET', `/api/tranches/${id}/frais`);
}

export function saveFraisTranche(id: UUID, lignes: FraisTrancheEcritureDto[]): Promise<FraisTrancheDto[]> {
  return request('PUT', `/api/tranches/${id}/frais`, { body: { lignes } satisfies LignesTrancheDto<FraisTrancheEcritureDto> });
}

export function getCategoriesFrais(): Promise<ReferentielItemDto[]> {
  return request('GET', '/api/tranches/categories-frais');
}

/** Administrateur seulement. Code unique dans la tranche ; prix stockés calculés par le serveur. */
export function createArticle(body: ArticleEcritureDto): Promise<ArticleDetailDto> {
  return request('POST', '/api/articles', { body });
}

/** 409 si l'article est occupé et que la demande change un champ protégé (prix, surfaces, classification). */
export function updateArticle(id: UUID, body: ArticleEcritureDto): Promise<ArticleDetailDto> {
  return request('PATCH', `/api/articles/${id}`, { body });
}

/** Renvoie la fiche du sous-article créé, rattaché à `articleId`. */
export function createSousArticle(articleId: UUID, body: SousArticleEcritureDto): Promise<ArticleDetailDto> {
  return request('POST', `/api/articles/${articleId}/sous-articles`, { body });
}

/** Renvoie la fiche de l'article parent, prix de vente recalculé. */
export function affecterSousArticle(articleId: UUID, sousArticleId: UUID, body: AffectationSousArticleDto): Promise<ArticleDetailDto> {
  return request('POST', `/api/articles/${articleId}/sous-articles/${sousArticleId}/affecter`, { body });
}

export function desaffecterSousArticle(articleId: UUID, sousArticleId: UUID): Promise<ArticleDetailDto> {
  return request('POST', `/api/articles/${articleId}/sous-articles/${sousArticleId}/desaffecter`);
}

export function listSousArticlesLibres(trancheId: UUID, pageable?: Pageable): Promise<PageDto<ArticleListItemDto>> {
  return request('GET', `/api/tranches/${trancheId}/sous-articles-libres`, { query: withPageable(undefined, pageable) });
}

// --- Audit, actions d'article, notes (FEATURE-patrimoine-audit-actions.md) ---

/** Lignes de l'objet **et** de ses lignes enfants, plus récentes d'abord. Pas de `sort` : ordre fixé par le serveur. */
export function listAudit(objetId: UUID, page = 0, size = 50): Promise<PageDto<LigneAuditDto>> {
  return request('GET', '/api/audit', { query: { objetId, page, size } });
}

/** Lignes au format du suivi des actions (colonnes par défaut). */
export function listActionsArticle(articleId: UUID, pageable?: Pageable): Promise<PageDto<SuiviActionDto>> {
  return request('GET', `/api/articles/${articleId}/actions`, { query: withPageable(undefined, pageable) });
}

/** Administrateur. Mêmes règles GEN0005 qu'une interaction de prospection. */
export function createActionArticle(articleId: UUID, body: CreerInteractionRequest): Promise<SuiviActionDto> {
  return request('POST', `/api/articles/${articleId}/actions`, { body });
}

export function listNotes(porteur: PorteurNote, id: UUID): Promise<NoteDto[]> {
  return request('GET', '/api/notes', { query: { porteur, id } });
}

/** Administrateur. 400 `champ = texteHtml` (« veuillez saisir une note ! ») si la note est vide une fois assainie. */
export function createNote(body: CreerNoteRequest): Promise<NoteDto> {
  return request('POST', '/api/notes', { body });
}

export function deleteNote(id: UUID): Promise<void> {
  return request('DELETE', `/api/notes/${id}`);
}

export const getImmeubles = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/immeubles');

/** Nature Bâtiment, filtrées sur « Pour les sous articles ». */
export function getCategoriesClassement(pourSousArticle: boolean): Promise<ReferentielItemDto[]> {
  return request('GET', '/api/referentiels/categories-bien', { query: { pourSousArticle } });
}

export function getTypesClassement(pourSousArticle: boolean): Promise<ReferentielItemDto[]> {
  return request('GET', '/api/referentiels/types-bien', { query: { pourSousArticle } });
}

/** Sans la vocation PROJET (réservée aux terrains). */
export const getVocationsArticle = (): Promise<ReferentielItemDto[]> =>
  request('GET', '/api/referentiels/vocations', { query: { pourArticle: true } });

/** Nom du champ du corps en faute, porté par les 400/409 des écritures patrimoine. */
export function champEnErreur(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  const champ = err.problem?.champ;
  return typeof champ === 'string' ? champ : null;
}

export function getArticle(id: UUID): Promise<ArticleDetailDto> {
  return request('GET', `/api/articles/${id}`);
}

export function getProjetsReferentiel(): Promise<ReferentielItemDto[]> {
  return request('GET', '/api/referentiels/projets');
}

export function getTranchesReferentiel(projetId?: UUID): Promise<ReferentielItemDto[]> {
  return request('GET', '/api/referentiels/tranches', { query: { projetId } });
}

export interface ArticleReferentielFilters {
  statut?: ArticleStatut;
  categorieId?: UUID[];
  typeId?: UUID[];
}

/** `statut` absent : DISPONIBLE seul. */
export function getArticlesReferentiel(trancheId: UUID, filters?: ArticleReferentielFilters): Promise<ArticleListItemDto[]> {
  return request('GET', '/api/referentiels/articles', { query: { trancheId, ...filters } });
}

export function getSousArticlesReferentiel(articleId: UUID, filters?: ArticleReferentielFilters): Promise<ArticleListItemDto[]> {
  return request('GET', '/api/referentiels/sous-articles', { query: { articleId, ...filters } });
}

/** `trancheId` réservé aux administrateurs (403 sinon) ; une tranche inconnue rend des zéros. */
export function getDashboard(params?: { trancheId?: UUID }): Promise<DashboardDto> {
  return request('GET', '/api/dashboard', { query: { trancheId: params?.trancheId } });
}

/** Les trois blocs ne se somment pas : `echeancier` est du dû, `encaissements` du
 * réalisé, `ventesConcretisees` un sous-ensemble. Des mois futurs sont renseignés :
 * ne pas arrêter la courbe au mois courant. */
export function getSyntheseAnnuelle(annee?: number, trancheId?: UUID): Promise<SyntheseAnnuelleDto> {
  // `trancheId` : réservé aux administrateurs (403 sinon).
  return request('GET', '/api/dashboard/annuel', { query: { annee, trancheId } });
}

/** `RETARD` est borné à 30 jours glissants : ce n'est pas le compte des relances en
 * retard, l'écran doit le dire. Les relances non affectées (`nonAffectee`) sont
 * servies quelle que soit la portée, `MOI` compris. */
export function listRelancesDashboard(
  /** `trancheId` réservé aux administrateurs (403 sinon). */
  params?: { echeance?: EcheanceRelance; portee?: PorteeRelance; trancheId?: UUID },
  pageable?: Pageable,
): Promise<PageDto<RelanceProspectionDto>> {
  return request('GET', '/api/dashboard/relances', {
    query: withPageable(
      { echeance: params?.echeance, portee: params?.portee, trancheId: params?.trancheId },
      pageable,
    ),
  });
}

/** `jour` est une date seule : `todayISO()`, pas `toApiDateTime()`. Une page vide
 * est le cas courant (injection par rafales), pas une panne.
 * @public endpoint servi, pas encore branché sur un écran */
export function listNouveauxPreProspects(
  jour?: string,
  pageable?: Pageable,
): Promise<PageDto<NouveauPreProspectDto>> {
  return request('GET', '/api/dashboard/nouveaux-pre-prospects', {
    query: withPageable({ jour }, pageable),
  });
}

export function listCommerciaux(pageable?: Pageable): Promise<PageDto<CommercialListItemDto>> {
  return request('GET', '/api/commerciaux', { query: withPageable(undefined, pageable) });
}

/** Exactement un des deux, sinon 400 : l'union l'impose à l'appelant. */
export type CritereHotline = { telephone: string } | { nom: string };

/** Par nom : 2 caractères minimum (400) et plafond de fiches, `tronque` doit être
 * montré à l'agent. Jamais 404 : sans correspondance, 200 avec `connu: false`. */
export function rechercherHotline(critere: CritereHotline): Promise<HotlineResultDto> {
  return request('GET', '/api/hotline/recherche', { query: { ...critere } });
}

/** `debut`/`fin` en date-heure ISO (`toApiDateTime`), sinon 400 ; 400 aussi si fin < debut. */
export function getEvenementsCalendrier(debut: string, fin: string): Promise<EvenementCalendrierDto[]> {
  return request('GET', '/api/calendrier/evenements', { query: { debut, fin } });
}

/** Curseur composite `avant` = date et `avantId` = id de la dernière ligne : la date
 * seule perdrait les actions de même date. `limite` 1–100, sinon 400. */
export function listActionsRecentes(
  portee: PorteeActionsRecentes,
  limite?: number,
  apres?: Pick<ActionRecente, 'date' | 'id'>,
): Promise<ActionRecente[]> {
  return request('GET', '/api/actions-recentes', {
    query: { portee, limite, avant: apres?.date, avantId: apres?.id },
  });
}

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
// Distinct de modes-paiement : StlSettlementType, pas ComPaymentMethod.
export const getTypesReglement = (): Promise<TypeReglementDto[]> => request('GET', '/api/referentiels/types-reglement');
export const getBanques = (): Promise<ReferentielItemDto[]> => request('GET', '/api/referentiels/banques');
export const getResultatsInteraction = (): Promise<ResultatInteractionDto[]> => request('GET', '/api/referentiels/resultats-interaction');

/** @public endpoint servi, pas encore branché sur un écran */
export function getVillesReferentiel(
  params?: { paysId?: UUID; search?: string },
  pageable?: Pageable,
): Promise<PageDto<VilleDto>> {
  return request('GET', '/api/referentiels/villes', { query: withPageable(params, pageable) });
}

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

export function listUtilisateurs(
  params?: { search?: string; disabled?: boolean },
  pageable?: Pageable,
): Promise<PageDto<UtilisateurListItemDto>> {
  return request('GET', '/api/utilisateurs', { query: withPageable(params, pageable) });
}

/** Mot de passe renvoyé une seule fois ; `email` sert à cet envoi, jamais enregistré. */
export function reinitialiserMotDePasse(admUserId: UUID, email?: string): Promise<ReinitialiserMotDePasseResponse> {
  const body: ReinitialiserMotDePasseRequest = email?.trim() ? { email: email.trim() } : {};
  return request('POST', `/api/utilisateurs/${admUserId}/reinitialiser-mot-de-passe`, { body });
}

export function listClesApi(): Promise<CleApiDto[]> {
  return request('GET', '/api/cles-api');
}

/** Le secret n'est renvoyé qu'une fois, dans `cle`. */
export function creerCleApi(body: CreerCleApiRequest): Promise<CleApiCreeeDto> {
  return request('POST', '/api/cles-api', { body });
}

/** 409 sur une clé révoquée : en créer une nouvelle. */
export function regenererCleApi(id: UUID): Promise<CleApiCreeeDto> {
  return request('POST', `/api/cles-api/${id}/regenerer`);
}

export function revoquerCleApi(id: UUID): Promise<void> {
  return request('DELETE', `/api/cles-api/${id}`);
}

/** Périmètre brut, pas effectif : un compte exempté peut avoir une liste non vide
 * sans être filtré. */
export function getProjetsUtilisateur(admUserId: UUID): Promise<ProjetPerimetreDto[]> {
  return request('GET', `/api/utilisateurs/${admUserId}/projets`);
}

/** Remplacement intégral, pas un delta ; liste vide = aucune restriction. `projetIds`
 * toujours un tableau : absent, 400. */
export function remplacerProjetsUtilisateur(admUserId: UUID, projetIds: UUID[]): Promise<ProjetPerimetreDto[]> {
  const body: AffecterProjetsRequest = { projetIds };
  return request('PUT', `/api/utilisateurs/${admUserId}/projets`, { body });
}

// KPI : `du`/`au` sont des dates nues (`YYYY-MM-DD`), pas des date-time : un suffixe
// `T00:00:00` comme sur les listes rend 400.

/** Seuls les commerciaux actifs sur la période : ne pas présenter la liste comme
 * l'effectif complet. 403 hors Administrateur. */
export function listPerformancesCommerciaux(params?: { du?: string; au?: string }): Promise<PerformanceCommercialDto[]> {
  return request('GET', '/api/kpi/commerciaux', { query: { du: params?.du, au: params?.au } });
}

/** 200 à zéro n'est pas un état vide ; 404 = compte non rattaché à un employé,
 * à afficher avec son propre message. */
export function getMesPerformances(params?: { du?: string; au?: string }): Promise<PerformanceCommercialDto> {
  return request('GET', '/api/kpi/commerciaux/moi', { query: { du: params?.du, au: params?.au } });
}

/** Synchrone ; 409 si un cycle tourne déjà. Les caches sont vidés, mais l'appelant
 * doit lancer `refetchAllApis()` pour que les pages montées relisent. */
export function declencherSynchronisation(): Promise<SynchronisationResultatDto> {
  return request('POST', '/api/synchronisation');
}
