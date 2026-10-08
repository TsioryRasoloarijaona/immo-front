// Shapes mirror the real backend's OpenAPI contract — docs/api-docsV0.json
// (Spring Boot API, base url configured via back_end_url). Field names
// are kept exactly as the DTOs define them (French, camelCase) so the app
// never needs a translation layer between what the wire sends and what the
// UI reads.

export type UUID = string;

// ---------------------------------------------------------------------------
// Prospect (fiche contact)
// ---------------------------------------------------------------------------

/** Ligne de la liste des prospects.
 *
 * Depuis `?colonnes=`, **la présence d'un champ dépend de la sélection** : seul
 * `id` est servi quel que soit le paramètre. Un champ absent de la sélection
 * n'est pas `null`, il n'est pas dans la charge utile — d'où l'optionnalité
 * générale, et d'où le repli explicite partout où une valeur sert au-delà de sa
 * propre cellule (l'étiquette d'accessibilité de la ligne, par exemple).
 *
 * Catalogue et liste blanche : `GET /api/referentiels/colonnes/prospects`. */
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

  // -- Identité (groupe IDENTITE) --------------------------------------------
  /** CIN du prospect (`CfgTier.IDNumber`). */
  cin?: string;
  /** Identifiant Commun de l'Entreprise (`CfgTier.ICE`). À ne pas confondre
   * avec `FiscalCode`, qui est une autre colonne et n'est pas servie. */
  ice?: string;
  dateNaissance?: string | null;
  lieuNaissance?: string;
  nombreEnfants?: number;
  estAncienClient?: boolean;
  /** Nom du père (`FatherName`). */
  filsDe?: string;
  /** Nom de la mère (`MotherName`). */
  etDe?: string;
  /** Genre du tiers (`CfgTierKind`). **Quasi mort** : 14 339 des 14 516 tiers
   * réels n'en portent aucun. Proposé au sélecteur, mais vide en pratique. */
  kind?: string;
  titre?: string;
  sexe?: string;
  nationalite?: string;
  situationFamiliale?: string;
  regimeMatrimonial?: string;
  commercialId?: UUID;
  commercialNom?: string;

  // -- Contact (groupe CONTACT) ----------------------------------------------
  /** Indicatif pays du fixe, sans le `+` (ex. `212`). */
  indicatifTelephone?: string;
  /** Second téléphone. Le libellé serveur est « Téléphone 2 ». */
  telephone1?: string;
  /** Troisième téléphone. Libellé serveur « Téléphone 3 ». */
  telephone2?: string;
  /** Indicatif pays du mobile, sans le `+`. */
  indicatifMobile?: string;
  /** **Quasi mort en base réelle.** */
  fax?: string;
  siteWeb?: string;

  // -- Adresse (groupe ADRESSE) ----------------------------------------------
  adresse?: string;
  /** Complément d'adresse. Absent de la vue légataire — cette donnée n'existe
   * que dans notre API et dans la table. Idem `adresse3` et `codePostal`. */
  adresse2?: string;
  adresse3?: string;
  codePostal?: string;
  pays?: string;
  paysResidence?: string;
  typeResidence?: string;

  // -- Profession (groupe PROFESSION) ----------------------------------------
  employeur?: string;
  /** Ancienneté professionnelle, en années. */
  anciennete?: number;
  /** Alimentée par `CfgTier.Quality` — **mesurée à 0 ligne sur 13 664**, donc
   * toujours nulle. Servie pour rester cohérente avec la fiche ; la spec dit
   * explicitement de ne pas la proposer comme critère. */
  profession?: string;
  /** Tranche de salaire (`AdmSalary`). Rare : 0,2 % des prospects. */
  salaire?: string;

  // -- Traçabilité (groupe AUDIT) --------------------------------------------
  /** ~100 % en base réelle, 55 auteurs distincts. */
  creePar?: string;
  creeLe?: string | null;
  /** 99,9 %. */
  modifiePar?: string;
  modifieLe?: string | null;
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
  /** Indicatif pays du telephone, sans le signe plus (ex. 212). Voir
   * CreerProspectRequest.indicatifTelephone. */
  indicatifTelephone?: string;
  telephone1?: string;
  telephone2?: string;
  mobile?: string;
  /** Indicatif du mobile, sans le signe plus. */
  indicatifMobile?: string;
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
  /** Piste d'audit de la fiche. Renseignée sur **100 %** des 13 664 prospects
   * réels, avec 55 auteurs distincts — c'est une vraie traçabilité métier, pas
   * un champ technique à masquer. `modifiePar`/`modifieLe` : 99,9 %. */
  creePar?: string;
  creeLe?: string | null;
  modifiePar?: string;
  modifieLe?: string | null;
  /** Tranches auxquelles le prospect s'est intéressé, toutes prospections
   * confondues — la tranche principale de chacune **et** ses intérêts
   * secondaires, dédoublonnés.
   *
   * **Toujours présent, vide plutôt qu'absent** quand le prospect n'a aucune
   * prospection : un `[]` veut dire « aucun intérêt », jamais « non
   * disponible ». D'où le type non optionnel.
   *
   * Court par nature, mesuré sur les 13 664 prospects réels : 13 246 n'ont
   * qu'une tranche, 254 en ont deux, 8 en ont trois. Pas de pagination à
   * prévoir, pas de « voir plus » à construire. */
  tranchesInteret: TrancheInteretDto[];
}

/** Tranche à laquelle le prospect s'est intéressé, via l'une de ses
 * prospections — en tranche principale ou en intérêt secondaire. */
export interface TrancheInteretDto {
  /** `CfgTranche.PKey`, exploitable directement par `GET /api/tranches/{id}`. */
  id: UUID;
  code?: string;
  description?: string;
}

export interface CreerProspectRequest {
  prenom?: string;
  nom?: string;
  raisonSociale?: string;
  telephone?: string;
  /** Indicatif pays du numéro, sans « + » (ex. "212"). Séparé du numéro par
   * le back parce qu'un numéro sans indicatif n'est pas expédiable par
   * WhatsApp — voir `CanalEnvoiDto.motif = NUMERO_INEXPLOITABLE`. La liste
   * vient de `PaysDto.indicatifTelephone` (`/api/referentiels/pays`).
   *
   * **Non documenté côté spec** : rien n'y dit si `telephone` doit perdre
   * son zéro initial une fois ce champ renseigné. Le front ne reformate donc
   * rien et laisse le serveur composer. */
  indicatifTelephone?: string;
  mobile?: string;
  /** Indicatif du mobile — même convention que `indicatifTelephone`. */
  indicatifMobile?: string;
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
  /** Confirmation « nouveau contact ». Absent ou `false` : **409** avec la
   * liste `doublons` si une fiche prospect/client existante porte le même
   * nom, téléphone ou email (règles de `GET /api/prospects/doublons`).
   * `true` : crée quand même. Lu par `POST /api/prospects` et
   * `POST /api/pre-prospections/{id}/creer-prospect` ; ignoré en PATCH. */
  ignorerDoublons?: boolean;
}

export type ModifierProspectRequest = CreerProspectRequest;

/** Critère sur lequel une fiche existante correspond à l'identité saisie
 * (`FEATURE-doublons-prospect-projet.md` §2) :
 * - `NOM` — prénom + nom (ou raison sociale) en minuscules et **sans aucun
 *   espace**, dans les deux ordres — la règle d'OMRAN, qui rend « El Mehdi
 *   LAHLOU » et « El MEHDI LAHLOU » égaux ;
 * - `TELEPHONE` — 9 derniers chiffres d'un des quatre numéros de la fiche ;
 * - `EMAIL` — sans casse ni espaces de bord. */
export type CritereDoublon = 'NOM' | 'TELEPHONE' | 'EMAIL';

/** Fiche prospect ou client existante (CfgTier de type PRO/PRORNT/CLI/CLIRNT)
 * correspondant à l'identité saisie sur au moins un critère. Sert à demander
 * « est-ce l'une de ces personnes ? » avant de créer une fiche. Servie par
 * `GET /api/prospects/doublons` et dans le corps 409 (`doublons`) de
 * `POST /api/prospects` et `POST /api/pre-prospections/{id}/creer-prospect`.
 *
 * **Un homonyme au contact différent est le cas courant** (237 groupes sur
 * 244 dans les données réelles) : la liste est là pour que l'utilisateur
 * tranche, pas pour refuser. */
export interface ProspectDoublonDto {
  /** CfgTier.PKey — ouvrable par `GET /api/prospects/{id}`, rattachable par
   * `POST /api/pre-prospections/{id}/lier-prospect`. */
  id: UUID;
  /** P.ex. `26/14428`. */
  code?: string | null;
  /** Nom affiché (raison sociale, sinon `Description`, sinon prénom + nom). */
  nom?: string | null;
  prenom?: string | null;
  nomFamille?: string | null;
  /** Null pour un particulier. */
  raisonSociale?: string | null;
  /** Tel que stocké. */
  telephone?: string | null;
  /** Tel que stocké : `6 65 68 09 64`. */
  mobile?: string | null;
  email?: string | null;
  ville?: string | null;
  /** Code du type de tiers : `PRO`, `PRORNT`, `CLI` ou `CLIRNT`. */
  type?: string | null;
  /** `UserCreateDateTime`, null sur des lignes anciennes. */
  dateCreation?: string | null;
  /** Jamais vide. Une fiche qui correspond sur plusieurs critères est listée
   * avant les autres. */
  criteres: CritereDoublon[];
}

/** Critères de `GET /api/prospects/doublons` — tous optionnels, mais 400 si
 * aucun n'est exploitable (téléphone de moins de 9 chiffres ou à 9 chiffres
 * identiques, email sans `@` ne comptent pas). */
export interface RechercheDoublonsProspectParams {
  /** Nom de famille (ou nom complet si `prenom` est vide). */
  nom?: string;
  prenom?: string;
  raisonSociale?: string;
  /** N'importe quel format. */
  telephone?: string;
  /** N'importe quel format. */
  mobile?: string;
  email?: string;
}

/** `POST /api/pre-prospections/{id}/lier-prospect` — réponse « c'est l'une
 * de ces personnes » à la liste de doublons : pose un CfgTier **existant**
 * comme prospect de la pré-prospection, sans rien créer. */
export interface LierProspectRequest {
  /** Typiquement un `id` de `ProspectDoublonDto`. 400 si inconnu ou d'un
   * autre type de tiers que prospect/client. */
  prospectId: UUID;
}

/** Corps `prospectionExistante` du 409 « un prospect, un projet, une
 * prospection » (`FEATURE-doublons-prospect-projet.md` §3) — renvoyé par
 * `POST /api/prospections`, `POST /api/prospections/{id}/transformer`,
 * `PATCH /api/prospections/{id}/tranche-principale` (seulement si le projet
 * change) et `POST /api/pre-prospections/{id}/lier-prospect`. Le prospect a
 * déjà une prospection **ouverte** sur ce projet : la bonne action est de
 * l'ouvrir et d'y ajouter un dossier, pas d'en créer une seconde. Une
 * prospection fermée ne bloque jamais. */
export interface ProspectionExistanteDto {
  /** Ouvrable par `GET /api/prospections/{id}`. */
  id: UUID;
  code?: string | null;
  dateDocument?: string | null;
  etapeLibelle?: string | null;
  commercialNom?: string | null;
  trancheCode?: string | null;
  projetCode?: string | null;
}

// `POST /api/prospections` (from_front.md demande #9) — `prospectId` is the
// only required field (400 if missing/unresolvable); everything else
// follows the same optional-partial-update semantics as
// `ModifierProspectionRequest`. `code` is always server-generated
// (AdmSequence "Prospection", format "AA/NNNNN"), never sent by the client.
/** Champs obligatoires (spec du 21/09, alignés sur l'écran légataire) :
 * `prospectId`, `trancheId`, `origineId`, `typeContactId`, `etapeId` et
 * `notes` (non vide). Le commercial reste optionnel — posé plus tard par
 * `POST /api/prospections/{id}/transformer` sinon. */
export interface CreerProspectionRequest {
  prospectId: UUID;
  commercialId?: UUID;
  /** Tranche/projet (CfgTranche), champ « Tranche ». Obligatoire. */
  trancheId: UUID;
  /** Optionnel ; s'il est fourni il DOIT appartenir à `trancheId` (400 sinon). */
  articleId?: UUID;
  /** Source de contact (ComProspectionOrigin). Obligatoire. */
  origineId: UUID;
  origineSupportId?: UUID;
  vocationId?: UUID;
  /** Type (ComActionMessageType), champ « Type ». Obligatoire — à distinguer
   * de la vocation (`vocationId`). */
  typeContactId: UUID;
  actionCommercialeId?: UUID;
  /** Nature/étape (ComProspectionKind), champ « Nature ». Obligatoire. */
  etapeId: UUID;
  surface?: number;
  surfaceJusqua?: number;
  prix?: number;
  prixJusqua?: number;
  avance?: number;
  financementFondsPropres?: number;
  financementCredit?: number;
  financementAutre?: number;
  ancienClient?: boolean;
  /** Notes libres, champ « Notes ». Obligatoire (non vide). */
  notes: string;
}

