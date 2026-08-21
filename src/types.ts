// Shapes mirror the real backend's OpenAPI contract — docs/api-docsV0.json
// (Spring Boot API, base url configured via VITE_API_BASE_URL). Field names
// are kept exactly as the DTOs define them (French, camelCase) so the app
// never needs a translation layer between what the wire sends and what the
// UI reads.

export type UUID = string;

// ---------------------------------------------------------------------------
// Prospect (fiche contact)
// ---------------------------------------------------------------------------

export interface ProspectListItemDto {
  id: UUID;
  code?: string;
  prenom?: string;
  nom?: string;
  raisonSociale?: string;
  telephone?: string;
  mobile?: string;
  email?: string;
  ville?: string;
  type?: string;
}

// A "client" isn't a tier-type — it's anyone who is the clientId of at
// least one dossier de vente. GET /api/clients (V4) aggregates that
// server-side (nbDossiers/totalAPayer/totalRegle/totalReste), which no
// front-end computation could do honestly without one call per row.
export interface ClientListItemDto {
  id: UUID;
  code?: string;
  nomAffiche?: string;
  mobile?: string;
  telephone?: string;
  email?: string;
  ville?: string;
  nbDossiers?: number;
  totalAPayer?: number;
  totalRegle?: number;
  totalReste?: number;
}

export interface PieceIdentiteRequest {
  typeId?: UUID;
  numero?: string;
  delivreeLe?: string | null;
  lieuDelivrance?: string;
  valideJusquau?: string | null;
  lieuValidite?: string;
}

export interface PieceIdentiteDto {
  typeId?: UUID;
  type?: string;
  numero?: string;
  delivreeLe?: string | null;
  lieuDelivrance?: string;
  valideJusquau?: string | null;
  lieuValidite?: string;
}

export interface ProspectDetailDto {
  id: UUID;
  code?: string;
  prenom?: string;
  nom?: string;
  raisonSociale?: string;
  telephone?: string;
  telephone1?: string;
  telephone2?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  siteWeb?: string;
  adresse?: string;
  adresse2?: string;
  adresse3?: string;
  codePostal?: string;
  ville?: string;
  dateNaissance?: string | null;
  lieuNaissance?: string;
  nombreEnfants?: number;
  profession?: string;
  notes?: string;
  ice?: string;
  estAncienClient?: boolean;
  typeId?: UUID;
  type?: string;
  kindId?: UUID;
  kind?: string;
  commercialId?: UUID;
  commercialNom?: string;
  titreId?: UUID;
  titre?: string;
  sexeId?: UUID;
  sexe?: string;
  paysResidenceId?: UUID;
  paysResidence?: string;
  paysId?: UUID;
  pays?: string;
  nationaliteId?: UUID;
  nationalite?: string;
  situationFamilialeId?: UUID;
  situationFamiliale?: string;
  typeResidenceId?: UUID;
  typeResidence?: string;
  regimeMatrimonialId?: UUID;
  regimeMatrimonial?: string;
  professionId?: UUID;
  salaireId?: UUID;
  salaire?: string;
  employeur?: string;
  anciennete?: number;
  filsDe?: string;
  etDe?: string;
  pieceIdentite?: PieceIdentiteDto;
}

export interface CreerProspectRequest {
  prenom?: string;
  nom?: string;
  raisonSociale?: string;
  telephone?: string;
  mobile?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  dateNaissance?: string | null;
  lieuNaissance?: string;
  nombreEnfants?: number;
  typeId?: UUID;
  kindId?: UUID;
  commercialId?: UUID;
  titreId?: UUID;
  sexeId?: UUID;
  paysResidenceId?: UUID;
  paysId?: UUID;
  nationaliteId?: UUID;
  situationFamilialeId?: UUID;
  typeResidenceId?: UUID;
  regimeMatrimonialId?: UUID;
  professionId?: UUID;
  salaireId?: UUID;
  employeur?: string;
  anciennete?: number;
  filsDe?: string;
  etDe?: string;
  adresse2?: string;
  adresse3?: string;
  pieceIdentite?: PieceIdentiteRequest;
}

