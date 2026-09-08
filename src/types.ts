// Shapes mirror the real backend's OpenAPI contract — docs/api-docsV0.json
// (Spring Boot API, base url configured via back_end_url). Field names
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

// `POST /api/prospections` (from_front.md demande #9) — `prospectId` is the
// only required field (400 if missing/unresolvable); everything else
// follows the same optional-partial-update semantics as
// `ModifierProspectionRequest`. `code` is always server-generated
// (AdmSequence "Prospection", format "AA/NNNNN"), never sent by the client.
export interface CreerProspectionRequest {
  prospectId: UUID;
  commercialId?: UUID;
  trancheId?: UUID;
  articleId?: UUID;
  origineId?: UUID;
  origineSupportId?: UUID;
  vocationId?: UUID;
  typeContactId?: UUID;
  actionCommercialeId?: UUID;
  etapeId?: UUID;
  surface?: number;
  surfaceJusqua?: number;
  prix?: number;
  prixJusqua?: number;
  avance?: number;
  financementFondsPropres?: number;
  financementCredit?: number;
  financementAutre?: number;
  ancienClient?: boolean;
  notes?: string;
}

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
  /** Présents dans la spec mais absents de ce type jusqu'ici — la liste
   * pouvait déjà nommer la tranche sans refaire d'appel. */
  trancheCode?: string;
  trancheDescription?: string;
  /** Téléphone du prospect : mobile de sa fiche, à défaut fixe, à défaut le
   * numéro saisi au premier contact. Le repli n'est pas décoratif — sur les
   * 8 613 prospections ouvertes : 5 034 joignables par la fiche, 7 596 par le
   * champ de premier contact, **8 591 par l'une ou l'autre**. */
  telephone?: string | null;
  /** Email du prospect, même règle de repli. Renseigné sur 4 752 des 8 613
   * prospections ouvertes (55 %) : `null` est un cas courant, pas une
   * anomalie — à afficher « — », jamais comme une donnée manquante. */
  email?: string | null;
  /** Date de validité de la dernière alerte de relance posée sur cette
   * prospection (3 236 des 8 613 ouvertes en ont une). L'alerte vient
   * **toujours d'une interaction** : la colonne d'alerte portée par la
   * prospection elle-même est morte en base, 0 ligne sur 8 613. */
  derniereAlerteDate?: string | null;
  /** Message de cette alerte — en pratique la note du commercial sur
   * l'interaction qui l'a posée. `null` si aucune alerte. */
  derniereAlerteMessage?: string | null;
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
  /** Texte libre saisi par le commercial. Attention à l'asymétrie : ce champ
   * s'appelle `description` en écriture mais **ressort dans `note` en
   * lecture** — le `description` de `InteractionDto` est un libellé généré que
   * l'appelant ne peut pas imposer. */
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
  /** **Le texte saisi par le commercial — c'est ce qu'il faut afficher.**
   * Stocké dans `ComActionMessage.AlertMessage`, qui malgré son nom ne relève
   * pas des relances : 6 502 interactions portent une note sans aucune date
   * d'alerte. `null` quand rien n'a été saisi (3,4 % des lignes réelles). */
  note?: string | null;
  /** **Libellé généré par le serveur, pas un contenu.** Vaut
   * `JJ/MM/AAAA HH:MM <auteur>` sur 46 546 lignes réelles sur 46 546 — c'est
   * exactement `date` + `employeNom`, déjà affichés à côté. Ne pas le rendre :
   * ce serait écrire trois fois la même information, et c'est précisément ce
   * qui faisait croire que les notes étaient perdues. Conservé au contrat pour
   * ne rien casser ; la saisie utilisateur est dans `note`. */
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
  /** Prix de vente TTC. Le sens dépend de `remisePercent` :
   * - avec `remisePercent` : prix **avant** remise, base de calcul à la place
   *   du prix commercial de l'article (même rôle que le `prix` d'une Offre) ;
   * - sans `remisePercent` (mode historique) : prix négocié **après** remise,
   *   et `remise`/`remiseMontant` sont déduits de l'écart avec le prix
   *   commercial. */
  prix?: number;
  /** Remise commerciale en **pourcentage (0 à 100)**, pas un ratio — à ne pas
   * confondre avec `DossierDetailDto.remise`, qui reste un ratio 0–1 en
   * lecture. Optionnel : fournie, elle s'applique sur le prix avant remise
   * (article principal + annexes) et se répercute sur `prixApresRemise`,
   * `totalAPayer` et sur le schéma de financement (AVANCE /
   * AUTO-FINANCEMENT calculés sur le prix après remise ; les FRAIS SYNDIC
   * viennent du barème de la tranche et ne sont jamais remisés). Hors de
   * [0 ; 100] ⇒ 400. */
  remisePercent?: number;
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
  /** Obligatoire. Avec `remisePercent` : prix **avant** remise. Sans :
   * prix négocié, utilisé tel quel. */
  prix: number;
  /** Remise commerciale en % (0 à 100), optionnelle — mêmes règles que
   * `CreerDossierRequest.remisePercent`, pour que la simulation calcule
   * exactement ce que la création produira. Hors de [0 ; 100] ⇒ 400.
   * La réponse (`SchemaFinancementDto`) ne renvoie **aucune** arithmétique
   * de remise : le prix après remise est calculé côté client. */
  remisePercent?: number;
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
  /** Référence du document (ex : n° de chèque) — en saisie via
   * `CreerReglementRequest.reference`, requise quand
   * `TypeReglementDto.referenceObligatoire` est vrai pour le type choisi. */
  reference?: string;
  dateDocument?: string | null;
  /** Date d'échéance du règlement (StlSettlement.EcheanceDate) — quasi
   * toujours renseignée, défaut à maintenant si absente à la création. */
  dateEcheance?: string | null;
  /** Date de règlement effectif (encaissement réel/valeur bancaire) — jamais
   * renseignée à la création, écrite au passage à `POINTED` via
   * `PATCH .../reglements/{reglementId}/statut`. Statut et date d'encaissement
   * sont deux encodages du même fait et n'ont jamais divergé en base. */
  dateReglement?: string | null;
  /** `StlSettlement.Status` — `IN_WORK` à la création, puis `POINTED`
   * (encaissement constaté) ou `CANCELED`, tous deux terminaux. Typé `string`
   * et non union parce que la spec ne l'énumère pas sur ce DTO : normaliser à
   * l'affichage via `reglementStatutLabel`/`reglementStatutTone`, comme pour
   * `EncaissementDto.etat` (même colonne). */
  statut?: string;
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