// A prospect's own contact book (contacts personnels — e.g. spouse, agent) —
// each entry links to another CfgTier record, tagged with a relation type
// (référentiel types-relation-contact). Spec du 21/09 : la personne-contact
// est soit un tiers existant (`contactProspectId`), soit créée à la volée
// (`nouveauContact`, flux OMRAN — insertion du CfgTier puis du lien
// CfgTierContact). Fournir l'un OU l'autre — 400 si aucun ou les deux.
export interface CreerContactProspectRequest {
  /** Tiers (CfgTier) existant à lier comme contact. Alternative à `nouveauContact`. */
  contactProspectId?: UUID;
  /** Personne-contact à créer à la volée puis lier. Au moins `nom` ou
   * `raisonSociale` requis. */
  nouveauContact?: CreerProspectRequest;
  /** Type de relation (CfgRelationType), p.ex. « Conjoint », « Notaire ».
   * Obligatoire (400 sans lui — spec du 21/09). */
  relationTypeId: UUID;
}

export interface ContactProspectDto {
  /** Id du lien CfgTierContact (sert au DELETE). */
  id: UUID;
  /** Id du CfgTier de la personne-contact. */
  contactProspectId?: UUID;
  nomContact?: string;
  /** Mobile de la personne-contact (CfgTier.Mobile). */
  mobileContact?: string;
  telephoneContact?: string;
  /** E-mail de la personne-contact (CfgTier.EMail). */
  emailContact?: string;
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
  /** **Mort : renseigné sur 4 lignes sur 14 114**, et valant `0` — jamais
   * `null` — partout ailleurs. Le backend l'a retiré des colonnes par défaut
   * pour cette raison ; il reste demandable via `?colonnes=prix`. L'afficher
   * revient à annoncer « 0,00 DH » sur tout le portefeuille. */
  prix?: number;
  /** **Morte : 0 ligne renseignée sur 14 114.** Même traitement que `prix`. */
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

  // --- Colonnes issues des tables de base ----------------------------------
  // Servies depuis les tables, pas de la vue légataire : contrairement au
  // bloc ACTIVITE plus bas, les demander ne coûte pas la jointure coûteuse.
  /** Code du prospect (`CfgTier.Code`). 100 %. */
  prospectCode?: string | null;
  /** Mobile **brut de la fiche prospect**, sans le repli sur le numéro de
   * premier contact qu'applique `telephone`. 99,8 %. Sert à éditer ou
   * dédoublonner, là où `telephone` sert à appeler. */
  mobileProspect?: string | null;
  /** Indicatif pays du mobile. 100 %. **Le front ne recompose rien** : il
   * l'affiche tel quel, à côté du numéro, jamais concaténé. */
  indicatifMobile?: string | null;
  /** Email **brut de la fiche**, sans le repli appliqué par `email`. 59,1 %. */
  emailFiche?: string | null;
  /** Code du commercial (`CfgTier.Code`). 99,3 % — la liste n'exposait que son
   * nom. */
  commercialCode?: string | null;
  /** Le prospect est un ancien client. 100 %. */
  ancienClient?: boolean;
  /** Date de clôture. 62,9 %. */
  dateFermeture?: string | null;
  /** Motif de clôture. 60,5 %. */
  raisonFermeture?: string | null;
  /** Type du **prospect** (`CfgTierType`). 100 %.
   *
   * Ne pas confondre avec `typeProspection*` juste en dessous : celui-ci
   * qualifie la personne, ceux-là le document. Quatre champs de cette
   * interface commencent par « type », c'est le piège le plus facile ici. */
  typeProspect?: string | null;
  /** Identifiant du type de **document** légataire (`StrEntity`). 100 %, sauf
   * 4 lignes en base réelle. */
  typeProspectionId?: UUID | null;
  /** Code du type de document — **c'est ce champ qu'il faut tester**, jamais
   * le libellé. Valeurs : `ComProspection`, `ComPreProspection`,
   * `RntProspection`.
   *
   * Ce champ est ce qui rend mesurable un écart connu : cette liste applique
   * une **heuristique** (`CfgProspectId`/`CfgCommercialId`) qui n'est pas le
   * discriminant du logiciel de bureau. Elle y laisse donc **830 lignes de
   * code `ComPreProspection`** et 4 de `RntProspection` (location). Le champ
   * rend l'écart visible et comptable ; **il ne le corrige pas**. */
  typeProspectionCode?: string | null;
  /** Libellé d'affichage du type, traduit — « Prospection vente »,
   * « Pré-Prospection ». **Ne jamais s'en servir pour tester le type**, il est
   * traduit et donc instable : tester `typeProspectionCode`. */
  typeProspection?: string | null;
  /** Support de l'origine. 50,2 %. */
  origineSupport?: string | null;
  /** Action commerciale (campagne) rattachée. 40,2 %. */
  actionCommerciale?: string | null;
  /** Pays du prospect. 27,3 % — le plus creux de ce lot. */
  pays?: string | null;
  /** Société / entité juridique. 99,8 %. Elle filtrait déjà les résultats côté
   * serveur — seules les sociétés actives sont servies — sans avoir jamais été
   * renvoyée. */
  societeId?: UUID | null;
  societeCode?: string | null;
  societeLibelle?: string | null;
  /** Auteur de la création. **34,3 % seulement** : les prospections créées par
   * cette API n'en portent pas (bug backend #41). Une colonne vide n'y veut
   * donc pas dire « auteur inconnu » mais « créée depuis l'application ». */
  creePar?: string | null;
  /** Date de création. 100 %. */
  creeLe?: string | null;
  /** Auteur de la dernière modification. 100 %. */
  modifiePar?: string | null;
  /** Date de dernière modification. 100 %. */
  modifieLe?: string | null;

  // --- Colonnes des groupes ACTIVITE et CONVERSION -------------------------
  // Elles ne sont **servies que si `?colonnes=` les demande** : sans le
  // paramètre, le backend n'interroge pas la vue légataire du tout et ces
  // champs sont absents de la réponse. `undefined` ici veut donc dire « non
  // demandée », pas « vide » — c'est la même distinction que le bloc
  // `activite` du DTO de détail, à un niveau différent.
  /** Jours écoulés depuis la dernière action — le tri de relance du logiciel
   * de bureau. Renseigné sur 100 % des prospections de vente. */
  joursInactivite?: number;
  /** Nombre d'interactions journalisées. 97 %. */
  nbInteractions?: number;
  /** Dernière action, tous types confondus. 97 %. */
  derniereActionDate?: string | null;
  /** Dernier échange avec le prospect. 90 %. */
  derniereCommunicationDate?: string | null;
  /** Résultat du dernier échange. 90 %. */
  derniereCommunicationResultat?: string | null;
  /** Nombre de visites effectuées. 20 %. */
  nbVisites?: number;
  derniereVisiteDate?: string | null;
  /** Projet — la liste n'exposait que la tranche. 99 %. */
  projetId?: UUID | null;
  projetCode?: string | null;
  projetLibelle?: string | null;
  /** CIN du prospect. **Rare : 2,7 %** (387 lignes sur 14 118) — une première
   * mesure annonçait 99 % en comptant les non-`NULL` d'une colonne qui porte
   * des chaînes vides. Jamais une donnée d'identité fiable. */
  cin?: string | null;
  /** Dossier issu de la prospection. `null` sur 98 % des lignes : c'est le
   * taux de conversion réel, pas une donnée manquante. */
  dossierId?: UUID | null;
  dossierCode?: string | null;
  statutDossier?: string | null;
}

/** Filtres avancés de `GET /api/prospections`.
 *
 * La spec les déclare comme **un seul paramètre objet** nommé `filtres`, et
 * marqué `required: true`. Les deux sont des artefacts de springdoc, pas le
 * contrat réel : Spring lie ce genre d'objet depuis des paramètres de requête
 * **plats** (`?inactiviteMin=30&projetId=a&projetId=b`), et un objet de
 * commande sans champ obligatoire se lie vide sans erreur — l'endpoint
 * répondait d'ailleurs sans lui la veille. C'est ainsi que le front l'envoie.
 * **Non vérifié sur l'API réelle** : elle répond 401 sans session.
 *
 * Les taux de population sont ceux de la spec, mesurés sur 14 118
 * prospections : ils disent surtout à quel point un filtre **réduit** le
 * résultat. `nbVisitesMin ≥ 1` n'en garde que 20,8 %. */
export interface FiltresAvancesProspection {
  /** Projet (`CfgProject`). 99,8 % — une prospection sans tranche n'a pas de
   * projet et **sort du résultat** dès que ce filtre est actif. */
  projetId?: UUID[];
  /** Société / entité juridique (`CfgCompany`). 99,8 %. Référentiel :
   * `/api/referentiels/entites`. */
  societeId?: UUID[];
  vocationId?: UUID[];
  /** Type de contact. 100 %. C'est aussi ce que la vue légataire appelle
   * « type d'origine » — les deux colonnes sont identiques sur les 14 118
   * lignes réelles. */
  typeContactId?: UUID[];
  /** Motif de clôture. 60,5 %. */
  raisonFermetureId?: UUID[];
  /** Pays du prospect. 27,3 % — le plus creux du lot. */
  paysId?: UUID[];
  /** Action commerciale (campagne). 40,2 %. */
  actionId?: UUID[];
  /** Support d'origine. 50,2 %. **Sans écran** : il n'existe pas de
   * référentiel plat des supports, seulement `/api/referentiels/
   * origines-prospection/{origineId}/supports`. Câbler ce filtre demande soit
   * une cascade depuis l'origine choisie, soit un nouvel endpoint. */
  origineSupportId?: UUID[];
  ancienClient?: boolean;
  /** Inactives depuis **au moins** N jours. Renseigné sur 100 % des lignes :
   * c'est le critère de relance du logiciel de bureau, et le plus exploitable
   * de cette famille. */
  inactiviteMin?: number;
  nbInteractionsMin?: number;
  /** Au moins N visites. Seules 20,8 % des prospections ont atteint l'étape
   * visite : un seuil ≥ 1 réduit fortement le résultat. */
  nbVisitesMin?: number;
  /** Dernier échange à partir de cette date (incluse), ISO-8601. 90,4 %. */
  communicationDepuis?: string;
  communicationJusqua?: string;
  /** `true` : uniquement celles portant une relance active. `false` :
   * uniquement celles sans. Absent : pas de filtre. 25,2 % en portent une. */
  avecAlerteActive?: boolean;
  /** Code(s) de type de document légataire (`StrEntity.Code`). Répétable.
   *
   * Le seul filtre de ce lot qui porte sur le **discriminant réel** du
   * logiciel de bureau, et non sur l'heuristique que cette liste applique par
   * ailleurs — c'est donc lui qui rend l'écart mesurable :
   * `typeProspection=ComPreProspection` isole les **830 pré-prospections** qui
   * traînent dans la liste de vente, `RntProspection` les 4 prospections de
   * location. Le vrai outil de nettoyage de données de cet écran.
   *
   * Valeurs connues : `ComProspection`, `ComPreProspection`, `RntProspection`,
   * `PrmProspection`, `RomProspection`. Un code inconnu **ne lève pas
   * d'erreur** — il ne correspond à rien et le résultat est vide, ce qui se
   * confond avec « aucun résultat ». Les 4 lignes sans `StrEntityId` sortent
   * dès que ce filtre est actif : elles n'ont aucun type. */
  typeProspection?: string[];
}

/** Groupes de présentation du sélecteur de colonnes. Valeurs imposées par
 * l'énumération serveur.
 *
 * **La spec est périmée sur ce point** : `ColonneDto.groupe` y liste encore les
 * six seules valeurs des prospections, alors que les catalogues dossiers et
 * prospects, lus à l'exécution, en servent six autres. Les valeurs ci-dessous
 * sont relevées sur le backend, pas sur `api-docsV4.json`.
 *
 * Un groupe inconnu ne casse rien : `libelleGroupe` retombe sur la clé brute. */
export type GroupeColonne =
  // Prospections
  | 'IDENTITE'
  | 'CONTACT'
  | 'CONTEXTE'
  | 'FINANCIER'
  | 'CLOTURE'
  | 'ACTIVITE'
  | 'CONVERSION'
  // Encaissements
  | 'SUIVI'
  // Dossiers de vente
  | 'ACTEURS'
  | 'ORIGINE'
  | 'PATRIMOINE'
  | 'ARTICLE'
  | 'DELAIS'
  // Prospects
  | 'ADRESSE'
  | 'PROFESSION'
  // Suivi des actions
  | 'ACTION'
  | 'RATTACHEMENT'
  | 'IDENTIFIANTS'
  // Les trois catalogues
  | 'AUDIT';

/** Type d'affichage d'une colonne — porte l'alignement et le formatage, ce qui
 * évite une table de correspondance côté front. */
export type TypeColonne = 'TEXTE' | 'NOMBRE' | 'MONTANT' | 'DATE' | 'BOOLEEN';

/** Une colonne sélectionnable d'une liste, servie par les trois catalogues
 * `GET /api/referentiels/colonnes/{prospections,dossiers,prospects}`.
 *
 * C'est **la même source que la liste blanche qui valide `?colonnes=`** côté
 * serveur : les deux ne peuvent pas diverger, et un catalogue codé en dur ici
 * le pourrait — c'est d'ailleurs ce qu'il était avant ce lot. */