export type ModifierProspectRequest = CreerProspectRequest;

// A prospect's own contact book (contacts personnels — e.g. spouse, agent) —
// each entry links to another Prospect record by id, tagged with a relation
// type (référentiel types-relation-contact).
export interface CreerContactProspectRequest {
  contactProspectId: UUID;
  relationTypeId?: UUID;
}

export interface ContactProspectDto {
  id: UUID;
  contactProspectId?: UUID;
  nomContact?: string;
  telephoneContact?: string;
  relationTypeId?: UUID;
  relationType?: string;
}

export interface ReglementProspectDto {
  id: UUID;
  code?: string;
  dateDocument?: string | null;
  dateReglement?: string | null;
  montant?: number;
  type?: string;
  dossierId?: UUID;
  dossierCode?: string;
}

export interface HistoriqueDto {
  id: UUID;
  date?: string | null;
  description?: string;
  utilisateur?: string;
  workflowDescription?: string;
  statutDescription?: string;
}

// One traceability event on a dossier's timeline, from GET
// /api/dossiers/{id}/historique (V4) — unlike HistoriqueDto above (prospects)
// it carries no id, just a `type` label (e.g. changement de statut) and a
// free-text `description`.
export interface HistoriqueEvenementDto {
  date?: string | null;
  type?: string;
  utilisateur?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Prospection / Pré-prospection
// ---------------------------------------------------------------------------

export interface ProspectionListItemDto {
  id: UUID;
  code?: string;
  dateDocument?: string | null;
  /** Free-text lead description captured before a Prospect record exists
   * (pré-prospection). Replaces the old displayName/phone/email trio. */
  tempDescription?: string;
  prospectId?: UUID;
  prospectNom?: string;
  commercialId?: UUID;
  commercialNom?: string;
  origine?: string;
  etape?: string;
  fermee?: boolean;
  prix?: number;
  surface?: number;
}

export interface ProspectionDetailDto {
  id: UUID;
  code?: string;
  dateDocument?: string | null;
  tempDescription?: string;
  tempTel?: string;
  tempEmail?: string;
  prospectId?: UUID;
  prospectNom?: string;
  commercialId?: UUID;
  commercialNom?: string;
  proposeurId?: UUID;
  proposeurNom?: string;
  origineId?: UUID;
  origine?: string;
  origineSupportId?: UUID;
  origineSupport?: string;
  etapeId?: UUID;
  etape?: string;
  vocationId?: UUID;
  vocation?: string;
  typeContactId?: UUID;
  typeContact?: string;
  actionCommercialeId?: UUID;
  actionCommerciale?: string;
  notes?: string;
  surface?: number;
  surfaceJusqua?: number;
  prix?: number;
  prixJusqua?: number;
  avance?: number;
  financementFondsPropres?: number;
  financementCredit?: number;
  financementAutre?: number;
  fermee?: boolean;
  dateFermeture?: string | null;
  raisonFermetureId?: UUID;
  raisonFermeture?: string;
  raisonFermetureTexte?: string;
  ancienClient?: boolean;
  trancheId?: UUID;
  articleId?: UUID;
}

export interface TransformerProspectionRequest {
  commercialId?: UUID;
}

/** General-purpose PATCH for a Prospection's editable fields — supersedes
 * hand-editing individual fields client-side; origine/support/vocation/
 * typeContact/actionCommerciale are all référentiel-backed UUID pickers. */
export interface ModifierProspectionRequest {
  origineId?: UUID;
  origineSupportId?: UUID;
  vocationId?: UUID;
  typeContactId?: UUID;
  actionCommercialeId?: UUID;
  surface?: number;
  surfaceJusqua?: number;
  prix?: number;
  prixJusqua?: number;
  avance?: number;
  financementFondsPropres?: number;
  financementCredit?: number;
  financementAutre?: number;
  notes?: string;
  trancheId?: UUID;
  articleId?: UUID;
}

export interface ChangerEtapeRequest {
  etapeId: UUID;
  note?: string;
}

export interface ArchiverProspectionRequest {
  raisonId?: UUID;
  raisonTexte?: string;
}

// --- Prospection sub-collections (each a simple {id, xxxId, xxx} link row,
// with a matching Ajouter*Request to add one and a DELETE by itemId) ---

export interface AjouterVilleRequest {
  villeId: UUID;
}
export interface ProspectionVilleDto {
  id: UUID;
  villeId?: UUID;
  ville?: string;
}

export interface AjouterTypeBienRequest {
  typeBienId: UUID;
}
export interface ProspectionTypeBienDto {
  id: UUID;
  typeBienId?: UUID;
  typeBien?: string;
}

export interface AjouterProfilRequest {
  profilId: UUID;
}
export interface ProspectionProfilDto {
  id: UUID;
  profilId?: UUID;
  profil?: string;
  categorieId?: UUID;
  categorie?: string;
}

export interface AjouterCategorieRequest {
  categorieId: UUID;
}
export interface ProspectionCategorieDto {
  id: UUID;
  categorieId?: UUID;
  categorie?: string;
}

export interface AjouterAutreTrancheRequest {
  trancheId?: UUID;
  articleId?: UUID;
}
export interface ProspectionAutreTrancheDto {
  id: UUID;
  trancheId?: UUID;
  tranche?: string;
  articleId?: UUID;
  article?: string;
}

export interface CreerDevisRequest {
  trancheId?: UUID;
  articleId?: UUID;
  prix?: number;
  notes?: string;
}

export interface DevisDto {
  id: UUID;
  code?: string;
  dateDocument?: string | null;
  trancheId?: UUID;
  tranche?: string;
  articleId?: UUID;
  article?: string;
  prospectId?: UUID;
  prix?: number;
  notes?: string;
}

export interface CreerInteractionRequest {
  description: string;
  entrante?: boolean;
  /** Nature de l'interaction (Instruction, Mail entrant/Sortant, Message
   * entrant/sortant, Note, Téléphone entrant/Sortant, Visite, WEB).
   * Référentiel : GET /api/referentiels/types-contact-prospection. */
  actionTypeId?: UUID;
  /** Référentiel : GET /api/referentiels/resultats-interaction. Si le
   * résultat choisi a necessiteDateRdv=true, dateRdv devient obligatoire. */
  resultatId?: UUID;
  /** format: date-time — fin de validité de la relance/alerte. */
  dateAlerte?: string;
  /** format: date-time — obligatoire si resultatId.necessiteDateRdv. */
  dateRdv?: string;
}

export interface InteractionDto {
  id: UUID;
  date?: string | null;
  description?: string;
  entrante?: boolean;
  employeId?: UUID;
  employeNom?: string;
  actionTypeId?: UUID | null;
  actionType?: string | null;
  resultatId?: UUID | null;
  resultat?: string | null;
  dateAlerte?: string | null;
  dateRdv?: string | null;
}

/** GET /api/referentiels/resultats-interaction — un résultat possible pour
 * une interaction, avec les indications nécessaires pour adapter le
 * formulaire (afficher le sélecteur de date de RDV, suggérer une alerte)
 * sans coder les libellés métier en dur côté front. */
export interface ResultatInteractionDto {
  id: UUID;
  code?: string;
  description?: string;
  necessiteDateRdv?: boolean;
  alerteRecommandee?: boolean;
}

// ---------------------------------------------------------------------------
// Dossier de vente
// ---------------------------------------------------------------------------

export interface ArticleSummaryDto {
  id: UUID;
  code?: string;
  description?: string;
  area?: number;
  price?: number;
}

export interface DossierListItemDto {
  id: UUID;
  code?: string;
  dateDocument?: string | null;
  statut?: string;
  clientId?: UUID;
  clientNom?: string;
  commercialId?: UUID;
  commercialNom?: string;
  prix?: number;
  totalAPayer?: number;
}

export interface DossierDetailDto {
  id: UUID;
  code?: string;
  dateDocument?: string | null;
  statut?: string;
  etapesAtteignables?: string[];
  clientId?: UUID;
  clientNom?: string;
  commercialId?: UUID;
  commercialNom?: string;
  avocatId?: UUID;
  avocatNom?: string;
  articles?: ArticleSummaryDto[];
  prixAvantRemise?: number;
  remise?: number;
  remiseMontant?: number;
  prixApresRemise?: number;
  prix?: number;
  montantAvance?: number;
  totalAPayer?: number;
  notes?: string;
  probabiliteFinalisation?: number;
  modePaie?: string;
}

export interface CreerDossierRequest {
  prospectionId: UUID;
  articleIds: UUID[];
  prix?: number;
  notes?: string;
  /** Both added in api-docsV2 — the backend rejects the request without
   * them (no `required` marker in the OpenAPI schema itself, but a 400
   * comes back if either is missing). No référentiel endpoint exists yet
   * for modes de paiement, so `modePaieId` has no lookup source in the UI. */
  modePaieId?: UUID;
  cin?: string;
}

export interface ChangerStatutRequest {
  statut: string;
  date?: string;
  note?: string;
}

// A reachable next statut for a dossier, from GET
// /api/dossiers/{id}/statut/etapes-suivantes (V4). `champDate` names the
// dossier date field that milestone is derived from (e.g. `agreementDate`),
// `libelleChampDate` its human label, and `confiance` how sure the backend
// is that the dossier is actually ready for that transition.
export interface EtapeSuivanteDto {
  statut: string;
  champDate?: string;
  libelleChampDate?: string;
  confiance?: string;
}

export interface EcheanceDto {
  id: UUID;
  code?: string;
  dateEcheance?: string | null;
  montant?: number;
  montantHT?: number;
  montantTTC?: number;
  tauxTVA?: number;
  description?: string;
  categorieId?: UUID;
  categorie?: string;
  exclureDuPrix?: boolean;
  notes?: string;
  montantRegle?: number;
  reste?: number;
  statutCalcule?: string;
}

export interface CreerEcheanceRequest {
  dateEcheance?: string | null;
  montant?: number;
  description?: string;
  categorieId?: UUID;
  exclureDuPrix?: boolean;
  notes?: string;
}

export type ModifierEcheanceRequest = CreerEcheanceRequest;

export interface ReglementDto {
  id: UUID;
  echeanceId?: UUID;
  dateDocument?: string | null;
  dateReglement?: string | null;
  montant?: number;
  type?: string;
  notes?: string;
}

export interface CreerReglementRequest {
  montant?: number;
  dateReglement?: string | null;
  typeId?: UUID;
  banqueId?: UUID;
  notes?: string;
}

export interface CategorieMontantDto {
  categorie?: string;
  montant?: number;
  nombreLignes?: number;
  regle?: number;
  reste?: number;
}

export interface MontantsDossierDto {
  parCategorie?: CategorieMontantDto[];
  totalGeneral?: number;
  totalSoumisReglePrixTTC?: number;
}

export interface PieceJointeDto {
  id: UUID;
  description?: string;
  extension?: string;
  dateCreation?: string | null;
}

// ---------------------------------------------------------------------------
// Tranche / Projet / Article
// ---------------------------------------------------------------------------

export interface TrancheListItemDto {
  id: UUID;
  code?: string;
  description?: string;
  ville?: string;
  dateLivraison?: string | null;
}

export interface TrancheDetailDto {
  id: UUID;
  projetId?: UUID;
  code?: string;
  description?: string;
  descriptionLongue?: string;
  adresse?: string;
  adresse2?: string;
  adresse3?: string;
  codePostal?: string;
  ville?: string;
  telephone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  siteWeb?: string;
  dateDebutTravaux?: string | null;
  dateFinTravaux?: string | null;
  dateDebutCommercialisation?: string | null;
  dateFinCommercialisation?: string | null;
  dateLivraison?: string | null;
  estEnVente?: boolean;
  estEnLocation?: boolean;
  tauxPenaliteAnnulation?: number;
  tauxPenaliteAnnulationRemise?: number;
  penaliteTransfertArticle?: number;
  penaliteTransfertArticleRemise?: number;
  penaliteTransfertTranche?: number;
  penaliteTransfertTrancheRemise?: number;
  penaliteTransfertClient?: number;
  penaliteTransfertClientRemise?: number;
  tauxPenalitePremierEngagement?: number;
  tauxPenaliteDeuxiemeEngagement?: number;
  delaiGarantie?: number;
  delaiGarantieSupplement?: number;
  delaiPremierEngagement?: number;
  delaiDeuxiemeEngagement?: number;
  delaiSoldePaiement?: number;
  delaiNotaireMinutes?: number;
  delaiToutSoldeMinutes?: number;
  delaiRetractation?: number;
  delaiMinimumIntervention?: number;
  delaiMaxEcheance?: number;
  advancePercent?: number;
  concretisationPercent?: number;
  maxVisitNumber?: number;
  isWithVerifCredit?: boolean;
  creditPercent?: number;
}

export type ArticleStatut = 'DISPONIBLE' | 'OCCUPE';

export interface ArticleListItemDto {
  id: UUID;
  code?: string;
  description?: string;
  area?: number;
  salePrice?: number;
  comSalePrice?: number;
  statut?: ArticleStatut;
  titreFoncier?: string;
  categorie?: string;
  type?: string;
}

export interface ArticleDetailDto {
  id: UUID;
  code?: string;
  description?: string;
  adresse?: string;
  area?: number;
  salePrice?: number;
  comSalePrice?: number;
  statut?: ArticleStatut;
  trancheId?: UUID;
  lotParentId?: UUID;
  sousLots?: ArticleListItemDto[];
  titreFoncier?: string;
  categorie?: string;
  type?: string;
}

export interface ProjetListItemDto {
  id: UUID;
  code?: string;
  description?: string;
  ville?: string;
}

export interface ProjetDetailDto {
  id: UUID;
  code?: string;
  description?: string;
  descriptionLongue?: string;
  adresse?: string;
  adresse2?: string;
  adresse3?: string;
  codePostal?: string;
  ville?: string;
  villeSignature?: string;
  telephone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  siteWeb?: string;
  dateDebutTravaux?: string | null;
  dateFinTravaux?: string | null;
  dateDebutCommercialisation?: string | null;
  dateFinCommercialisation?: string | null;
}

// ---------------------------------------------------------------------------
// Dashboard / Commercial
// ---------------------------------------------------------------------------

export interface EtapeCountDto {
  etape?: string;
  nombre?: number;
}

export interface RelanceDto {
  dossierId: UUID;
  clientNom?: string;
  dateEcheance?: string | null;
  joursRetard?: number;
}

export interface DashboardDto {
  valeurPipeline?: number;
  panierMoyen?: number;
  dossiersParEtape?: EtapeCountDto[];
  relancesEnRetard?: RelanceDto[];
  prospectionsOuvertes?: number;
  prospectionsTotal?: number;
}

export interface CommercialListItemDto {
  id: UUID;
  code?: string;
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  kind?: string;
}

// ---------------------------------------------------------------------------
// Pagination — every list endpoint now requires a `pageable` param
// (page/size/sort, 0-indexed) and returns a PageDto wrapper instead of a
// bare array.
// ---------------------------------------------------------------------------

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string[];
}