/** Saisie d'un règlement. Le règlement naît toujours au statut `IN_WORK`.
 *
 * **Saisie complète obligatoire** (400 sur chaque manquement) : `montant`,
 * `dateEcheance`, `typeId` et `payeurId`. `typeId`/`payeurId` sont exigés
 * parce qu'ils alimentent le « Mode de versement » et le « Versement effectué
 * par » de l'autorisation d'encaissement, éditable juste après création.
 *
 * `dateReglement` est **absente de ce type volontairement** : la fournir vaut
 * 400. Elle se renseigne au passage à `POINTED`, qui exige d'abord une preuve
 * de paiement — impossible avant que le règlement existe. Pour saisir un
 * règlement déjà encaissé : ce POST, puis `POST .../pieces-jointes`, puis
 * `PATCH .../statut`. */
export interface CreerReglementRequest {
  /** Strictement positif, et au plus égal au reste à payer de l'échéance
   * (400 sinon — le message indique le reste disponible). */
  montant: number;
  /** Requise — il n'y a plus de valeur par défaut côté serveur. */
  dateEcheance: string | null;
  /** Requis. Voir `GET /api/referentiels/types-reglement`. */
  typeId: UUID;
  /** Requise dès que le type choisi a `TypeReglementDto.banqueObligatoire`
   * (400 sinon) ; facultative sinon, typiquement ESPÈCES. Ce flag était
   * annoncé mais pas appliqué avant cette version de l'API. */
  banqueId?: UUID;
  /** N° de chèque, de virement... Requise si `TypeReglementDto.referenceObligatoire`
   * est vrai pour le type choisi (400 sinon) : CHÈQUE / CHEQUE NOTAIRE /
   * SYNDIC / BANQUE / CERTIFIÉ / EFFET ; libre pour ESPÈCES. */
  reference?: string;
  /** Tiers ayant effectivement réglé (« réglé par ») — peut différer de
   * l'acquéreur principal. **Requis** : voir `GET /api/dossiers/{id}/payeurs`
   * pour la liste des candidats. */
  payeurId: UUID;
  notes?: string;
}

