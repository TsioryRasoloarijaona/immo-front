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
  trancheId?: UUID;
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
  /** NOT YET IN docs/api-docsV4.json — proposed addition so
   * ProspectionDetail.tsx's "Créer / ouvrir dossier" button can tell
   * whether this prospection has already been converted, without a
   * separate lookup. Today no read DTO links a Dossier back to the
   * Prospection it was created from (only DevisDto carries
   * prospectionId/prospectionCode) — POST /api/dossiers takes
   * CreerDossierRequest.prospectionId but that link isn't surfaced
   * anywhere afterwards. Wired defensively (see ProspectionDetail.tsx):
   * stays undefined until the backend adds it, at which point the button
   * starts working without further frontend changes. */
  dossierId?: UUID;
  dossierCode?: string;
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

/** `PATCH /api/prospections/{id}/tranche-principale` — the ONLY endpoint
 * that changes a prospection's `trancheId`/`articleId` (the "tranche/article
 * principal"); the generic `PATCH /api/prospections/{id}` no longer touches
 * these two fields. `trancheId` is required; `articleId` is optional but,
 * when given, MUST belong to `trancheId` (400 otherwise). Distinct from
 * `AjouterAutreTrancheRequest` below, which manages independent secondary
 * interests and never affects the principal tranche/article. */
export interface ModifierTranchePrincipaleRequest {
  trancheId: UUID;
  articleId?: UUID;
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
  /** Obligatoire. */
  trancheId?: UUID;
  /** Article principal — sert de base au calcul HT/TTC/TVA/prix au m² s'il
   * est renseigné. Sans lui, l'offre est "libre" (pas de ventilation) et
   * `prix` devient obligatoire. */
  articleId?: UUID;
  /** Sous-articles inclus dans l'offre (prix commercial sommé). Ignoré si
   * `articleId` est absent. */
  sousArticleIds?: UUID[];
  /** Repris du prospect/commercial de la prospection si absent. */
  prospectId?: UUID;
  commercialId?: UUID;
  modePaiementId?: UUID;
  /** Prix de vente TTC — obligatoire si `articleId` est absent, sinon
   * remplace le prix commercial de l'article s'il est fourni. */
  prix?: number;
  /** Taux de remise à appliquer, en %. Défaut 0. */
  remisePercent?: number;
  notes?: string;
}

/** Détail HT/TTC d'une offre, reproduisant l'onglet "Montants" du formulaire
 * Offre legacy — voir `docs/api-docsV4.json` → `MontantsOffreDto`. */
export interface MontantsOffreDto {
  tvaRatio?: number;
  prixM2HT?: number;
  prixM2TTC?: number;
  prixArticleHT?: number;
  prixArticleTTC?: number;
  prixSousArticlesHT?: number;
  prixSousArticlesTTC?: number;
  totalHT?: number;
  totalTTC?: number;
  remisePercent?: number;
  remiseHT?: number;
  remiseTTC?: number;
  prixM2ApresRemiseHT?: number;
  prixM2ApresRemiseTTC?: number;
  prixArticleApresRemiseHT?: number;
  prixArticleApresRemiseTTC?: number;
  prixSousArticlesApresRemiseHT?: number;
  prixSousArticlesApresRemiseTTC?: number;
  /** Prix de vente final HT = total HT − remise HT. Ligne finale du
   * formulaire legacy. */
  prixVenteHT?: number;
  prixVenteTTC?: number;
}

export interface DevisDto {
  id: UUID;
  code?: string;
  dateDocument?: string | null;
  /** Prospection d'origine — pour la colonne "Prospection" et le lien
   * cliquable vers la prospection depuis la liste globale des offres
   * (`GET /api/devis`, voir `listOffres`). */
  prospectionId?: UUID;
  prospectionCode?: string;
  trancheId?: UUID;
  tranche?: string;
  trancheDescription?: string;
  articleId?: UUID;
  article?: string;
  articleDescription?: string;
  articleSuperficie?: number;
  articleCategorie?: string;
  articleType?: string;
  prospectId?: UUID;
  prospect?: string;
  commercialId?: UUID;
  commercial?: string;
  modePaiementId?: UUID;
  modePaiement?: string;
  montants?: MontantsOffreDto;
  notes?: string;
}

/** Réponse de `GET /api/devis` (liste globale des offres) — même forme que
 * `PageDto<DevisDto>` plus `sommePrixVenteTTCPage`, la somme des
 * `montants.prixVenteTTC` de la page courante uniquement (offres sans
 * montant renseigné exclues) — pas un total plein-filtre sur l'ensemble
 * des résultats. */