export interface ColonneDto {
  /** Nom technique, à passer tel quel dans `?colonnes=`. */
  nom: string;
  /** Libellé d'en-tête, en français, prêt à afficher. */
  libelle: string;
  groupe: GroupeColonne;
  type: TypeColonne;
  /** Vraie pour les colonnes renvoyées quand `?colonnes=` est absent :
   * l'ensemble des `parDefaut` reproduit exactement la réponse historique.
   *
   * **Ce sont les champs de la charge utile, pas les colonnes de la grille.**
   * Les 13 défauts des dossiers comprennent `id`, `clientId`, `commercialId` et
   * `prospectionId` — quatre clés de jointure qu'aucun écran n'affiche. C'est à
   * l'appelant de les masquer (`DispositionColonnes.masquees`), sans quoi la
   * vue par défaut montre des UUID. */
  parDefaut: boolean;
  /** Vraie si la colonne peut servir de clé à `?groupBy=` sur l'endpoint
   * `/groupes` de la liste.
   *
   * **Se lit, ne se déduit pas.** Un montant n'est pas groupable — mesuré, 190
   * prix distincts pour 358 dossiers — et les colonnes calculées par la vue
   * légataire (`joursInactivite`, `nbInteractions`…) n'existent pas dans le
   * graphe d'entités, donc pas davantage. Le catalogue des prospects, lui,
   * renvoie `false` partout : cet écran n'a pas d'endpoint `/groupes`. */
  groupable: boolean;
  /** Vraie si la colonne peut être sommée via `?agregats=` — les bandes
   * « Total : » sous un en-tête de groupe.
   *
   * **N'équivaut pas à « type numérique »**, et c'est le piège : mesuré,
   * `joursInactivite`, `nbInteractions`, `nbVisites` sont des `NOMBRE` non
   * agrégeables, et `nombreEnfants`/`anciennete` de même côté prospects.
   * Déduire du type demanderait une somme que le serveur refuse en 400. */
  agregeable: boolean;
  /** Fonctions d'agrégat que **cette colonne** accepte dans `?agregats=`, dans
   * l'ordre où le menu Σ doit les proposer.
   *
   * **Ne se déduit ni du type ni du nom**, et c'est tout l'intérêt du champ.
   * Mesuré sur les trois catalogues : `montantBrut` accepte les cinq, mais
   * `montantBrutRestant` — un MONTANT lui aussi — n'accepte que
   * `SUM,AVG,COUNT` parce qu'il est calculé par différence et n'a pas
   * d'extremum exprimable. Une date n'accepte que `MIN,MAX,COUNT`. La plupart
   * des colonnes texte n'acceptent que `COUNT`.
   *
   * **La liste vide existe** : une colonne sans chemin en base n'a rien à
   * agréger — 12 colonnes côté prospections (celles de la vue légataire), 3
   * côté encaissements dont `dossierCode` et `notes`. Ces colonnes ne doivent
   * pas apparaître dans le menu Σ.
   *
   * `agregeable` ci-dessus en est redondant : il vaut exactement « `SUM` est
   * dans cette liste » — vérifié cohérent sur les trois catalogues. Il reste
   * servi et reste juste ; les deux peuvent coexister. */
  fonctions: FonctionAgregat[];
}

/** Les cinq fonctions d'agrégat du serveur.
 *
 * `SUM` est le défaut implicite : un nom nu dans `?agregats=` vaut une somme
 * et revient sous ce nom nu. Les autres s'écrivent en jeton qualifié
 * (`prix:AVG`) et reviennent sous le jeton complet. */
export type FonctionAgregat = 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT';

/** Granularité de regroupement d'une colonne DATE.
 *
 * **Doit voyager avec la clé du groupe.** Déplier un groupe se fait par
 * `?groupeColonne=&groupeValeur=`, et le serveur rejoue le même découpage pour
 * retrouver les lignes : passer la clé `2024` obtenue en `ANNEE` sans repasser
 * `granularite=ANNEE` la fait comparer à un découpage mensuel, qui ne contient
 * aucun `2024`. Mesuré : `totalElements: 0`, en **HTTP 200**. Un écran vide
 * sans le moindre message d'erreur. */
export type GranulariteGroupe = 'JOUR' | 'MOIS' | 'ANNEE';

/** Ordre des groupes : par libellé croissant, ou par effectif décroissant. */
export type TriGroupes = 'LIBELLE' | 'NOMBRE';

/** Ce qu'un agrégat peut valoir, **et ce n'est pas toujours un nombre**.
 *
 * Le type suit la fonction, mesuré sur les données réelles :
 * - `SUM` et `AVG` : un décimal (`997059.56`) ;
 * - `COUNT` : un entier ;
 * - `MIN`/`MAX` : **le type de la colonne**, donc la chaîne ISO
 *   `"2023-12-04T00:00:00"` sur une colonne date.
 *
 * `null` est réservé à un `MIN`/`MAX` sans aucune valeur — mesuré, 1 groupe
 * sur 7 — parce qu'il n'existe pas de minimum de rien et que `0` serait un
 * mensonge. Une **somme** dont tout le groupe est nul vaut `0`, jamais `null` :
 * c'est un total, pas une absence. */
export type ValeurAgregat = number | string | null;

/** Un groupe d'une liste repliée — l'équivalent de l'en-tête « Client : Adnane
 * ES-SAIYDY (1 item) » et de sa bande « Total : » du logiciel de bureau.
 *
 * Servi par `GET /api/{prospections,pre-prospections,dossiers}/groupes`. Les
 * groupes sont **repliés** : ils portent l'effectif et les totaux, jamais les
 * lignes. Celles-ci s'obtiennent en rappelant la liste correspondante avec
 * `?groupeColonne=&groupeValeur=`.
 *
 * **Les effectifs portent sur tout le périmètre filtré, pas sur une page** —
 * c'est la raison d'être de l'endpoint, grouper côté front ne grouperait que
 * la page chargée. Vérifié : la somme des `nombre` retombe exactement sur le
 * `totalElements` de la liste (116 dossiers, 9 654 prospections). */
export interface GroupeDto {
  /** Valeur technique, à réémettre **telle quelle** dans `?groupeValeur=`.
   * Selon la colonne : un identifiant, un code, un booléen, ou un entier de
   * période (`202507` pour juillet 2025, `2025` pour l'année).
   *
   * **`null` est un groupe légitime** — les lignes sans valeur sur la colonne
   * groupée. Il est servi et non masqué, sans quoi la somme des effectifs
   * cesserait de retomber sur le total. Mesuré : 93 dossiers sans avocat. Pour
   * le déplier, envoyer `groupeColonne` **sans** `groupeValeur`. */
  cle: string | number | boolean | null;
  /** Libellé affichable. Identique à `cle` pour la plupart des colonnes ;
   * dérivé pour les groupements par tiers et pour les périodes
   * (`juillet 2025`). `null` pour le groupe des lignes sans valeur. */
  libelle: string | null;
  /** Nombre de lignes du groupe — le « (1 item) » de l'écran légataire. */
  nombre: number;
  /** Sommes des colonnes demandées via `?agregats=`, indexées par nom de
   * colonne. Vide si `agregats` n'est pas fourni. Une colonne dont tout le
   * groupe est nul vaut `0`, jamais `null` : c'est un total, pas une absence.
   *
   * Arrive bruité en flottant (`17440269.999994` — somme SQL sur des `float`) ;
   * `formatCurrency`/`formatNumber` l'absorbent via `toFixed`. */
  agregats: Record<string, ValeurAgregat>;
}

/** L'enveloppe des quatre endpoints `/groupes` : des groupes paginés, **plus le
 * total général sur tout le périmètre filtré**.
 *
 * Elle remplace le `PageDto<GroupeDto>` générique, et l'ajout n'est pas
 * cosmétique : sans `totaux`, un total de bas de grille ne pouvait être calculé
 * que sur les lignes chargées, c'est-à-dire sur les seuls groupes ouverts. Ce
 * nombre-là ressemble à un total général sans en être un. */
export interface PageGroupesDto {
  content: GroupeDto[];
  page: number;
  size: number;
  /** Nombre de **groupes**, pas de lignes — c'est ce qui est paginé ici. */
  totalElements: number;
  totalPages: number;
  /** Les mêmes agrégats que dans chaque groupe, mais sur **tout le périmètre
   * filtré** : la bande « Total : » de bas de grille, par opposition à celle
   * d'un en-tête de groupe. Indexés par les mêmes jetons. Vide si `agregats`
   * n'est pas fourni.
   *
   * Suit `inclureSansValeur` à l'identique — sinon ce total et la somme des
   * groupes désigneraient deux populations différentes. */
  totaux: Record<string, ValeurAgregat>;
  /** Effectif dont `totaux` est tiré. Avec `inclureSansValeur=true`, égale le
   * `totalElements` de la liste **non groupée** — mesuré, 116 dossiers. */
  nombreTotal: number;
}

/** Indicateurs d'activité d'une prospection, calculés par la base légataire
 * (`ComSaleProspectionView`) et non stockés.
 *
 * **Le bloc entier vaut `null` sur une pré-prospection** : la vue qui le
 * produit exclut par construction les 3 817 pré-prospections, qui ont la leur.
 * Afficher « 0 interaction » dans ce cas serait faux — l'absence du bloc
 * signifie « non disponible », jamais « zéro ». */
export interface ActiviteProspectionDto {
  /** Jours écoulés depuis la dernière action. C'est le critère de tri des
   * relances du logiciel de bureau. Renseigné sur 100 % des prospections. */
  joursInactivite?: number;
  /** Nombre d'interactions journalisées sur la prospection. 97 %. */
  nbInteractions?: number;
  /** Dernière action, tous types confondus. 97 %. */
  derniereActionDate?: string | null;
  /** Dernière communication avec le prospect. 90 %. */
  derniereCommunicationDate?: string | null;
  /** Résultat de la dernière communication. `null` si aucune — la vue rend une
   * chaîne vide, normalisée en `null` ici. 90 %. */
  derniereCommunicationResultat?: string | null;
  /** Texte de la dernière communication. Même normalisation du vide. 90 %. */
  derniereCommunicationMessage?: string | null;
  /** Date de la relance en cours. `null` si aucune relance active — c'est le
   * cas de 75 % des prospections. */
  alerteActiveDate?: string | null;
  /** Motif de la relance en cours. `null` si aucune. 25 %. */
  alerteActiveRaison?: string | null;
  /** Visites effectuées. 20 %, ce qui correspond aux prospections ayant
   * atteint l'étape visite. */
  nbVisites?: number;
  premiereVisiteDate?: string | null;
  derniereVisiteDate?: string | null;
  /** Projet. Renseigné sur 99 % — la fiche n'exposait jusqu'ici que la tranche. */
  projetId?: UUID | null;
  projetCode?: string | null;
  projetLibelle?: string | null;
  /** CIN du prospect. **Rare : 2,7 %** (387 lignes sur 14 118). La mesure
   * initiale annonçait 99 % en comptant les non-`NULL` d'une colonne qui porte
   * des chaînes vides — à afficher conditionnellement, jamais comme une donnée
   * d'identité fiable. */
  cin?: string | null;
  /** **Le lien de conversion**, jusqu'ici absent de l'API. `null` tant que la
   * prospection n'a pas été transformée, ce qui est le cas de 98 % d'entre
   * elles : c'est le taux de conversion réel (358 dossiers pour 14 118
   * prospections), pas une donnée manquante. */
  dossierId?: UUID | null;
  dossierCode?: string | null;
  /** Client, une fois la prospection transformée. `null` sinon. */
  clientId?: UUID | null;
  /** Statut du dossier issu de la prospection. `null` si non transformée. */
  statutDossier?: string | null;
}

export interface ProspectionDetailDto {
  id: UUID;
  code?: string;
  /** Identifiant du type de document légataire (`StrEntity`). `null` sur les 4
   * prospections dont `StrEntityId` n'est pas renseigné. */
  typeProspectionId?: UUID | null;
  /** Code du type de document — **c'est ce champ qu'il faut tester**, jamais le
   * libellé. Valeurs observées : `ComProspection` (14 114 lignes),
   * `ComPreProspection` (3 817), `RntProspection` (4, location).
   *
   * `null` ne veut pas dire « donnée manquante » mais **anomalie de
   * création** : la prospection ne porte aucun type, et elle est alors
   * *invisible dans le logiciel de bureau*, dont toutes les vues font un
   * `INNER JOIN` sur `StrEntity`. 4 lignes en base réelle. Une fiche qui
   * s'ouvre ici mais que le métier ne retrouve pas là-bas, c'est ce cas. */
  typeProspectionCode?: string | null;
  /** Libellé d'affichage du type, traduit. **Ne pas s'en servir pour tester le
   * type** — voir `typeProspectionCode`. */
  typeProspection?: string | null;
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
  // --- Huit champs mesurés morts -------------------------------------------
  // 0 ligne renseignée sur 14 114, sauf `prix` (4 lignes, et `0` — jamais
  // `null` — ailleurs). La spec dit « ne pas afficher » : la fiche ne les
  // montre plus en consultation. **La saisie est conservée** — « 0 ligne
  // aujourd'hui » ne veut pas dire « inutile demain », et retirer une capacité
  // d'un formulaire est une décision métier, pas une lecture de statistique.
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
  /** Libellés de la tranche et du lot, servis par l'API depuis le début mais
   * jamais reflétés ici : la fiche n'avait que les identifiants et devait
   * refaire un appel pour nommer ce qu'elle affichait. Aucune description
   * springdoc, contrairement au reste du DTO — le taux de population n'est
   * donc pas documenté. */
  trancheCode?: string;
  trancheDescription?: string;
  articleId?: UUID;
  articleCode?: string;
  articleDescription?: string;