/** `PATCH /api/dossiers/{id}/reglements/{reglementId}/statut` — pointage ou
 * annulation. Transitions autorisées : `IN_WORK → POINTED` et
 * `IN_WORK → CANCELED`, les deux cibles étant terminales (409 sinon, avec la
 * liste `transitionsAutorisees` dans le corps ProblemDetail).
 *
 * Pointer exige **au moins une pièce jointe** sur le règlement (409 sinon).
 * La règle ne vaut qu'au moment de la transition : les règlements legacy déjà
 * pointés sans pièce jointe restent valides, et retirer une pièce jointe ne
 * dépointe rien. */
export interface ModifierStatutReglementRequest {
  statut: 'POINTED' | 'CANCELED';
  /** **Requise** pour `POINTED` (400 sinon) ; ignorée pour `CANCELED`, qui
   * laisse la date d'encaissement à `null`. */
  dateReglement?: string | null;
}

/** Une ligne de `GET /api/dossiers/{id}/payeurs` — candidat au champ
 * « Réglé par » d'un règlement : l'acquéreur principal du dossier puis ses
 * co-acquéreurs, la même liste que le bloc « Nom et prénom des clients » de
 * l'autorisation d'encaissement.
 *
 * **Liste indicative, pas fermée** : sur 654 règlements réels portant un
 * payeur, 651 sont l'acquéreur principal, 1 un co-acquéreur et 2 un tiers
 * payeur. La création n'exige pas que `payeurId` appartienne à cette liste,
 * seulement que le tiers existe — mais faute de recherche de tiers dans cette
 * app, c'est la seule source disponible côté UI. */
export interface PayeurDto {
  /** `CfgTier.PKey` — à envoyer tel quel comme `CreerReglementRequest.payeurId`. */
  id: UUID;
  nom?: string;
  role?: 'ACQUEREUR_PRINCIPAL' | 'CO_ACQUEREUR';
  /** Au format de l'autorisation d'encaissement (`CIN: E400556`) — sert à
   * distinguer deux homonymes dans la liste. `null` si non renseignée. */
  pieceIdentite?: string | null;
  /** Quote-part du co-acquéreur en pourcentage (0–100). Toujours `null` pour
   * l'acquéreur principal. */
  quotePart?: number | null;
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
  /** Nom affiché de l'utilisateur ayant déposé le fichier (AdmUser.Description, ex. "Dounya SAFSAF", repli sur le
   * username si absent — résolu automatiquement côté serveur lors de l'upload via cette API). Peut être null pour
   * les pièces jointes legacy créées hors de cette API. */
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
  /** Prix plancher, distinct de `salePrice`/`comSalePrice` (prix commercial)
   * — voir `ArticleDetailDto.salePriceFloor`, désormais aussi sur la liste
   * (instructions/from_front.md #4) pour que la colonne "Prix de vente" de
   * `ArticlesList.tsx` puisse afficher le même repli que le détail. */
  salePriceFloor?: number;
  comSalePriceFloor?: number;
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
  /** StkItem.Vat (ratio brut, ex. 0.20 pour 20%) — instructions/from_front.md #4. */
  tauxTVA?: number;
  /** "Type Présentation" de la grille legacy — code court (F/C/D/H...),
   * référentiel StkPresentationType distinct de Catégorie/Type, scopé par
   * tranche. instructions/from_front.md #4. */
  presentationTypeId?: UUID;
  presentationTypeCode?: string;
  presentationTypeLibelle?: string;
  /** Somme des superficies des sous-articles rattachés (0 si aucun),
   * distincte de `area` (superficie de l'article lui-même). */
  superficieSousArticles?: number;
  /** Référentiels distincts de Catégorie/Type (StkBuilding/StkFloor/StkKind),
   * déjà sur ArticleDetailDto, désormais aussi sur la liste. */
  immeubleId?: UUID;
  immeubleCode?: string;
  immeubleLibelle?: string;
  etageId?: UUID;
  etageCode?: string;
  etageLibelle?: string;
  natureId?: UUID;
  natureCode?: string;
  natureLibelle?: string;
}