export interface DevisPageDto {
  content: DevisDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sommePrixVenteTTCPage?: number;
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
  /** Prospection à l'origine du dossier (ComFolder.ComProspectionId) —
   * powers the "Prospection" column on DossiersList.tsx. */
  prospectionId?: UUID;
  prospectionCode?: string;
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
  /** Prospection à l'origine du dossier (ComFolder.ComProspectionId) —
   * powers DossierDetail.tsx's "Prospection" cascade-reference tab. The
   * reverse link (ProspectionDetailDto.dossierId) is still not in the API —
   * see that field's comment — so "Ouvrir le dossier" from a prospection
   * still falls back to the "Créer un dossier" flow. */
  prospectionId?: UUID;
  prospectionCode?: string;
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

/** `POST /api/dossiers/simulation-financement` — previews the "Schéma de
 * financement" (AUTO-FINANCEMENT / AVANCE / FRAIS SYNDIC lines) that
 * `POST /api/dossiers` would generate for this exact article selection and
 * prix, without creating or persisting anything. Meant to be called on
 * every price/article change during the creation wizard, before the real
 * `POST /api/dossiers` call. `articleIds` doesn't need DISPONIBLE articles —
 * nothing gets reserved by this call. */
export interface SimulerSchemaFinancementRequest {
  articleIds: UUID[];
  prix: number;
}
export interface LigneSchemaFinancementDto {
  categorie?: string;
  montant?: number;
  /** True for lines (e.g. FRAIS SYNDIC) that are additional fees, not part
   * of the sale price itself — don't fold into a "prix" subtotal check. */
  exclureDuPrix?: boolean;
}
export interface SchemaFinancementDto {
  lignes?: LigneSchemaFinancementDto[];
  totalGeneral?: number;
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

/** Une ligne de GET .../echeancier/{echeanceId}/reglements — détail complet
 * d'un versement (contrepartie du seul total montantRegle/reste renvoyé par
 * GET .../echeancier). `payeurId`/`payeurNom` peut différer de l'acquéreur
 * principal du dossier (un tiers peut régler pour le compte du client). */
export interface ReglementDto {
  id: UUID;
  echeanceId?: UUID;
  /** Référence du document (ex : n° de chèque), pas d'équivalent en saisie. */
  reference?: string;
  dateDocument?: string | null;
  dateReglement?: string | null;
  montant?: number;
  typeId?: UUID;
  typeCode?: string;
  typeLibelle?: string;
  /** Renseigné seulement si le type de règlement le requiert (voir
   * `TypeReglementDto.banqueObligatoire`). */
  banqueId?: UUID;
  banqueNom?: string;
  payeurId?: UUID;
  payeurNom?: string;
  notes?: string;
}

export type EncaissementEtat = 'IN_WORK' | 'POINTED' | 'CANCELED';

/** Une ligne de GET /api/encaissements — catalogue transverse des
 * règlements de Dossiers de vente (Vente > Encaissements côté legacy),
 * tous dossiers/échéances confondus. `montantBrutRestant` (part non encore
 * affectée à une échéance) et `montantNet` (après retenue source/timbre)
 * sont calculés côté serveur, jamais stockés. */
export interface EncaissementDto {
  id: UUID;
  reference?: string;
  /** StlSettlement.Status — IN_WORK/POINTED/CANCELED confirmés sur données
   * réelles ; l'écran legacy propose aussi Impayé(e)/Perdu(e), aucune ligne
   * réelle ne les porte à ce jour (voir instructions/from_front.md). */
  etat?: string;
  dossierId?: UUID;
  dossierCode?: string;
  dateDocument?: string | null;
  dateEcheance?: string | null;
  dateReglement?: string | null;
  tierId?: UUID;
  tierNom?: string;
  montantBrut?: number;
  montantBrutRestant?: number;
  montantNet?: number;
  comptabilise?: boolean;
  typeId?: UUID;
  typeCode?: string;
  typeLibelle?: string;
  entiteId?: UUID;
  entiteCode?: string;
  entiteLibelle?: string;
  compteId?: UUID;
  compteCode?: string;
  depotId?: UUID;
  depotCode?: string;
  banqueId?: UUID;
  banqueNom?: string;
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
  /** Catégorie legacy brute (ex. "Yes.Com.Sales.Sale") — purement informatif, pas de logique métier dessus. */
  category?: string;
  /** Type de document (référentiel AdmAttachedFileType, ex. "PIECE D'IDENTITE", "CONTRAT"). Peut être null. */
  type?: string | null;
  extension?: string;
  dateCreation?: string | null;
  /** Identifiant/login de l'utilisateur ayant déposé le fichier. Peut être null (legacy ou dépôt via API). */
  creePar?: string | null;
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
  categorieId?: UUID;
  categorieCode?: string;
  categorieLibelle?: string;
  typeId?: UUID;
  typeCode?: string;
  typeLibelle?: string;
  /** True when this row is itself a sous-article (StkItem.ParentId set). */
  sousArticle?: boolean;
  lotParentId?: UUID;
  /** Reverse Article→Dossier link (null when not reserved/sold —
   * StkItem.ComFolderId absent). `dossierStatut` carries the same raw
   * value as DossierListItemDto/DossierDetailDto.statut (StrStatus.Code),
   * run it through canonicalStatusLabel/toneForStatus like everywhere
   * else. Powers ArticlesList.tsx's État/N° Dossier/Client columns. */
  dossierId?: UUID;
  dossierCode?: string;
  dossierStatut?: string;
  clientId?: UUID;
  clientNom?: string;
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
  trancheCode?: string;
  trancheDescription?: string;
  /** Populated when this article IS a sous-article — its parent lot's id/code/description,
   * resolved server-side without an extra call ("recherche inverse"). */
  lotParentId?: UUID;
  lotParentCode?: string;
  lotParentDescription?: string;
  /** All sous-articles of this article, regardless of availability status. */
  sousLots?: ArticleListItemDto[];
  titreFoncier?: string;
  categorieId?: UUID;
  categorieCode?: string;
  categorieLibelle?: string;
  typeId?: UUID;
  typeCode?: string;
  typeLibelle?: string;
  /** Same reverse Article→Dossier link as ArticleListItemDto.
   * ArticleDetail.tsx's "Dossier de vente" card fetches the full
   * DossierDetailDto via getDossier(dossierId) when this is set. */
  dossierId?: UUID;
  dossierCode?: string;
  dossierStatut?: string;
  clientId?: UUID;
  clientNom?: string;
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

/** Une ligne de GET /api/referentiels/types-reglement — distinct de
 * `modes-paiement` (StlSettlementType vs ComPaymentMethod, deux tables
 * différentes malgré des noms proches). `banqueObligatoire` pilote
 * l'affichage conditionnel du champ Banque dans "Ajouter un règlement". */
export interface TypeReglementDto {
  id: UUID;
  code?: string;
  description?: string;
  banqueObligatoire?: boolean;
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

/** Une ligne de GET /api/utilisateurs — écran d'administration des comptes.
 * Réservé au rôle Administrateur. */
export interface UtilisateurListItemDto {
  id: UUID;
  /** Nom d'utilisateur (AdmUser.Code). */
  username?: string;
  description?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  /** true si le compte est désactivé — ne peut plus se connecter. */
  disabled?: boolean;
  /** Id de la fiche employé/commercial (CfgTier) liée, si connue. */
  employeeId?: UUID;
  employeePrenom?: string;
  employeeNom?: string;
  /** Code CfgTierKind (ex: "COM" pour commercial), si la fiche employé en a un. */
  typeEmployeCode?: string;
  typeEmployeLibelle?: string;
  /** Codes AdmRole assignés (ex: ["Commercial", "Administrateur"]). Vide si aucun. */
  roles?: string[];
  /** true si des identifiants web existent — false si le compte legacy ne
   * s'est jamais connecté et n'a jamais été initialisé par un administrateur. */
  compteWebInitialise?: boolean;
  /** true si un mot de passe temporaire est en attente de changement. */
  mustChangePassword?: boolean;
  /** true si le profil de première connexion a déjà été complété. */
  profileCompleted?: boolean;
  dateCreation?: string;
}

export interface ReinitialiserMotDePasseResponse {
  admUserId: UUID;
  username?: string;
  /** Renvoyé une seule fois — jamais stocké en clair côté serveur. */
  motDePasseTemporaire?: string;
}

/** Tous les champs sont obligatoires sauf `mobile`. Réservé au rôle
 * Administrateur — crée en une fois la fiche personne (CfgTier), le compte
 * de connexion (AdmUser) et ses rôles. */
export interface CreerEmployeRequest {
  prenom: string;
  nom: string;
  /** Nom d'utilisateur du compte (AdmUser.Code) — doit être unique. */
  identifiant: string;
  email: string;
  mobile?: string;
  /** Code CfgTierKind qualifiant le type d'employé (ex: "COM" pour commercial). */
  typeEmployeCode: string;
  /** Codes AdmRole à assigner (ex: ["Commercial"]) — au moins un requis. */
  roles: string[];
}

export interface CreerEmployeResponse {
  cfgTierId?: UUID;
  admUserId?: UUID;
  identifiant?: string;
  roles?: string[];
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