  // -- Enrichissement « rang 5 » : société, coordonnées, codes, audit --------
  //
  // La fiche était **plus pauvre que la liste** : le lot « sélection de
  // colonnes » avait enrichi ProspectionListItemDto de 18 colonnes sans que le
  // détail reçoive le même traitement — l'écran affichait la société en colonne
  // puis la perdait en cliquant dessus. Les noms de champs sont **les mêmes que
  // ceux de la liste**, volontairement.
  //
  // Les codes de référentiel s'**ajoutent** aux libellés déjà servis, ils ne
  // les remplacent pas : `origine` reste le libellé, `origineCode` le code.

  /** Code du tiers, ex. `26/14520`. */
  prospectCode?: string | null;
  /** Type du **tiers** (`PRO`, `PRORNT`). ⚠️ À un caractère près de
   * `typeProspectionCode`, et ce n'est pas la même notion : celui-ci qualifie
   * le prospect, l'autre le document. Le piège est hérité de la liste. */
  typeProspect?: string | null;
  /** Identifiant du type de tiers. **100 %.** Déclaré parce qu'il est au
   * contrat ; aucun écran ne le consomme encore, faute de référentiel des
   * types de tiers vers lequel lier. */
  typeProspectId?: UUID | null;
  typeProspectLibelle?: string | null;
  /** Mobile de la fiche tiers. L'indicatif **n'a pas de `+`** — c'est `212`.
   * L'affichage se compose. */
  mobileProspect?: string | null;
  indicatifMobile?: string | null;
  /** Email de la fiche tiers, à distinguer de `tempEmail`, saisi sur la
   * prospection elle-même. */
  emailFiche?: string | null;
  commercialCode?: string | null;
  origineCode?: string | null;
  origineSupportCode?: string | null;
  etapeCode?: string | null;
  vocationCode?: string | null;
  typeContactCode?: string | null;
  actionCommercialeCode?: string | null;
  raisonFermetureCode?: string | null;
  /** Entité juridique (ADMOD, GHRIZA). **Dérivée de la tranche**, jamais
   * saisie : sans tranche, pas de société. */
  societeId?: UUID | null;
  societeCode?: string | null;
  societeLibelle?: string | null;
  /** Renseignés sur 100 % des prospections **qui portent un article**, ce qui
   * ne fait que 5,7 % du portefeuille. */
  articleCategorie?: string | null;
  articleType?: string | null;
  paysId?: UUID | null;
  paysCode?: string | null;
  pays?: string | null;

  /* Piste d'audit. ⚠️ Le guide backend les annonce à 100 % (34,3 % pour
     `creePar`), **mais c'est faux sur les fiches anomales** : mesuré, une fiche
     sans bloc `activite` — celles créées par `POST /api/prospections`, sans
     `StrEntityId` — a aussi ces quatre champs à `null`, ainsi que
     `prospectCode` et `typeProspection*`. Le repli du §2.1 du guide ne couvre
     donc pas assez large : ce n'est pas seulement `activite` qui manque. */
  creePar?: string | null;
  creeLe?: string | null;
  modifiePar?: string | null;
  modifieLe?: string | null;

  // -- Rang 6 : tri manuel et doublons ---------------------------------------
  //
  // L'équipe marque ses leads dans les champs libres du logiciel de bureau —
  // les « Donnée 1 » à « Donnée 10 » de son formulaire, `TempField1` à
  // `TempField10`. **L'API n'en expose que deux**, les seuls qui portent
  // quelque chose d'exploitable : `TempField1` et `TempField10`. Les huit
  // autres n'ont pas d'endpoint, et il n'y a donc pas de « Donnée 2 » à
  // afficher.
  //
  // Ce que ça change concrètement : 798 pré-prospections — **20,9 % du
  // vivier** — sont marquées doublon ou spam, et 795 d'entre elles sont encore
  // à l'étape « 1 A TRAITER ». Sans ce champ, la liste présente environ 800
  // déchets comme du travail à faire. Le marqueur **ne change pas l'étape** :
  // le traitement visuel est une décision du front.

  /** Marqueur normalisé, déduit de `noteQualification` par correspondance
   * exacte (casse et accents ignorés). Volumes réels : `DOUBLON` 921,
   * `SPAM` 32, `TRAITE` 10.
   *
   * ⚠️ **`null` ne veut pas dire « pas de note »** mais « pas un marqueur
   * reconnu », et c'est le cas le plus fréquent : 1 239 lignes portent un
   * texte libre non normalisé. Toujours regarder `noteQualification`. */
  marqueurTri?: 'DOUBLON' | 'SPAM' | 'TRAITE' | null;
  /** Le champ libre d'origine (`TempField1`), servi tel quel — ni la casse ni
   * l'orthographe ne sont corrigées, précisément parce qu'elles ne sont pas
   * interprétables.
   *
   * **Son sens dépend de la population** : sur une pré-prospection c'est un
   * marqueur de tri (« Doublon », « spam ») ; sur une prospection c'est le plus
   * souvent la typologie recherchée — `salon_+_2_chambres` (518 lignes) — et
   * parfois une ville ou un budget. Mesuré : « Casablanca » et « Salé »
   * rendent bien `marqueurTri: null`. */
  noteQualification?: string | null;
  /** Code du tiers que cette fiche duplique (`TempField10`). 849 lignes.
   * Toujours renseigné quand le pointeur existe, **même si la résolution
   * échoue** — d'où la distinction avec les deux champs suivants. */
  doublonDeCode?: string | null;
  /** Le tiers dupliqué, une fois le code résolu.
   *
   * ⚠️ **`doublonDeCode` peut exister sans `doublonDeId`** : `CfgTier.Code`
   * n'est pas unique en base (14 516 tiers pour 14 504 codes), et sur un code
   * ambigu le serveur refuse d'en désigner un au hasard. Le lien cliquable est
   * donc conditionné à `doublonDeId`, pas à `doublonDeCode`. */
  doublonDeId?: UUID | null;
  doublonDeNom?: string | null;

  /** Bloc d'indicateurs d'activité calculés par la base légataire. Porte
   * notamment `dossierId` — le lien de conversion, que ce DTO n'a jamais eu au
   * premier niveau malgré une déclaration d'espoir restée ici longtemps.
   * **`null` en entier sur une pré-prospection** (voir le type). */
  activite?: ActiviteProspectionDto | null;
}

export interface TransformerProspectionRequest {
  /** Commercial (CfgTier) affecté à la prospection. Obligatoire (spec du 21/09). */
  commercialId: UUID;
  /** Tranche (projet) à rattacher — posée ou remplacée au moment de la
   * transformation. Si omise, la prospection doit **déjà** porter une tranche,
   * sinon 400. */
  trancheId?: UUID;
  /** Article/lot principal optionnel. S'il est fourni, il DOIT appartenir à la
   * tranche effective (celle de `trancheId`, ou celle déjà posée) — 400 sinon. */
  articleId?: UUID;
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
  /* `trancheId`/`articleId` retirés : absents du schéma spec de cette requête,
     et jamais posés sur l'`infoForm` qui l'alimente. La tranche principale se
     change par son propre endpoint, `PATCH .../tranche-principale`, dont le
     corps est `ModifierTranchePrincipaleRequest`. Deux chemins pour le même
     champ, dont un mort, c'était l'invitation à envoyer sur le mauvais. */
}

export interface ChangerEtapeRequest {
  etapeId: UUID;
  note?: string;
}

export interface ArchiverProspectionRequest {
  raisonId?: UUID;
  raisonTexte?: string;
}

// --- Pré-prospection : création (`POST /api/pre-prospections`) et import CSV
// des leads (`POST /api/pre-prospections/import/apercu` puis `/import`) —
// FEATURE-creation-pre-prospection.md. Le contact vit en champs libres
// (`TempDescription`/`TempTel`/`TempEMail`) : aucune fiche prospect n'est
// créée ici, c'est l'objet de `creer-prospect` puis `transformer`. ---

/** Lead brut, non qualifié. Seul `nom` est obligatoire ; le serveur pose le
 * code (`AA/NNNNN`, même compteur que les prospections), la date, `IsClosed =
 * false`, l'auteur, et la vocation `VENTE` si aucune n'est fournie. */
export interface CreerPreProspectionRequest {
  /** `TempDescription`, 255 max, non blanc — 400 sinon. */
  nom: string;
  /** `TempTel`, 255 max, stocké tel quel (la hotline le retrouve par ses
   * 9 derniers chiffres, quel que soit le format). */
  telephone?: string;
  /** `TempEMail`, 255 max. */
  email?: string;
  /** `Notes`, 1 000 max. */
  notes?: string;
  /** Optionnel ; 400 si inconnue, **403** si son projet est hors du périmètre
   * commercial de l'appelant. */
  trancheId?: UUID;
  /** Exige `trancheId` et doit lui appartenir (400 sinon). */
  articleId?: UUID;
  etapeId?: UUID;
  origineId?: UUID;
  origineSupportId?: UUID;
  typeContactId?: UUID;
  actionCommercialeId?: UUID;
  /** Absente : la vocation de code `VENTE`. */
  vocationId?: UUID;
}

/** Prospection existante au même contact que celle qui vient d'être créée. */
export interface DoublonPreProspectionDto {
  /** Ouvrable par `GET /api/prospections/{id}`. */
  id: UUID;
  /** P.ex. `26/05940` ; peut être atypique (`50`) sur les leads injectés. */
  code?: string | null;
  /** `UserCreateDateTime`, null sur certaines lignes anciennes ou importées. */
  dateCreation?: string | null;
}

/** Réponse 201 de la création. Les doublons sont **signalés, jamais
 * refusés** : OMRAN enregistre lui aussi une ligne par soumission. */
export interface PreProspectionCreeeDto {
  preProspection: ProspectionDetailDto;
  /** Même nom (sans casse ni espaces de bord), même téléphone (9 derniers
   * chiffres) et même email (sans casse) — un champ absent des deux côtés
   * compte comme égal. Les plus récents d'abord, 50 au plus, et seulement
   * ceux que l'appelant a le droit de voir. **Vide = aucun doublon visible.** */
  doublons: DoublonPreProspectionDto[];
}

/** Sort d'une ligne du fichier importé :
 * - `NOUVELLE` — aucun contact identique connu ; créée.
 * - `DOUBLON` — même contact qu'une prospection existante (ou qu'une ligne
 *   plus haut) mais **autre date** de soumission : créée quand même, signalée.
 * - `DEJA_IMPORTEE` — même contact **et même date** (à la minute) : le même
 *   lead réimporté ; ignorée.
 * - `ERREUR` — ligne inexploitable (`message`) ; ignorée. */
export type StatutLigneImport = 'NOUVELLE' | 'DOUBLON' | 'DEJA_IMPORTEE' | 'ERREUR';

/** Une ligne du fichier importé : ce qui en a été extrait, et son sort. */
export interface LigneImportDto {
  /** Numéro de ligne dans le fichier, l'en-tête étant la ligne 1. */
  ligne: number;
  /** Colonne « Créé », devenue la date du document. Null si illisible. */
  dateCreation?: string | null;
  nom?: string | null;
  /** « Téléphone », à défaut « Numéro WhatsApp », à défaut le secondaire. */
  telephone?: string | null;
  email?: string | null;
  /** Colonne « Formulaire », recopiée dans les notes. */
  formulaire?: string | null;
  statut: StatutLigneImport;
  /** Explication du statut, en clair — null pour une `NOUVELLE` importée (ou en aperçu). */
  message?: string | null;
  /** Pré-prospection créée. Null dans l'aperçu, hors sélection (`statuts`),
   * et pour `DEJA_IMPORTEE` / `ERREUR`. */
  preProspectionId?: UUID | null;
  /** Code de la pré-prospection créée (`AA/NNNNN`). Null comme `preProspectionId`. */
  code?: string | null;
  /** Prospections existantes au même contact (`DOUBLON` et `DEJA_IMPORTEE`). */
  doublonIds?: UUID[] | null;
}

// --- Suivi des actions (`GET /api/suivi-actions`, `/groupes`, catalogue
// `GET /api/referentiels/colonnes/suivi-actions`) — FEATURE-suivi-actions.md.
// L'écran OMRAN « Suivi des actions » : appels, visites, messages saisis par
// chaque commercial. Consultation seule. ---

/** Une action commerciale telle que l'affiche l'écran OMRAN. **Seules les
 * colonnes demandées par `?colonnes=` sont présentes** ; `id` toujours.
 * `rang`, `alerteActive`, `etat` et `personnel` sont calculées pour la page
 * servie : ni triables ni groupables. */