export interface PageDto<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Référentiels — lookup tables for every UUID foreign key used across the
// forms above (/api/referentiels/*). Most are the plain {id, code,
// description, sorting} shape; a handful carry extra fields.
// ---------------------------------------------------------------------------

export interface ReferentielItemDto {
  id: UUID;
  code?: string;
  description?: string;
  sorting?: number;
}

export interface VilleDto {
  id: UUID;
  code?: string;
  description?: string;
  paysId?: UUID;
}

export interface TitreDto {
  id: UUID;
  code?: string;
  description?: string;
  sexeId?: UUID;
}

export interface ProfilDto {
  id: UUID;
  code?: string;
  description?: string;
}

export interface ProfilCategorieDto {
  id: UUID;
  code?: string;
  description?: string;
  multiSelect?: boolean;
  profils?: ProfilDto[];
}

export interface PaysDto {
  id: UUID;
  code?: string;
  isoAlpha3?: string;
  description?: string;
  indicatifTelephone?: number;
}

export interface OrigineProspectionDto {
  id: UUID;
  code?: string;
  description?: string;
  avecProposeur?: boolean;
  avecCadeau?: boolean;
  avecSupport?: boolean;
}

export type BadgeTone = 'neutral' | 'info' | 'progress' | 'success' | 'warning' | 'amber';