export interface ArticleDetailDto {
  id: UUID;
  code?: string;
  description?: string;
  adresse?: string;
  area?: number;
  salePrice?: number;
  comSalePrice?: number;
  /** Prix plancher, distinct de `salePrice` (prix de vente) — `salePrice`
   * peut valoir 0 sur un article dont le prix n'a jamais été saisi alors
   * qu'un prix plancher existe déjà (confirmé sur données réelles); affiché
   * en repli quand `salePrice` est absent/nul. */
  salePriceFloor?: number;
  /** Même relation que `salePriceFloor`/`salePrice`, côté prix commercial. */
  comSalePriceFloor?: number;
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
  /** Référentiels distincts de Catégorie/Type (StkBuilding/StkFloor/StkKind) — chacun null si
   * l'article n'est rattaché à aucune valeur (ex. un terrain n'a ni immeuble ni étage). */
  immeubleId?: UUID;
  immeubleCode?: string;
  immeubleLibelle?: string;
  etageId?: UUID;
  etageCode?: string;
  etageLibelle?: string;
  natureId?: UUID;
  natureCode?: string;
  natureLibelle?: string;
  /** StkItem.Vat (ratio brut) — instructions/from_front.md #4. */
  tauxTVA?: number;
  /** "Type Présentation" de la grille legacy — voir ArticleListItemDto. */
  presentationTypeId?: UUID;
  presentationTypeCode?: string;
  presentationTypeLibelle?: string;
  /** Somme des superficies des sous-articles rattachés (0 si aucun),
   * distincte de `area`. */
  superficieSousArticles?: number;
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
  /** Pilote l'affichage conditionnel du champ Référence dans "Ajouter un
   * règlement" — enforcé côté serveur (400 si absente à la création),
   * contrairement à `banqueObligatoire` qui reste indicatif. */
  referenceObligatoire?: boolean;
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
  /** true si le périmètre commercial s'applique réellement à ce compte —
   * au moins un projet affecté ET aucun rôle d'exemption (Administrateur,
   * Direction Générale). Quand true, les listes ET les détails de
   * prospections/pré-prospections/dossiers/encaissements sont filtrés
   * côté serveur sur `projetsAutorises` (une ressource hors périmètre
   * renvoie 404, y compris sur ses routes imbriquées), de même que tous
   * les agrégats du tableau de bord, GET /api/devis et les sous-listes
   * des fiches client/prospect/hotline. Le front ne doit jamais refiltrer
   * lui-même — il affiche ce que l'API renvoie. */
  perimetreRestreint?: boolean;
  /** Projets du périmètre, uniquement peuplé quand `perimetreRestreint`
   * vaut true (toujours vide sinon — un périmètre vide signifie "aucune
   * restriction", jamais "ne voit rien"). Sert à afficher le bandeau
   * "Périmètre limité à : …". */
  projetsAutorises?: ProjetPerimetreDto[];
}