export interface SuiviActionDto {
  id: UUID;
  /** Auteur tel qu'écrit sur la ligne (`UserName`) — la colonne que filtre
   * OMRAN. « Système » ou vide pour une action générée. */
  utilisateur?: string | null;
  typeAction?: string | null;
  /** Rang parmi les actions du même type pour le même tiers, 1 = la plus
   * récente (hors système et impayées). */
  rang?: number | null;
  /** `DocDate`. */
  dateAction?: string | null;
  /** `AlertValidityDate`, null si aucune alerte. */
  dateAlerte?: string | null;
  alerteActive?: boolean | null;
  /** Prospection, Dossier de vente… */
  categorie?: string | null;
  /** Sous-catégorie, p.ex. « Rendez vous pris ». */
  resultat?: string | null;
  /** Note saisie (`AlertMessage`). */
  message?: string | null;
  impaye?: boolean | null;
  /** Générée par le système (relance, événement…). */
  systeme?: boolean | null;
  /** Rarement renseigné : le type porte le sens. */
  entrante?: boolean | null;
  /** Commercial concerné — pas l'auteur. Vide sur 23 % des actions réelles. */
  commercial?: string | null;
  personnel?: string | null;
  tiersNom?: string | null;
  prospectionCode?: string | null;
  dossierCode?: string | null;
  /** Statut du dossier de l'action, sinon du dossier né de sa prospection,
   * sinon sa catégorie. */
  etat?: string | null;
  articleCode?: string | null;
  articleLibelle?: string | null;
  /** Tranche résolue comme OMRAN : celle de la prospection, sinon de l'article. */
  trancheCode?: string | null;
  trancheLibelle?: string | null;
  programme?: string | null;
  entite?: string | null;
  typeId?: UUID | null;
  categorieId?: UUID | null;
  tiersId?: UUID | null;
  prospectionId?: UUID | null;
  dossierId?: UUID | null;
  trancheId?: UUID | null;
  creePar?: string | null;
  creeLe?: string | null;
  modifiePar?: string | null;
  modifieLe?: string | null;
}

/** Rapport d'import de leads — même forme pour l'aperçu et l'import. */
export interface RapportImportPreProspectionsDto {
  /** `false` pour l'aperçu (rien n'est écrit), `true` après l'import. */
  importe: boolean;
  /** Tranche à laquelle **toutes** les lignes ont été rattachées. Null dans l'aperçu. */
  trancheId?: UUID | null;
  trancheCode?: string | null;
  /** Tranche **proposée** : celle dont le code est le premier mot du nom de
   * formulaire (`APF FORM 02*2026` → `APF`), si tous les formulaires du fichier
   * désignent la même. Null sinon — l'utilisateur choisit. */
  trancheSuggereeId?: UUID | null;
  trancheSuggereeCode?: string | null;
  /** Noms de formulaires distincts trouvés dans le fichier. */
  formulaires: string[];
  /** Mises en garde à montrer avant de confirmer (p.ex. plusieurs tranches). */
  avertissements: string[];
  /** Lignes de données (en-tête et lignes vides exclues). */
  totalLignes: number;
  nouvelles: number;
  /** Créées si sélectionnées (`statuts`). Compteur de classification. */
  doublons: number;
  /** Ignorées. */
  dejaImportees: number;
  /** Ignorées. */
  erreurs: number;
  /** Le détail, ligne par ligne, dans l'ordre du fichier. */
  lignes: LigneImportDto[];
  /** Statuts effectivement importés, dans l'ordre `NOUVELLE`, `DOUBLON`
   * (défaut : les deux). Null dans l'aperçu. */
  statutsImportes?: StatutLigneImport[] | null;
  /** Lignes réellement écrites (`preProspectionId` non null). 0 dans l'aperçu. */
  creees: number;
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
  /** Code de la tranche. */
  tranche?: string;
  /** Libellé de la tranche. `tranche` porte le code, celui-ci le libellé — le
   * couple suit la même convention que `trancheCode`/`trancheDescription`
   * ailleurs, malgré des noms moins explicites ici. */
  trancheDescription?: string;
  articleId?: UUID;
  /** Code de l'article. */
  article?: string;
  articleDescription?: string;
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
  /** Taux de commission, **en ratio** (0.03 = 3 %), repris de l'offre. `null`
   * si non renseigné.
   *
   * Attention à l'incohérence d'unité dans ce même objet : `remisePercent` est
   * un pourcentage entier (5 = 5 %), celui-ci un ratio. Les deux ne se
   * formatent pas pareil. */
  commissionPercent?: number;
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
  /** Plan de financement (AUTO-FINANCEMENT / AVANCE / FRAIS SYNDIC) calculé
   * sur le prix de vente TTC **après remise** de l'offre — même calcul que
   * `POST /api/dossiers/simulation-financement`. Vide si l'offre n'a pas de
   * prix, donc à traiter comme « rien à afficher » et non comme une erreur.
   *
   * Réutilise `LigneSchemaFinancementDto`, déjà déclaré plus bas pour la
   * simulation : c'est la même forme de ligne, il n'y a pas deux modèles. */
  schemaFinancement?: LigneSchemaFinancementDto[];
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
  /** Id de la **catégorie** de l'interaction — à ne pas confondre avec
   * `resultatId`, qui est la sous-catégorie. Renseignée sur 100 % des 48 160
   * interactions réelles. */
  categorieId?: UUID | null;
  /** Libellé de la catégorie. Sert de discriminant : `Prospection` (46 666
   * lignes), `Dossier de vente (Réservation)` (1 325), `Dossier de vente
   * (Livraison)` (167), `Réclamation` (2). */
  categorie?: string | null;
  /** Tranche de rattachement, déduite comme le fait le logiciel de bureau : la
   * tranche de la **prospection** quand `categorie` vaut "Prospection", celle
   * du **lot** sinon. Renseignée sur 96 % ; `null` quand ni l'une ni l'autre
   * n'en porte. */
  trancheId?: UUID | null;
  trancheCode?: string | null;
  trancheLibelle?: string | null;
  /** Projet, déduit de la tranche. 96 %. `null` si `trancheId` est `null`. */
  projetId?: UUID | null;
  projetCode?: string | null;
  projetLibelle?: string | null;
}

/** Issue de l'envoi sur **un** canal (email ou WhatsApp).
 *
 * Les deux canaux sont indépendants : l'un peut aboutir pendant que l'autre
 * échoue, et c'est le cas attendu plus d'une fois sur deux — 99 % des
 * prospects ont un numéro exploitable, seulement 57 % une adresse email. */
export interface CanalEnvoiDto {
  /** Vrai si le message est parti sur ce canal. */
  envoye?: boolean;
  /** Raison de l'issue sur ce canal. Trois valeurs connues, deux d'entre
   * elles appelant des gestes **différents** du commercial :
   * `DESTINATAIRE_ABSENT` — aucune coordonnée, il faut l'obtenir ;
   * `NUMERO_INEXPLOITABLE` — un numéro existe mais est à réparer dans la
   * fiche (43 cas réels : longueurs anormales, numéros fixes) ;
   * `SERVICE_INACTIF` — configuration serveur.
   * D'autres valeurs peuvent apparaître : afficher le motif brut plutôt que
   * de le taire. */
  motif?: string;
  /** Destinataire retenu, en clair — le commercial doit pouvoir vérifier que
   * c'est le bon. Adresse email ou numéro au format international selon le
   * canal. `null` si aucun destinataire exploitable. */
  destinataire?: string | null;
  /** Plans joints. **Toujours 0 sur WhatsApp** : l'envoi d'un document par
   * UltraMsg exige une URL publique, or celles du stockage expirent en quinze
   * minutes. Sur le canal email, vaut le plus souvent 0 également — le lot
   * précis n'est connu que dans 3 % des prises de rendez-vous. Zéro n'est
   * donc pas un symptôme. */
  nombrePiecesJointes?: number;
}

/** Issue d'un renvoi de la confirmation de visite, **sur les deux canaux**.
 *
 * **Renvoyé avec un 200 même quand rien n'est parti.** Un prospect sans
 * coordonnée exploitable n'est pas une erreur d'appel, et le commercial a
 * besoin de savoir *pourquoi* pour y remédier — ce qu'un 4xx générique ne
 * dirait pas. Ne pas traiter `envoye: false` comme un échec technique. */
export interface ResultatEnvoiVisiteDto {
  /** Vrai dès qu'**au moins un** des deux canaux a abouti — la lecture utile
   * pour un affichage binaire « prévenu / pas prévenu », et rien de plus :
   * l'asymétrie entre les deux canaux étant la norme, s'y limiter reviendrait
   * à taire une fois sur deux que l'email n'est pas parti. */
  envoye?: boolean;
  email?: CanalEnvoiDto;
  whatsapp?: CanalEnvoiDto;
}

/** Corps de `POST /api/prospections/{id}/offre-prix`. **Tout est facultatif** :
 * un corps vide signifie « plein tarif du lot », et c'est un appel valide. */
export interface EnvoyerOffrePrixRequest {
  /** Taux de remise en **pourcentage** (5 pour 5 %), pas un ratio 0–1 —
   * contrairement à `DossierDetailDto.discount`. Défaut 0. La remise est le
   * cas courant : 195 des 298 offres réelles en portent une. */
  remisePercent?: number;
  /** Prix de vente TTC imposé, qui **remplace** le prix commercial du lot
   * comme base de calcul. Laisser vide pour partir du prix catalogue. */
  prix?: number;
  /** Mode de paiement envisagé, repris sur l'offre. Voir `getModesPaiement()`. */
  modePaiementId?: UUID;
  /** Note libre reprise sur l'offre. */
  notes?: string;
}

/** Issue de `POST /api/prospections/{id}/offre-prix`, **sur les deux canaux**.
 *
 * Même contrat que `ResultatEnvoiVisiteDto` — 200 même quand rien n'est parti,
 * `envoye` racine vrai dès qu'un canal a abouti — avec deux différences qui
 * changent l'affichage :
 *
 * 1. **L'offre existe indépendamment de l'envoi.** Elle est créée (ou
 *    réutilisée) *avant* la tentative et le reste quoi qu'il arrive :
 *    `offreId` et `offreCode` sont donc toujours renseignés, y compris quand
 *    les deux canaux échouent. Ne pas conditionner leur affichage à `envoye`,
 *    sinon le commercial croit l'offre perdue alors qu'elle est numérotée.
 * 2. **L'asymétrie des canaux s'inverse à cette étape** : 19,7 % des prospects
 *    y ont une adresse email contre 99,7 % un numéro exploitable — là où la
 *    confirmation de visite est à 57 %/99 %. Un email non parti est donc ici
 *    le cas *ordinaire*, et le WhatsApp porte le montant en clair pour cette
 *    raison. Les chiffres cités sur `CanalEnvoiDto` sont ceux de la visite. */
export interface ResultatEnvoiOffreDto {
  /** Vrai dès qu'**au moins un** des deux canaux a abouti. */
  envoye?: boolean;
  /** Identifiant de l'offre créée ou réutilisée (`StlQuote`). */
  offreId?: UUID;
  /** Numéro de l'offre, au format legacy `{année}/{numéro}`. */
  offreCode?: string;
  /** Vrai si une offre existante a été réexpédiée plutôt qu'une nouvelle
   * créée. N'arrive que si l'appel ne demandait ni remise ni prix — réécrire
   * les montants modifierait un document que le prospect détient déjà. */
  offreReutilisee?: boolean;
  /** Prix de vente TTC après remise, tel qu'annoncé au prospect sur les deux
   * canaux. C'est le montant à réafficher, pas celui saisi dans le formulaire. */
  prixFinalTTC?: number;
  /** Issue du canal email. **Seul canal à porter le PDF de l'offre.** */
  email?: CanalEnvoiDto;
  /** Issue du canal WhatsApp. Porte le montant en texte, jamais de document. */
  whatsapp?: CanalEnvoiDto;
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
  /* Classification de l'article, livrée en quatre triplets Id/Code/Libellé.
     Tous à **100 %** sur les 358 articles de dossier réels — donc affichables
     sans repli, contrairement à la plupart des champs de ce fichier.

     Convention constante ici : l'`Id` pour lier, le `Code` pour comparer, le
     `Libellé` pour afficher.

     `categorieId`, `etageId` et `immeubleId` n'ont donc **aucun consommateur**
     pour l'instant, et c'est normal : aucun de ces trois référentiels n'a
     d'écran vers lequel lier. Ils sont déclarés parce qu'ils existent au
     contrat, pas parce qu'un appelant les attend. Comparer avec `projetId` /
     `trancheId` sur `DossierDetailDto`, qui ont une route et sont cliquables. */
  typeId?: UUID;
  typeCode?: string;
  typeLibelle?: string;
  categorieId?: UUID;
  categorieCode?: string;
  categorieLibelle?: string;
  etageId?: UUID;
  etageCode?: string;
  etageLibelle?: string;
  /** L'immeuble — la seule des quatre dimensions qui n'existait nulle part
   * ailleurs dans le front avant cette livraison. */
  immeubleId?: UUID;
  immeubleCode?: string;
  immeubleLibelle?: string;
  /** Type de présentation du lot — la case « Présentation » de l'écran
   * légataire. **25/25 mesuré** sur les articles de dossier, contrairement aux
   * 23,2 % qu'annonçait l'ancien champ homonyme de `DossierDetailDto`. */
  presentationCode?: string | null;
  presentationLibelle?: string | null;
  /** Numéro de titre foncier du lot.
   *
   * **Deux chemins serveur divergent ici, et il faut le savoir.** La colonne
   * `articleTitreFoncier` de la liste des dossiers le sert sur 33 dossiers sur
   * 116 ; sur huit de ces dossiers-là, la fiche ne le porte que cinq fois —
   * les trois autres n'ont simplement pas la clé dans leur article. Quand les
   * deux sont présents, ils sont **identiques**. Affichage conditionnel donc,
   * et ne pas conclure d'une absence ici qu'il n'y en a pas. */
  titreFoncier?: string | null;
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
  /** Date de concrétisation. La spec ne la documente pas au-delà du type.
   *
   * À ne pas confondre avec `dateDocument`, qui est la date de réservation :
   * `lib/dossierStatus.ts` dérive « Concrétisation » de la présence de cette
   * date-là. Elle rend donc possible un tri « par date de concrétisation »
   * sur la liste, ce qui demandait jusqu'ici d'ouvrir chaque dossier. */
  dateConcretisation?: string | null;