// ---------------------------------------------------------------------------
// Calendrier — rendez-vous/visites planifiés (V4). Une entrée par
// interaction dont le résultat nécessitait une date de RDV (résultat
// "Rendez vous pris" / "RDV reporté" / "Le prospect veut faire une visite
// du projet"). GET /api/calendrier/evenements?debut=...&fin=... (bornes
// ISO-8601 incluses).
// ---------------------------------------------------------------------------

export interface EvenementCalendrierDto {
  interactionId: UUID;
  sujet?: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  lieu?: string;
  resultatId?: UUID;
  /** Même texte que resultats-interaction.code — permet de distinguer un
   * rendez-vous d'une visite sans coder de libellé métier en dur. */
  resultatCode?: string;
  resultatDescription?: string;
  prospectionId?: UUID;
  prospectionCode?: string;
  prospectId?: UUID;
  prospectNom?: string;
  commercialId?: UUID;
  commercialNom?: string;
}

// ---------------------------------------------------------------------------
// Hotline — recherche par numéro de téléphone (V4)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Authentification / Mon compte (V4). Le cookie JWT httpOnly `access_token`
// n'est jamais visible côté front — seul UtilisateurCourantDto (profil +
// rôles + mustChangePassword/profileCompleted) circule dans les réponses.
// Tant que mustChangePassword ou !profileCompleted, le backend renvoie 403
// sur toute route hors /api/auth/** et /api/mon-compte/**.
// ---------------------------------------------------------------------------