/** Un projet du périmètre commercial d'un utilisateur (CfgProject) — forme
 * minimale, volontairement distincte de ProjetListItemDto/ProjetDetailDto.
 * Utilisée par GET/PUT /api/utilisateurs/{admUserId}/projets et par
 * UtilisateurCourantDto.projetsAutorises. */
export interface ProjetPerimetreDto {
  id: UUID;
  /** Code court du projet (CfgProject.Code), ex. "ARS", "MBR" — c'est ce
   * code que le bandeau "Périmètre limité à : ARS, MBR" affiche. */
  code?: string;
  /** Libellé du projet (CfgProject.Description). */
  libelle?: string;
}

/** Corps de PUT /api/utilisateurs/{admUserId}/projets — remplacement
 * intégral du périmètre projet d'un utilisateur (état final des cases à
 * cocher, pas un delta). `projetIds` est obligatoire : un tableau vide `[]`
 * retire toute restriction, mais un champ absent/`null` est refusé en 400 —
 * ne jamais envoyer `undefined` ici. */
export interface AffecterProjetsRequest {
  projetIds: UUID[];
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
  /** Nombre de projets affectés à ce compte (périmètre commercial) — pour
   * afficher l'état d'affectation directement dans la liste sans un appel
   * par ligne. 0 = aucune restriction (voit tout). Le détail des projets
   * s'obtient par GET /api/utilisateurs/{admUserId}/projets. Ne tient pas
   * compte des rôles d'exemption : un Administrateur affecté à 2 projets
   * affiche 2 mais n'est de fait jamais filtré. */
  nombreProjets?: number;
}

export interface ReinitialiserMotDePasseResponse {
  admUserId: UUID;
  username?: string;
  /** Renvoyé une seule fois — jamais stocké en clair côté serveur. */
  motDePasseTemporaire?: string;
  /** L'envoi du mail a été **déclenché**. L'expédition étant asynchrone,
   * `true` ne prouve pas la remise. `false` signifie que le service d'envoi
   * est inactif (SMTP absent ou incomplet) : le mot de passe doit alors être
   * communiqué de la main à la main. */
  emailEnvoye?: boolean;
  /** Adresse de destination, masquée — permet de vérifier d'un coup d'œil que
   * le message part au bon endroit. */
  destinataire?: string;
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
  /** L'envoi du mail a été **déclenché** — voir
   * {@link ReinitialiserMotDePasseResponse.emailEnvoye}. */
  emailEnvoye?: boolean;
  /** Adresse de destination, masquée. */
  destinataire?: string;
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

/** Résultat de `GET /api/hotline/recherche`, pour l'un ou l'autre des deux
 * critères. La forme est identique dans les deux cas — un seul écran suffit,
 * seul le champ de saisie change. */
export interface HotlineResultDto {
  /** Quel critère a produit ce résultat. Détermine lesquels des champs
   * `telephone*` / `nomRecherche` sont renseignés — les autres valent `null`. */
  critere?: 'TELEPHONE' | 'NOM';
  /** Numéro tel que saisi. `null` pour une recherche par nom. */
  telephoneRecherche?: string | null;
  /** Numéro normalisé réellement utilisé : chiffres seuls, 9 derniers
   * conservés (indicatif ignoré). Utile pour comprendre pourquoi deux numéros
   * écrits différemment se sont — ou non — rejoints. `null` par nom. */
  telephoneNormalise?: string | null;
  /** Terme recherché tel que saisi. `null` pour une recherche par téléphone. */
  nomRecherche?: string | null;
  /** **À afficher.** `true` quand plus de 20 fiches correspondent au nom et
   * que la liste a été coupée. Sans cette mention l'agent conclut que la
   * personne n'existe pas alors qu'elle est seulement au-delà du plafond —
   * « MOHAMED » remonte 555 fiches en base réelle. Toujours `false` pour une
   * recherche par téléphone, qui n'est pas plafonnée. */
  tronque?: boolean;
  connu?: boolean;
  fiches?: HotlineFicheDto[];
  /** Pré-prospections dont le numéro de l'époque correspond mais qui n'ont
   * jamais été rattachées à une fiche CfgTier — un appelant déjà contacté
   * par le passé mais jamais formellement créé comme prospect/client. */
  appelsSansFiche?: ProspectionListItemDto[];
}

/** Performance d’un commercial sur une période — `GET /api/kpi/commerciaux`
 * et `GET /api/kpi/commerciaux/moi`. Trois familles : l’activité réalisée,
 * le portefeuille confié et le résultat.
 *
 * **Deux attributions cohabitent volontairement.** L’activité est comptée pour
 * *celui qui l’a faite* — un chef qui appelle sur la prospection d’un
 * commercial voit l’appel chez lui. Le portefeuille est compté pour *le
 * commercial assigné*, qu’il ait ou non passé les appels. Les deux coïncident
 * dans 86 % des cas réels ; l’écart est exactement ce qu’on veut voir.
 *
 * Tous les compteurs respectent la visibilité par entité juridique et le
 * périmètre commercial de l’appelant. */
export interface PerformanceCommercialDto {
  /** `CfgTier.PKey` du commercial, **pas** l’id de son compte utilisateur —
   * un même employé peut porter deux comptes, additionnés ici. */
  commercialId?: UUID;
  commercialNom?: string;
  du?: string;
  au?: string;