  // -- Financier (groupe FINANCIER) ------------------------------------------
  prixAvantRemise?: number;
  /** Taux de remise, **en pourcentage entier** (5 = 5 %). Libellé serveur
   * « Remise (%) », type `NOMBRE` : le formatage par défaut convient.
   * À ne pas confondre avec `probabiliteFinalisation`, qui est un ratio. */
  remise?: number;
  remiseMontant?: number;
  prixApresRemise?: number;
  /** Renseigné sur 41,6 % des 358 dossiers réels. */
  montantAvance?: number;
  /** Probabilité de finalisation, **ratio 0–1**, renseignée à 100 %.
   *
   * Le serveur la type `NOMBRE`, si bien que le rendu par défaut de `DataGrid`
   * lui appliquerait `formatNumber(v, 0)` et afficherait « 0 » pour 0,35. Elle
   * exige donc un rendu nommé (`formatPercent`) dans `DossierTable`. */
  probabiliteFinalisation?: number;
  modePaie?: string;

  // -- Patrimoine (groupe PATRIMOINE) ----------------------------------------
  // Ce groupe traverse article → tranche → projet → société : le demander
  // coûte trois jointures paresseuses par ligne, ne pas le demander n'en coûte
  // aucune. Tous les champs sont à 100 % en base réelle.
  /** **Provient de la tranche de l'article** — `StkItem.CfgProjectId` est nul
   * sur les 358 articles réels. */
  projetId?: UUID;
  projetCode?: string;
  projetLibelle?: string;
  trancheId?: UUID;
  trancheCode?: string;
  trancheLibelle?: string;
  societeId?: UUID;
  societeCode?: string;
  societeLibelle?: string;
  vocationCode?: string;
  vocationLibelle?: string;

  // -- Article (groupe ARTICLE) ----------------------------------------------
  // Le **lot lui-même**, par opposition au groupe PATRIMOINE qui décrit la
  // chaîne au-dessus de lui (tranche → projet → société). Mesuré sur les 116
  // dossiers servis : les six premiers champs sont à 116/116, seul le titre
  // foncier manque souvent. Coût mesuré du groupe entier : ~75 ms → ~175 ms
  // sur une page de 20.
  /** `StkItem.PKey`. 100 % des 358 dossiers. Masqué de la grille comme les
   * autres clés de jointure — voir `DISPOSITION_DOSSIERS.masquees`. */
  articleId?: UUID;
  /** **La clé de tri par défaut de la liste du logiciel de bureau**
   * (`ORDER BY ArticleCode, H1Code, H2Code, H3Code`, où H1/H2/H3 sont la
   * tranche, le projet et la société — déjà servis ici). À savoir si l'ordre
   * de la liste doit un jour reproduire celui d'Omran. */
  articleCode?: string;
  articleLibelle?: string;
  /** Numéro de titre foncier. Mesuré 33/116 sur les dossiers servis. */
  articleTitreFoncier?: string;
  /** Bâtiment (`StkBuilding`). 1 063 des 1 068 articles réels. Porte une
   * phrase, pas un code : « Immeuble 05 ». */
  bloc?: string;
  /** Étage (`StkFloor`). 1 063 / 1 068. « Rez de chaussé », « 2 ème étage ». */
  etage?: string;
  /** Code catégorie. Ex. `APP`. */
  categorieArticle?: string;
  /** Code type. Ex. `T3`. */
  typeArticle?: string;
  /** Code du type de présentation. */
  typePresentation?: string;

  // -- Délais (groupe DELAIS) ------------------------------------------------
  // Trois durées en **jours entiers**, calculées par le serveur et jamais
  // stockées. Le libellé du catalogue porte déjà l'unité — « Délai notaire
  // (j) » — si bien que le formatage `NOMBRE` par défaut les sert
  // correctement : ce ne sont pas des ratios déguisés, contrairement à
  // `remise`. Elles sont donc légitimement sommables, même si une moyenne
  // dirait davantage.
  /** Jours entre l'origine du dossier et sa concrétisation. L'origine est la
   * date de la **prospection** quand il y en a une, sinon celle du dossier —
   * même règle que le logiciel de bureau. `null` tant que la concrétisation
   * n'a pas eu lieu : calculable sur 152/358. Mesuré de 0 à 443. */
  delaiConcretisation?: number | null;
  /** Jours entre la **concrétisation et le compromis** — le nom dit « notaire »
   * mais la borne haute est le compromis. 73/358. */
  delaiNotaire?: number | null;
  /** Jours entre le compromis et la livraison réelle. 63/358.
   *
   * Le délai de *crédit* du logiciel de bureau n'a pas d'équivalent ici : il
   * dépend de `CreditPossessionDate`, mesurée à **0 ligne sur 358**. Ne pas le
   * réclamer au backend, il vaudrait `null` partout. */
  delaiLivraison?: number | null;
  /** `ComFolder.AgreementDate`. 73/358. */
  dateCompromis?: string | null;
  /** `ComFolder.DeliveryDateReal`. 63/358. */
  dateLivraisonReelle?: string | null;

  // -- Acteurs (groupe ACTEURS) ----------------------------------------------
  /** Notaire. 19,3 %. */
  avocatId?: UUID;
  avocatNom?: string;
  /** `ComFolder.CfgSaleManagerId`. Masqué de la grille comme les autres clés
   * de jointure. */
  responsableVenteId?: UUID;
  /** Responsable de vente — **acteur distinct du commercial**, et non un
   * synonyme : 221 des 358 dossiers réels (61 %) en portent un. Le second
   * responsable du légataire (`CfgSaleManager2Id`) n'est pas exposé, mesuré à
   * 0 ligne. */
  responsableVenteNom?: string;

  // -- Origine (groupe ORIGINE) ----------------------------------------------
  // Ce groupe déréférence la prospection : même arbitrage que PATRIMOINE.
  /** `null` sur les 3 dossiers (sur 358) sans prospection. */
  etapeProspection?: string;
  /** 99,2 %. Ex. `FACEBOOK`. */
  origineProspection?: string;
  /** 99,2 %. */
  dateProspection?: string | null;

  // -- Traçabilité (groupe AUDIT) --------------------------------------------
  /** 100 % des 358 dossiers réels, comme les trois suivants. */
  creePar?: string;
  creeLe?: string | null;
  modifiePar?: string;
  modifieLe?: string | null;
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
  /** Responsable de vente — **acteur distinct du commercial**. 221/358 (61 %).
   * Le second responsable du légataire n'est pas exposé (0 ligne mesurée). */
  responsableVenteId?: UUID;
  responsableVenteNom?: string;
  /** `ComFolder.AgreementDate`. 73/358. */
  dateCompromis?: string | null;
  /** `ComFolder.DeliveryDateReal`. 63/358. */
  dateLivraisonReelle?: string | null;
  /* Trois durées en **jours entiers**, calculées par le serveur, jamais
     stockées. Voir `DossierListItemDto` pour le détail des bornes et le délai
     de crédit du légataire, qui n'a pas d'équivalent exploitable. */
  /** Origine (prospection si elle existe, sinon dossier) → concrétisation.
   * `null` tant que la concrétisation n'a pas eu lieu. 152/358. */
  delaiConcretisation?: number | null;
  /** Concrétisation → compromis. 73/358. */
  delaiNotaire?: number | null;
  /** Compromis → livraison réelle. 63/358. */
  delaiLivraison?: number | null;
  /* Hiérarchie patrimoniale du dossier, déduite de son article principal.
     Les douze champs sont à **100 %** sur les 358 dossiers réels. */
  trancheId?: UUID;
  trancheCode?: string;
  trancheLibelle?: string;
  /** Projet. 100 % — mais **il provient de la tranche de l'article, pas de
   * l'article** : `StkItem.CfgProjectId` est `null` sur les 358 articles de
   * dossier réels. Ne pas « corriger » en le lisant sur l'article, ce serait
   * retomber sur un champ vide. */
  projetId?: UUID;
  projetCode?: string;
  projetLibelle?: string;
  /** Société / entité juridique. `societeId` est sans consommateur — il n'y a
   * pas d'écran société vers lequel lier ; seul le libellé s'affiche. */
  societeId?: UUID;
  societeCode?: string;
  societeLibelle?: string;
  vocationId?: UUID;
  vocationCode?: string;
  vocationLibelle?: string;
  /* Origine du dossier, reprise de sa prospection. */
  /** 99,2 %. */
  dateProspection?: string | null;
  /** `null` sur les 3 dossiers (sur 358) sans prospection — **cas réel, pas
   * une anomalie** : un dossier peut naître sans passer par la prospection.
   * Absence = « pas de prospection d'origine », jamais « donnée manquante ». */
  etapeProspection?: string | null;
  /** 99,2 %. */
  origineProspection?: string | null;
  /* Piste d'audit. Les quatre à 100 %. */
  creePar?: string;
  creeLe?: string | null;
  modifiePar?: string;
  modifieLe?: string | null;
  articles?: ArticleSummaryDto[];
  prixAvantRemise?: number;
  remise?: number;
  remiseMontant?: number;
  prixApresRemise?: number;
  prix?: number;
  montantAvance?: number;
  totalAPayer?: number;
  notes?: string;
  /** ⚠️ **Fraction, pas pourcentage** : `1.00` signifie 100 %, et c'est bien
   * « 100.00 % » que l'écran légataire affiche pour cette valeur. Mesuré à
   * `1` sur les 10 dossiers de l'échantillon. `formatPercent`, jamais
   * `formatNumber`. */
  probabiliteFinalisation?: number;
  modePaie?: string;

  // -- Les cases du formulaire légataire qui manquaient ----------------------
  //
  // L'écran de bureau montre un pavé de prix HT/TTC que la fiche n'avait pas :
  // elle ne portait que le TTC et ne pouvait donc pas reproduire les lignes
  // « Total HT » et « Prix de vente HT ».

  /** Prix unitaire au m² — la case « Prix du m² ». **98,3 %**. */
  prixM2?: number;
  /** Prix de vente **hors taxes**, après remise. Le pendant HT de `prix`.
   * **98,3 %**. */
  prixHT?: number;
  /** Prix **hors taxes avant remise** — la case « Total HT ». Le pendant HT de
   * `prixAvantRemise`. **98,3 %**. */
  prixAvantRemiseHT?: number;
  /** Taux de TVA du dossier. **42,7 %** — `null` ou zéro sur la majorité des
   * dossiers : **ne pas en déduire un taux nul**, c'est une absence de saisie.
   * Mesuré à `0.2` sur l'échantillon, donc une fraction elle aussi. */
  tauxTVA?: number;
  /* `titreFoncier`, `presentationCode` et `presentationLibelle` ont été
     déclarés ici et n'y sont plus : ce sont des attributs **du lot**, et le
     serveur les a déplacés sur `ArticleSummaryDto`.

     Mesuré avant de les retirer — ils étaient absents de la charge utile sur
     **25 fiches sur 25**, pas seulement vides. Les deux lignes de la fiche qui
     les affichaient montraient donc un tiret en permanence, alors que
     `articles[0].presentationLibelle` est renseigné à 25/25 dans la même
     réponse. Elles lisent désormais l'article. */
  /** Date de validité du statut courant — la date à droite du statut sur
   * l'écran légataire. **11,5 %** : elle n'a de sens que sur les statuts qui
   * expirent, la réservation au premier chef. */
  dateValiditeStatut?: string | null;
  /** Quote-part de l'acquéreur principal.
   *
   * ⚠️ **Fraction, pas pourcentage**, comme `probabiliteFinalisation`.
   * Renseignée à 100 %, mais **95 % valent exactement 1,00** : l'information ne
   * porte que sur les 5 % en indivision. Les quotes-parts des co-acquéreurs se
   * lisent sur `GET /api/dossiers/{id}/payeurs`. */
  quotePart?: number;
  /** Prospection à l'origine du dossier (ComFolder.ComProspectionId) —
   * powers DossierDetail.tsx's "Prospection" cascade-reference tab. Le lien
   * inverse existe désormais, mais imbriqué : `ProspectionDetailDto.activite
   * .dossierId`, alimenté par la vue légataire. */
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
  /** Numéro de décompte rattaché à l'échéance — la colonne « Décompte » de
   * l'écran légataire. **16,5 %** des 921 échéances réelles.
   *
   * En base la colonne n'est jamais `NULL` : elle porte une chaîne vide, que le
   * serveur normalise. Le logiciel de bureau affiche « N.A. » quand il n'y en a
   * pas — c'est un choix d'affichage, à refaire ici et non à attendre de
   * l'API. */
  decompte?: string | null;
  /** Date de création de la ligne, 100 %. **À ne pas confondre avec
   * `dateEcheance`**, qui est la date d'exigibilité : une échéance créée le
   * 10/12/2025 peut être exigible le 10/12/2026. */
  creeLe?: string | null;
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