export interface ConnexionRequest {
  username: string;
  password: string;
}

export interface UtilisateurCourantDto {
  id: UUID;
  username?: string;
  description?: string;
  email?: string;
  employeeId?: UUID;
  roles?: string[];
  mustChangePassword?: boolean;
  profileCompleted?: boolean;
}

export interface ChangerMotDePasseRequest {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

/** Tous les champs sont obligatoires sauf `adresse`. */
export interface CompleterProfilRequest {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  dateNaissance: string;
  adresse?: string;
}

export interface ReinitialiserMotDePasseResponse {
  admUserId: UUID;
  username?: string;
  /** Renvoyé une seule fois — jamais stocké en clair côté serveur. */
  motDePasseTemporaire?: string;
}

/** Fiche complète d'une personne déjà connue (CfgTier) trouvée par numéro de
 * téléphone, avec ses derniers historiques d'activité (voir tier.id pour
 * consulter l'historique complet via les endpoints /api/prospects/{id}/...). */
export interface HotlineFicheDto {
  tier: ProspectDetailDto;
  prospections?: ProspectionListItemDto[];
  dossiers?: DossierListItemDto[];
  reglements?: ReglementProspectDto[];
  interactions?: InteractionDto[];
  historique?: HistoriqueDto[];
}

export interface HotlineResultDto {
  telephoneRecherche?: string;
  telephoneNormalise?: string;
  connu?: boolean;
  fiches?: HotlineFicheDto[];
  /** Pré-prospections dont le numéro de l'époque correspond mais qui n'ont
   * jamais été rattachées à une fiche CfgTier — un appelant déjà contacté
   * par le passé mais jamais formellement créé comme prospect/client. */
  appelsSansFiche?: ProspectionListItemDto[];
}