  // --- Activité réalisée : comptée pour celui qui l’a saisie ---
  appelsPasses?: number;
  appelsRecus?: number;
  /** Visites effectivement consignées — à ne pas confondre avec
   * `visitesDecrochees`. */
  visitesRealisees?: number;
  /** Visites **décrochées** : appels dont le résultat est « le prospect veut
   * faire une visite ». Un engagement obtenu, pas une visite réalisée. */
  visitesDecrochees?: number;
  rdvObtenus?: number;
  interactionsTotal?: number;

  // --- Portefeuille confié : compté pour le commercial assigné ---
  /** Prospections **distinctes** sur lesquelles il a saisi au moins une
   * interaction, quel qu’en soit l’assigné. Mesure le travail réellement fait. */
  prospectionsTraitees?: number;
  /** Prospections créées sur la période et assignées à ce commercial. Les
   * pré-prospections, sans commercial par construction, n’y figurent jamais. */
  prospectionsAssignees?: number;
  prospectionsCloturees?: number;
  /** Parmi les assignées, celles ayant reçu au moins une interaction — de lui
   * ou d’un autre. Le complément est le nombre de leads jamais contactés. */
  prospectionsPrisesEnCharge?: number;
  /** `prospectionsPrisesEnCharge / prospectionsAssignees`, 0–1.
   * **`null` si aucune prospection assignée** — jamais 0, qui se lirait comme
   * un échec là où il n’y a rien à mesurer. */
  tauxPriseEnCharge?: number | null;
  /** Médiane — et non moyenne — du délai création → première interaction, en
   * heures : quelques leads repris des mois plus tard suffisent à rendre une
   * moyenne illisible. `null` si aucune prospection prise en charge.
   * **Non agrégeable** : une médiane de médianes ne veut rien dire. */
  delaiMedianPremiereReponseHeures?: number | null;

  // --- Résultat ---
  dossiersCrees?: number;
  /** Somme des `TotalToPay` de ces dossiers, en dirhams. */
  montantTotal?: number;
  /** `montantTotal / dossiersCrees`. `null` si aucun dossier. */
  panierMoyen?: number | null;
  /** `rdvObtenus / appelsPasses`, 0–1 — l’efficacité au téléphone.
   * `null` si aucun appel passé. */
  tauxAppelVersRdv?: number | null;
  /** `dossiersCrees / prospectionsAssignees`, 0–1. `null` si aucune
   * prospection assignée. **À lire avec son effectif** : sur une période
   * courte le dénominateur est faible et le taux très bruyant. */
  tauxProspectionVersDossier?: number | null;
}