  // -- Ajouts de la livraison « catalogue de colonnes » ----------------------
  // Le spec ne documente aucun de ces treize champs — les taux ci-dessous sont
  // **mesurés** sur les 332 règlements servis, pas recopiés.
  /** Libellé du règlement. **La colonne la plus informative du lot** :
   * 332/332 renseignées, 327 valeurs distinctes, du genre
   * « CHÈQUE BMCE BANK N° … du 01/09/2026 ». */
  description?: string;
  /** 332/332, 70 valeurs distinctes. Agrégeable — c'est un montant, donc une
   * quantité sommable, pas un taux comme `remise` côté dossiers. */
  montantBase?: number;
  /** Le tiers qui **paie**, distinct du tiers du règlement : 332/332 et 94
   * valeurs distinctes. Masqué de la grille comme les autres `*Id`. */
  tierPayeurId?: UUID;
  tierPayeurNom?: string;
  /** 12/332 seulement. Servi parce que le contrat le publie ; ne pas en faire
   * une colonne que l'on croit remplie. */
  recuCode?: string;
  /** 332/332. */
  remisAuCentre?: boolean;
  /** **1/332.** Voir `recuCode`. */
  dateRemiseAuCentre?: string | null;
  /** **0/332 mesuré** — la colonne existe et reste vide sur tout le périmètre
   * servi. Laissée au catalogue plutôt que masquée : c'est au serveur de dire
   * ce qu'il publie, pas au front de filtrer sur ses propres relevés. */
  bordereauCode?: string;
  /** **1/332.** */
  dateBordereau?: string | null;
  /** Traçabilité, 332/332 les quatre. */
  creePar?: string;
  creeLe?: string | null;
  modifiePar?: string;
  modifieLe?: string | null;
}

/** Imputation d'une part d'un règlement sur **une** échéance.
 *
 * C'est la réponse à « ce règlement, il a payé quoi ? », que la liste ne sait
 * pas donner : elle n'expose que le `dossierCode` de la **première** ligne.
 * Mesuré sur 80 règlements réels : 79 n'ont qu'une affectation, mais un en
 * porte trois, sur **trois dossiers différents** — la liste en affichait un et
 * masquait les deux autres.
 *
 * Invariant vérifié 80/80 : la somme des `montantAffecte` vaut
 * `montantBrut - montantBrutRestant`. */
export interface AffectationDto {
  /** `StlSettlementLine`. */
  id: UUID;
  /** Part du règlement imputée à **cette** échéance — **pas** le montant du
   * règlement. Un règlement qui couvre trois échéances porte trois lignes dont
   * la somme fait son montant brut. */
  montantAffecte?: number;
  echeanceId?: UUID;
  /** Code de l'échéance, tel qu'il apparaît dans l'échéancier du dossier. */
  echeanceCode?: string;
  /** Libellé de l'échéance. Ex. « 2ème tranche ». */
  echeanceDescription?: string;
  dateEcheance?: string | null;
  /** Montant **total** de l'échéance, toutes imputations confondues. À
   * comparer à `montantAffecte` pour savoir si ce seul règlement la solde. */
  montantEcheance?: number;
  categorieId?: UUID;
  /** Code de catégorie de l'échéance : AVANCE, FRAIS SYNDIC… */
  categorie?: string;
  /** Dossier portant l'échéance. **Peut différer d'une ligne à l'autre** :
   * c'est tout l'intérêt de cette ressource. */
  dossierId?: UUID;
  dossierCode?: string;
}

/** La fiche d'un règlement : les mêmes champs que la ligne de liste, **non
 * filtrés par `?colonnes=`**, plus ses affectations.
 *
 * « Une fiche dit tout, là où une grille laisse choisir ses colonnes. » Aucune
 * clé de la liste ne disparaît et aucune ne change de type — l'extension est
 * strictement additive. */
export interface EncaissementDetailDto extends EncaissementDto {
  /** Les échéances que ce règlement solde, par montant croissant — l'ordre de
   * l'écran légataire. **Tableau vide** = règlement encaissé mais pas encore
   * imputé ; c'est le cas des pièces que la liste n'affiche pas du tout. */
  affectations?: AffectationDto[];
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
  /** Statut à la création. **Seul `IN_WORK` est accepté** — ou l'absence de
   * valeur, qui lui est équivalente.
   *
   * Typé au littéral et non `string` exprès : `POINTED` est **refusé (400)**,
   * parce que pointer un règlement exige une preuve de paiement, or aucune
   * pièce jointe ne peut exister avant le règlement lui-même. Le littéral rend
   * ce 400 impossible à écrire.
   *
   * Le parcours « saisir directement en pointé » n'existe pas en un appel : il
   * s'obtient en trois — créer ici, déposer la preuve sur
   * `POST .../reglements/{reglementId}/pieces-jointes`, puis
   * `PATCH .../reglements/{reglementId}/statut`. */
  statut?: 'IN_WORK';
  /* `dateReglement` est **délibérément absent de cette interface**, alors que
     la spec le déclare sur ce schéma.

     Le serveur le **refuse à la création (400 si fourni)** : il ne se renseigne
     qu'au passage à `POINTED`. Le mirrorer ici en ferait un champ que
     l'autocomplétion propose et que le serveur rejette — le miroir sert à
     appeler l'API correctement, pas à reproduire la spec à l'identique.

     Ne pas l'ajouter « pour compléter » : un audit spec-contre-types.ts le
     signalera comme manquant à chaque passage, et c'est voulu. */
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

/** Triade d'une ligne de synthèse financière.
 *
 * `reste` vaut **toujours** `montant − regle` — vérifié par le serveur sur les
 * 358 dossiers réels, et re-vérifié ici sur un échantillon sans écart. Servi
 * plutôt que recalculé pour que l'écran et l'API ne puissent pas diverger. */
export interface SyntheseMontantDto {
  montant?: number;
  regle?: number;
  reste?: number;
}

/** Synthèse financière — l'onglet « Montants » du logiciel de bureau, celui
 * qu'il ouvre par défaut sur sa fiche dossier.
 *
 * **Toujours calculé, jamais stocké** : tout est agrégé à la lecture depuis
 * l'échéancier et ses règlements.
 *
 * Trois niveaux de lecture, et les confondre est l'erreur à éviter :
 * `parCategorie` liste les catégories d'échéancier ; `prixVente` et
 * `netAPayer` sont des **lignes de synthèse qui ne sont pas des catégories** ;
 * `totalGeneral` et `totalSoumisReglePrixTTC` sont les totaux bruts. Les
 * catégories ne s'additionnent pas jusqu'au prix de vente — mesuré, un dossier
 * porte 1 046 100 en AVANCE pour un prix de 837 000, l'écart étant les frais
 * exclus du prix. */
export interface MontantsDossierDto {
  /** Vide sur un dossier sans échéancier ; les lignes de synthèse restent
   * servies, avec un réglé nul. */
  parCategorie?: CategorieMontantDto[];
  totalGeneral?: number;
  totalSoumisReglePrixTTC?: number;
  /** Ligne « Prix de vente ». `montant` est le prix **stocké** sur le dossier,
   * pas une re-dérivation de l'échéancier : les deux coïncident sur 327 des
   * 328 dossiers actifs, et c'est le prix stocké qui fait foi. `regle` n'agrège
   * que les échéances **non exclues du prix**, donc hors frais. */
  prixVente?: SyntheseMontantDto;
  /** Ligne « Net à payer » — le prix de vente augmenté des frais exclus du prix.
   *
   * ⚠️ **Sur un dossier sorti** (`dossierSorti`), le montant se réduit à ce qui
   * a déjà été encaissé et le reste tombe à **zéro** : un dossier annulé ne
   * reste rien devoir. C'est la règle métier, pas une donnée manquante — et
   * c'est pourquoi l'écran doit le dire plutôt que d'afficher un solde nul sans
   * explication. */
  netAPayer?: SyntheseMontantDto;
  /** `true` si le dossier est sorti du parcours — `ANNULATION` ou
   * `DESISTEMENT`. Correspond exactement au `IsCancellation` du logiciel de
   * bureau (30/30 sur les dossiers réels). */
  dossierSorti?: boolean;
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

/* ---------------------------------------------------------------------------
   La file de travail du jour — `GET /api/dashboard/relances` et
   `GET /api/dashboard/nouveaux-pre-prospects`.

   À ne pas confondre avec `DashboardDto.relancesEnRetard` (`RelanceDto`)
   juste au-dessus, qui porte les relances de **dossier** — les rappels de
   titre foncier. Deux populations distinctes, et c'est la confusion des deux
   qui faisait afficher « 0 » au tableau de bord : l'agrégat en renvoie
   effectivement zéro, pendant que 75 relances **commerciales** attendaient.
   --------------------------------------------------------------------------- */

/** `AUJOURDHUI` : échéance au jour même. `RETARD` : de 1 à 30 jours.
 *
 * **La borne de 30 jours est voulue et structurante.** La base porte 3 710
 * relances en retard, dont 2 020 de plus d'un an ; sans elle l'endpoint
 * servirait un arriéré abandonné au lieu d'une liste de travail. L'écran doit
 * donc se présenter comme une file du jour, jamais comme le compte des
 * relances en retard — sinon il sous-estime la situation aussi gravement que
 * le « 0 » qu'il remplace. L'arriéré complet se lit par les filtres de
 * `GET /api/prospections`. */
export type EcheanceRelance = 'AUJOURDHUI' | 'RETARD';

/** `MOI` : les relances dont le commercial résolu est l'appelant. `EQUIPE` :
 * tout son périmètre visible. Dans les deux cas les relances **non affectées
 * sont incluses** — elles n'appartiennent à personne, les réserver à un
 * périmètre les rendrait invisibles à tout le monde. */
export type PorteeRelance = 'MOI' | 'EQUIPE';

/** Une relance commerciale à traiter : l'échéance posée par un commercial sur
 * une interaction, encore armée. Les relances désarmées (`WithoutRevival`,
 * posé quand la prospection devient une vente) représentent 86 % des 39 335
 * alertes de la base et n'apparaissent jamais ici ; les rappels de paiement
 * rattachés à une échéance non plus. */
export interface RelanceProspectionDto {
  /** L'interaction qui porte la relance (`ComActionMessage`). C'est **elle**
   * qu'il faudra viser pour désarmer ou reporter l'échéance, pas la
   * prospection — à retenir le jour où l'écran gagnera ce geste. */
  interactionId: UUID;
  prospectionId: UUID;
  /** Lead non encore qualifié : ni prospect ni commercial. Une telle relance
   * est toujours `nonAffectee`. */
  preProspection?: boolean;
  /** `null` sur une pré-prospection dont le prospect n'existe pas encore — le
   * `telephone` est alors le seul moyen de rappel. Mesuré 49/50 renseigné. */
  prospectNom?: string | null;
  /** Mobile, à défaut fixe, à défaut le numéro du premier contact. Mesuré
   * **50/50 renseigné** : c'est la colonne sur laquelle l'écran peut compter. */
  telephone?: string | null;
  /** Jour où la relance était due. Date seule — la colonne légataire est un
   * `datetime` mais les 3 765 relances armées sont toutes à minuit. */
  dateRelance?: string | null;
  /** `0` pour `AUJOURDHUI`, de 1 à 30 pour `RETARD`. */
  joursDeRetard?: number;
  /** Motif saisi par le commercial. Le spec l'annonce « fréquemment null » ;
   * mesuré 50/50 renseigné sur la page en retard. Une relance sans motif
   * reste une relance à passer. */
  motif?: string | null;
  /** Résolu par l'affectation de la prospection (97,1 %), à défaut par
   * l'auteur de l'interaction. `null` avec `commercialNom` quand aucune des
   * deux ne répond. */
  commercialId?: UUID | null;
  commercialNom?: string | null;
  /** 2,9 % des cas. Ces lignes sont servies **quelle que soit la portée**,
   * `MOI` compris. */
  nonAffectee?: boolean;
  /** Le dernier échange connu avec ce prospect au moment où l'échéance a été
   * posée. */
  derniereInteractionDate?: string | null;
}

/** Un lead non encore qualifié, arrivé dans la journée.
 *
 * **Les arrivées se font par rafales**, l'injection étant automatique : la
 * plupart des jours sont à zéro, puis viennent des pointes à 20 ou 34. Le
 * week-end n'est pas creux. Une journée vide est donc le cas courant et se lit
 * « aucun lead », jamais « panne » — l'état vide de l'écran doit le dire. */
export interface NouveauPreProspectDto {
  /** La route de détail est celle des pré-prospections côté front. */
  prospectionId: UUID;
  code?: string | null;
  /** `null` tant que le lead est anonyme. */
  nom?: string | null;
  /** Seule source possible sur une pré-prospection : aucune fiche tiers
   * n'existe encore. */
  telephone?: string | null;
  email?: string | null;
  dateCreation?: string | null;
}

/* ---------------------------------------------------------------------------
   La synthèse annuelle — `GET /api/dashboard/annuel`.

   Reprend l'écran d'accueil du logiciel de bureau, **y compris son assiette**,
   pour que les chiffres restent comparables poste à poste pendant la
   transition. Trois blocs qui ne se somment pas entre eux et qu'il ne faut
   surtout pas présenter comme un tout : l'échéancier est du *dû*, les
   encaissements sont du *réalisé*, les ventes concrétisées sont un *sous-
   ensemble des dossiers*.
   --------------------------------------------------------------------------- */

/** Un mois de l'échéancier. **Montant dû, pas encaissé.** */
export interface PointMensuelDto {
  /** 1 à 12. */
  mois: number;
  /** Somme des échéances du mois. `0` quand il n'y en a aucune, **jamais
   * `null`** — un mois vide reste un point de la courbe. */
  montant: number;
  /** Nombre d'échéances agrégées : ce qui distingue « un mois vide » d'« un
   * mois à zéro ». Deux choses différentes, et seule cette colonne les
   * sépare. */
  lignes: number;
}

/** Les ventes concrétisées de l'année, sur l'assiette exacte du logiciel de
 * bureau : date d'avance dans l'année **et** statut ayant atteint
 * `CONCRETISATION`, hors sorties. */
export interface VentesConcretiseesDto {
  nombreDossiers: number;
  prixTotal: number;
  /** Avances, crédits et autofinancements, signés par le sens de la
   * catégorie. Les frais n'y entrent pas — ce n'est donc pas « prixTotal
   * moins le reste à payer ». */
  montantRegle: number;
  /** **Dossiers écartés faute de date d'avance, toutes années confondues.**
   *
   * Ce compteur n'existe que pour être affiché : sans lui, `nombreDossiers`
   * se lirait comme le total des ventes de l'année alors qu'il ne couvre que
   * les dossiers pourvus d'une `AdvanceDate`. Le spec l'annonce à 232 sur 387
   * ; **mesuré 21 sur cette base**, identique sur 2024, 2025 et 2026 — c'est
   * bien un décompte global, pas annuel. Afficher la valeur servie, jamais
   * celle du spec. */
  dossiersSansDateAvance: number;
}

/** Les encaissements de l'année. **Crédits seulement** : un décaissement
 * n'est pas un encaissement négatif, il est hors sujet. */
export interface EncaissementsAnnuelsDto {
  nombreLignes: number;
  montantTotal: number;
}

export interface SyntheseAnnuelleDto {
  annee: number;
  /** **Toujours 12 points, de janvier à décembre**, un mois sans échéance
   * valant zéro — le client n'a jamais de trou à reboucher. Vérifié sur trois
   * années : 12 points, `mois` de 1 à 12 dans l'ordre, aucun `montant` nul. */
  echeancier: PointMensuelDto[];
  ventesConcretisees: VentesConcretiseesDto;
  encaissements: EncaissementsAnnuelsDto;
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
// Actions récentes — GET /api/actions-recentes (FEATURE-actions-recentes.md)
// ---------------------------------------------------------------------------

export type PorteeActionsRecentes = 'MOI' | 'EQUIPE';

export type TypeActionRecente =
  | 'PRE_PROSPECTION_CREEE'
  | 'PROSPECT_CREE'
  | 'PROSPECT_RATTACHE'
  | 'TRANSFORMEE_EN_PROSPECTION'
  | 'PROSPECTION_CREEE'
  | 'ETAPE_CHANGEE'
  | 'ARCHIVEE'
  | 'DESARCHIVEE'
  | 'DOSSIER_STATUT'
  | 'INTERACTION'
  | 'AUTRE';

export type CibleActionRecente = 'PRE_PROSPECTION' | 'PROSPECTION' | 'DOSSIER';

export interface ActionRecente {
  id: UUID;
  type: TypeActionRecente;
  /** Date-heure locale ISO ; sert de curseur `avant` pour « Voir plus ». */
  date: string;
  libelle: string;
  auteurId: UUID | null;
  auteurNom: string | null;
  /** Type **actuel** de la fiche, pas celui qu'elle avait au moment de l'action. */
  cibleType: CibleActionRecente;
  cibleId: UUID;
  cibleLibelle: string;
  prospectId: UUID | null;
}

// ---------------------------------------------------------------------------
// Hotline — recherche par numéro de téléphone (V4)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Authentification / Mon compte (V4). Le cookie JWT httpOnly `access_token`
// n'est jamais visible côté front — seul UtilisateurCourantDto (profil +
// rôles + mustChangePassword/profileCompleted) circule dans les réponses.
// Ces deux drapeaux sont hérités : ils ne bloquent plus rien côté backend et
// le front les ignore (plus de portail de première connexion — les comptes
// viennent d'Omran, voir FEATURE-acces-arpent-depuis-omran.md).
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
  /** Drapeau hérité — ne bloque plus rien (plus de portail de première
   * connexion depuis FEATURE-acces-arpent-depuis-omran). */
  mustChangePassword?: boolean;
  /** Drapeau hérité — ne bloque plus rien. */
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

/** Corps facultatif de POST /api/utilisateurs/{admUserId}/reinitialiser-mot-de-passe.
 * Absent ou `{}` : envoi à l'adresse connue du compte, ou aucun envoi s'il
 * n'en a pas. */
export interface ReinitialiserMotDePasseRequest {
  /** Adresse d'envoi **pour cette fois seulement** — jamais enregistrée
   * (Omran reste la source des comptes). Vide/blanche = ignorée ; fournie
   * mais invalide → 400 sans rien modifier. */
  email?: string | null;
}

/** Identifiants Arpent du compte Omran, à afficher et copier côté admin. */
export interface ReinitialiserMotDePasseResponse {
  /** Id de l'AdmUser réinitialisé. */
  admUserId: UUID;
  /** Identifiant de connexion — le login Omran (AdmUser.Code). */
  username?: string;
  /** Mot de passe Arpent du compte, **toujours présent**, renvoyé une seule
   * fois. Pas provisoire (aucun changement imposé) : le nom du champ est
   * historique. Seule copie si aucun email n'est parti. */
  motDePasseTemporaire?: string;
  /** `true` seulement si un destinataire existe **et** que le service d'envoi
   * est actif (envoi déclenché, remise non garantie). `false` : aucun email
   * n'est parti, les identifiants sont à transmettre à la main. */
  emailEnvoye?: boolean;
  /** Adresse de destination, masquée — `null` si aucun destinataire. */
  destinataire?: string | null;
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
/** Nombre d'actions d'un type (ComActionMessageType) sur la période. */
export interface ActionParTypeDto {
  /** Libellé du type tel que le référentiel le porte ; « (sans type) » pour
   * les actions sans type (9 sur 12 mois en base réelle). */
  type?: string;
  nombre?: number;
}

export interface PerformanceCommercialDto {
  /** `CfgTier.PKey` du commercial, **pas** l’id de son compte utilisateur —
   * un même employé peut porter deux comptes, additionnés ici. **Null** pour
   * un compte rattaché à aucun employé (16 comptes sur 75) : la ligne est
   * alors celle du compte, identifié par `utilisateurId`. */
  commercialId?: UUID | null;
  /** Compte (AdmUser.PKey) — renseigné **seulement** quand le compte n'est
   * rattaché à aucun employé. Ces comptes n'ont pas de portefeuille. */
  utilisateurId?: UUID | null;
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
  /** Toutes les actions de la période, **actions « Système » exclues** :
   * appels, visites, notes, messages, mails, WEB. Les actions générées
   * pendant une session gonflaient ce total (jusqu'à 212 sur 228). */
  interactionsTotal?: number;
  /** Le détail de `interactionsTotal` par type, du plus au moins fréquent —
   * tous les types du référentiel. La somme des `nombre` égale
   * `interactionsTotal`. Vide si aucune action. */
  actionsParType?: ActionParTypeDto[];

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
  /** `rdvObtenus / interactionsTotal`, 0–1 — les rendez-vous rapportés à
   * **toute** l'activité, pas seulement au téléphone. `null` si aucune action. */
  tauxActionVersRdv?: number | null;
  /** `dossiersCrees / prospectionsAssignees`, 0–1. `null` si aucune
   * prospection assignée. **À lire avec son effectif** : sur une période
   * courte le dénominateur est faible et le taux très bruyant. */
  tauxProspectionVersDossier?: number | null;
}

// ---------------------------------------------------------------------------
// Synchronisation (V4). POST /api/synchronisation — déclenche immédiatement un
// cycle de synchronisation descendante (base de référence → copie de lecture)
// au lieu d'attendre le cycle automatique (toutes les deux minutes). Appel
// SYNCHRONE : la réponse n'arrive qu'une fois le cycle terminé. 409 si un
// cycle tourne déjà ou si l'application est en mono-base. Réservé au rôle
// Administrateur.
// ---------------------------------------------------------------------------

/** Bilan du cycle de synchronisation descendante qui vient de s'exécuter. */
export interface SynchronisationResultatDto {
  /** Version Change Tracking de la source atteinte par ce cycle. Repère de
   * diagnostic ; `null` si le Change Tracking n'est pas actif sur la source
   * (le cycle n'a alors rien pu faire). */
  version?: number | null;
  /** Lignes insérées ou mises à jour dans la copie depuis la source (écrites
   * hors CRM, typiquement par le logiciel de bureau). */
  fusions?: number;
  /** Lignes supprimées de la copie parce qu'elles ont disparu de la source. */
  suppressions?: number;
  /** Tables traitées sans erreur — leur filigrane a avancé. */
  tablesTraitees?: number;
  /** Tables en échec sur ce cycle, rejouées au cycle suivant. 0 en nominal. */
  tablesEnEchec?: number;
  /** Durée du cycle en millisecondes. */
  dureeMs?: number;
}

// ---------------------------------------------------------------------------
// Clés d'API pour les clients machine — `/api/cles-api`, rôle Administrateur
// (`FEATURE-cle-api-n8n.md`). Le front, lui, reste sur le cookie JWT : ces
// écrans ne font qu'administrer les clés que n8n ou un agent enverront dans
// l'en-tête `X-Api-Key`.

/** Portée accordée à une clé. Une route hors de toutes les portées de la clé
 * est refusée en 403 `HORS_PORTEE`. Pour n8n : écrire les pré-prospections et
 * lire les référentiels (les ids de tranche, origine, étape…). */
export type PorteeCleApi = 'PRE_PROSPECTIONS_ECRIRE' | 'PRE_PROSPECTIONS_LIRE' | 'REFERENTIELS_LIRE';

/** Clé d'API telle que listée. **Le secret n'est jamais renvoyé ici** :
 * seulement `clePrefixe`, pour reconnaître la clé configurée côté client. */
export interface CleApiDto {
  /** AppApiClient.PKey. */
  id: UUID;
  /** Nom du client, unique — p.ex. `n8n`. */
  nom?: string;
  /** Début de la clé, `ak_` + 8 caractères. */
  clePrefixe?: string;
  /** Code du compte de service (`AdmUser.Code`). */
  compteCode?: string;
  /** Nom affiché du compte de service — l'auteur (`UserCreate`) de tout ce
   * que la clé écrit. */
  compteNom?: string;
  portees?: PorteeCleApi[];
  /** `false` = révoquée : la clé est refusée en 401. */
  actif?: boolean;
  /** Dernière requête acceptée, à la minute près ; null si jamais utilisée. */
  dernierUsage?: string | null;
  dateCreation?: string | null;
  /** Administrateur créateur. */
  creePar?: string | null;
  /** Null tant que la clé est active. */
  revoqueLe?: string | null;
  revoquePar?: string | null;
}

/** Réponse de la création et de la régénération. `cle` est le secret **en
 * clair, montré une seule fois** : il n'est pas stocké (seul son hash l'est)
 * et aucune autre route ne le renvoie. */
export interface CleApiCreeeDto {
  cleApi: CleApiDto;
  /** `ak_` + 43 caractères. À envoyer dans `X-Api-Key`. */
  cle: string;
}

export interface CreerCleApiRequest {
  /** Unique, 100 caractères max. Sert aussi de `Code` et de `Description`
   * au compte de service créé. 409 si déjà pris. */
  nom: string;
  /** Au moins une (400 sinon). */
  portees: PorteeCleApi[];
  /** Code d'un compte `AdmUser` **existant** à utiliser comme compte de
   * service. Absent : un compte est créé au nom de la clé, sans employé ni
   * rôle — donc sans restriction de périmètre, la portée étant alors sa
   * seule limite. 400 si inconnu. */
  compteCode?: string;
}
