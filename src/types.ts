
// eslint-disable-next-line sonarjs/redundant-type-aliases -- nomme le format du fil (OpenAPI `format: uuid`)
export type UUID = string;


/** Hors `id`, chaque champ n'est servi que si `?colonnes=` le demande : absent
 * ne veut pas dire `null`. Prévoir un repli partout où une valeur sert hors de
 * sa cellule. */
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

  cin?: string;
  ice?: string;
  dateNaissance?: string | null;
  lieuNaissance?: string;
  nombreEnfants?: number;
  estAncienClient?: boolean;
  filsDe?: string;
  etDe?: string;
  kind?: string;
  titre?: string;
  sexe?: string;
  nationalite?: string;
  situationFamiliale?: string;
  regimeMatrimonial?: string;
  commercialId?: UUID;
  commercialNom?: string;

  /** Sans le `+` (ex. `212`). */
  indicatifTelephone?: string;
  /** Deuxième téléphone (« Téléphone 2 ») : la numérotation est décalée. */
  telephone1?: string;
  /** Troisième téléphone (« Téléphone 3 »). */
  telephone2?: string;
  /** Sans le `+`. */
  indicatifMobile?: string;
  fax?: string;
  siteWeb?: string;

  adresse?: string;
  adresse2?: string;
  adresse3?: string;
  codePostal?: string;
  pays?: string;
  paysResidence?: string;
  typeResidence?: string;

  employeur?: string;
  /** En années. */
  anciennete?: number;
  /** Toujours vide en base réelle : ne pas en faire un critère. */
  profession?: string;
  /** Libellé de tranche de salaire, pas un montant. */
  salaire?: string;

  creePar?: string;
  creeLe?: string | null;
  modifiePar?: string;
  modifieLe?: string | null;
}

/** Un client n'est pas un type de tiers : c'est le client d'au moins un
 * dossier. Les totaux sont agrégés côté serveur. */
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
  /** Sans le `+` (ex. `212`). */
  indicatifTelephone?: string;
  telephone1?: string;
  telephone2?: string;
  mobile?: string;
  /** Sans le `+`. */
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
  creePar?: string;
  creeLe?: string | null;
  modifiePar?: string;
  modifieLe?: string | null;
  /** Toujours présent : `[]` veut dire « aucun intérêt », jamais « non
   * disponible ». Liste courte, pas de pagination. */
  tranchesInteret: TrancheInteretDto[];
}

export interface TrancheInteretDto {
  id: UUID;
  code?: string;
  description?: string;
}

export interface CreerProspectRequest {
  prenom?: string;
  nom?: string;
  raisonSociale?: string;
  telephone?: string;
  /** Sans le `+` (ex. `212`). Sans lui, pas d'envoi WhatsApp
   * (`NUMERO_INEXPLOITABLE`). Le front ne reformate pas `telephone`. */
  indicatifTelephone?: string;
  mobile?: string;
  /** Sans le `+`. */
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
  /** Absent ou `false` : 409 avec `doublons` si une fiche existante concorde.
   * `true` : crée quand même. Ignoré en PATCH. */
  ignorerDoublons?: boolean;
}

export type ModifierProspectRequest = CreerProspectRequest;

/** `NOM` compare sans casse ni aucun espace, dans les deux ordres ;
 * `TELEPHONE` sur les 9 derniers chiffres. */
export type CritereDoublon = 'NOM' | 'TELEPHONE' | 'EMAIL';

/** Un homonyme au contact différent est le cas courant : la liste sert à
 * laisser l'utilisateur trancher, pas à refuser. */
export interface ProspectDoublonDto {
  id: UUID;
  code?: string | null;
  nom?: string | null;
  prenom?: string | null;
  nomFamille?: string | null;
  raisonSociale?: string | null;
  /** Tel que stocké, non normalisé. */
  telephone?: string | null;
  /** Tel que stocké : `6 65 68 09 64`. */
  mobile?: string | null;
  email?: string | null;
  ville?: string | null;
  type?: string | null;
  dateCreation?: string | null;
  criteres: CritereDoublon[];
}

/** Tous optionnels, mais 400 si aucun n'est exploitable (téléphone de moins de
 * 9 chiffres ou à chiffres identiques, email sans `@`). */
export interface RechercheDoublonsProspectParams {
  /** Nom complet si `prenom` est vide. */
  nom?: string;
  prenom?: string;
  raisonSociale?: string;
  telephone?: string;
  mobile?: string;
  email?: string;
}

export interface LierProspectRequest {
  /** 400 si inconnu ou d'un autre type de tiers que prospect/client. */
  prospectId: UUID;
}

/** Corps du 409 « une prospection ouverte par prospect et par projet » : ouvrir
 * celle-ci plutôt qu'en créer une seconde. Une prospection fermée ne bloque pas. */
export interface ProspectionExistanteDto {
  id: UUID;
  code?: string | null;
  dateDocument?: string | null;
  etapeLibelle?: string | null;
  commercialNom?: string | null;
  trancheCode?: string | null;
  projetCode?: string | null;
}

/** `code` est toujours généré par le serveur, jamais envoyé. */
export interface CreerProspectionRequest {
  prospectId: UUID;
  commercialId?: UUID;
  trancheId: UUID;
  /** Doit appartenir à `trancheId` (400 sinon). */
  articleId?: UUID;
  origineId: UUID;
  origineSupportId?: UUID;
  vocationId?: UUID;
  /** Champ « Type » de l'écran, distinct de la vocation. */
  typeContactId: UUID;
  actionCommercialeId?: UUID;
  /** Champ « Nature » de l'écran. */
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
  /** Non vide, sinon 400. */
  notes: string;
}

/** Fournir `contactProspectId` OU `nouveauContact` : 400 si aucun ou les deux. */
export interface CreerContactProspectRequest {
  contactProspectId?: UUID;
  /** Au moins `nom` ou `raisonSociale`. */
  nouveauContact?: CreerProspectRequest;
  relationTypeId: UUID;
}

export interface ContactProspectDto {
  /** Id du lien, pas du tiers : c'est lui qu'attend le DELETE. */
  id: UUID;
  contactProspectId?: UUID;
  nomContact?: string;
  mobileContact?: string;
  telephoneContact?: string;
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
  /** Historique d'un tiers seulement ; null pour une prospection. */
  dossierId?: UUID | null;
  dossierCode?: string | null;
  articleCode?: string | null;
}

/** Sans `id` : ne pas l'utiliser comme clé de liste. */
export interface HistoriqueEvenementDto {
  date?: string | null;
  type?: string;
  utilisateur?: string;
  description?: string;
}


export interface ProspectionListItemDto {
  id: UUID;
  code?: string;
  dateDocument?: string | null;
  tempDescription?: string;
  prospectId?: UUID;
  prospectNom?: string;
  commercialId?: UUID;
  commercialNom?: string;
  origine?: string;
  etape?: string;
  fermee?: boolean;
  /** Vaut `0`, jamais `null`, quand non saisi : ne pas l'afficher comme un prix. */
  prix?: number;
  surface?: number;
  trancheId?: UUID;
  trancheCode?: string;
  trancheDescription?: string;
  /** Mobile de la fiche, à défaut fixe, à défaut numéro du premier contact. */
  telephone?: string | null;
  /** Même repli que `telephone`. `null` est courant : afficher « — ». */
  email?: string | null;
  /** Vient toujours d'une interaction : la colonne d'alerte de la prospection
   * elle-même est morte en base. */
  derniereAlerteDate?: string | null;
  derniereAlerteMessage?: string | null;

  prospectCode?: string | null;
  /** Brut de la fiche, sans le repli de `telephone` : pour éditer ou
   * dédoublonner, pas pour appeler. */
  mobileProspect?: string | null;
  /** Sans `+`, à afficher à côté du numéro, jamais concaténé. */
  indicatifMobile?: string | null;
  /** Brut de la fiche, sans le repli de `email`. */
  emailFiche?: string | null;
  commercialCode?: string | null;
  ancienClient?: boolean;
  dateFermeture?: string | null;
  raisonFermeture?: string | null;
  /** Type de la personne, pas du document (`typeProspection*`). */
  typeProspect?: string | null;
  typeProspectionId?: UUID | null;
  /** C'est ce champ qu'il faut tester, jamais le libellé. La liste filtre par
   * heuristique : des `ComPreProspection` et `RntProspection` y restent. */
  typeProspectionCode?: string | null;
  /** Libellé traduit, instable : ne jamais tester dessus. */
  typeProspection?: string | null;
  origineSupport?: string | null;
  actionCommerciale?: string | null;
  pays?: string | null;
  societeId?: UUID | null;
  societeCode?: string | null;
  societeLibelle?: string | null;
  /** Vide sur les prospections créées par cette API : vide veut dire « créée
   * depuis l'application », pas « auteur inconnu ». */
  creePar?: string | null;
  creeLe?: string | null;
  modifiePar?: string | null;
  modifieLe?: string | null;

  // Servis seulement si `?colonnes=` les demande : `undefined` veut dire
  // « non demandée », pas « vide ».
  joursInactivite?: number;
  nbInteractions?: number;
  derniereActionDate?: string | null;
  derniereCommunicationDate?: string | null;
  derniereCommunicationResultat?: string | null;
  nbVisites?: number;
  derniereVisiteDate?: string | null;
  projetId?: UUID | null;
  projetCode?: string | null;
  projetLibelle?: string | null;
  /** Rare et peu fiable : jamais une donnée d'identité. */
  cin?: string | null;
  /** `null` = prospection non transformée, pas une donnée manquante. */
  dossierId?: UUID | null;
  dossierCode?: string | null;
  statutDossier?: string | null;
}

/** Envoyés en paramètres de requête plats (`?projetId=a&projetId=b`), pas en
 * objet `filtres` comme le laisse croire la spec springdoc. */
export interface FiltresAvancesProspection {
  /** Une prospection sans tranche n'a pas de projet et sort du résultat. */
  projetId?: UUID[];
  societeId?: UUID[];
  vocationId?: UUID[];
  typeContactId?: UUID[];
  raisonFermetureId?: UUID[];
  paysId?: UUID[];
  actionId?: UUID[];
  /** Pas de référentiel plat des supports : seulement par origine. */
  origineSupportId?: UUID[];
  ancienClient?: boolean;
  /** Au moins N jours. */
  inactiviteMin?: number;
  nbInteractionsMin?: number;
  nbVisitesMin?: number;
  /** Incluse, ISO-8601. */
  communicationDepuis?: string;
  communicationJusqua?: string;
  /** `false` : uniquement celles sans relance. Absent : pas de filtre. */
  avecAlerteActive?: boolean;
  /** Code inconnu : pas d'erreur, résultat vide. Les prospections sans type
   * sortent dès que ce filtre est actif. */
  typeProspection?: string[];
}

/** `api-docsV4.json` n'en liste qu'une partie : les valeurs viennent du backend.
 * Un groupe inconnu retombe sur la clé brute dans `libelleGroupe`. */
export type GroupeColonne =
  | 'IDENTITE'
  | 'CONTACT'
  | 'CONTEXTE'
  | 'FINANCIER'
  | 'CLOTURE'
  | 'ACTIVITE'
  | 'CONVERSION'
  | 'SUIVI'
  | 'ACTEURS'
  | 'ORIGINE'
  | 'PATRIMOINE'
  | 'ARTICLE'
  | 'DELAIS'
  | 'ADRESSE'
  | 'PROFESSION'
  | 'ACTION'
  | 'RATTACHEMENT'
  | 'IDENTIFIANTS'
  | 'AUDIT';

export type TypeColonne = 'TEXTE' | 'NOMBRE' | 'MONTANT' | 'DATE' | 'BOOLEEN';

/** Même source que la liste blanche de `?colonnes=` : ne pas coder de
 * catalogue en dur côté front. */
export interface ColonneDto {
  nom: string;
  libelle: string;
  groupe: GroupeColonne;
  type: TypeColonne;
  /** Champs de la charge utile, pas colonnes de la grille : inclut des clés de
   * jointure (`id`, `clientId`…) que l'appelant doit masquer. */
  parDefaut: boolean;
  /** Se lit, ne se déduit pas du type. */
  groupable: boolean;
  /** N'équivaut pas à « numérique » : déduire du type provoque un 400. */
  agregeable: boolean;
  /** Ne se déduit ni du type ni du nom ; dans l'ordre du menu Σ. Une liste vide
   * signifie : absente du menu Σ. */
  fonctions?: FonctionAgregat[];
}

/** `SUM` est implicite : un nom nu vaut une somme et revient nu ; les autres
 * s'écrivent `prix:AVG` et reviennent sous ce jeton. */
export type FonctionAgregat = 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT';

/** Doit être repassée avec la clé du groupe pour le déplier : sinon le serveur
 * répond 200 avec zéro ligne, sans erreur. */
export type GranulariteGroupe = 'JOUR' | 'MOIS' | 'ANNEE';

export type TriGroupes = 'LIBELLE' | 'NOMBRE';

/** `MIN`/`MAX` ont le type de la colonne (chaîne ISO sur une date). `null`
 * seulement pour un `MIN`/`MAX` sans valeur ; une somme vide vaut `0`. */
export type ValeurAgregat = number | string | null;

/** Groupes repliés, effectifs sur tout le périmètre filtré. Les lignes
 * s'obtiennent en rappelant la liste avec `?groupeColonne=&groupeValeur=`. */
export interface GroupeDto {
  /** À réémettre telle quelle dans `?groupeValeur=`. `null` est un groupe
   * légitime : pour le déplier, envoyer `groupeColonne` sans `groupeValeur`. */
  cle: string | number | boolean | null;
  libelle: string | null;
  nombre: number;
  /** Arrive bruité en flottant (somme SQL sur des `float`) :
   * `formatCurrency`/`formatNumber` l'absorbent. */
  agregats?: Partial<Record<string, ValeurAgregat>>;
}

export interface PageGroupesDto {
  content: GroupeDto[];
  page: number;
  size: number;
  /** Nombre de groupes, pas de lignes. */
  totalElements: number;
  totalPages: number;
  /** Total général sur tout le périmètre filtré, pas sur les groupes chargés. */
  totaux: Partial<Record<string, ValeurAgregat>>;
  nombreTotal: number;
}

/** Le bloc vaut `null` sur une pré-prospection : « non disponible », jamais
 * zéro. */
export interface ActiviteProspectionDto {
  joursInactivite?: number;
  nbInteractions?: number;
  derniereActionDate?: string | null;
  derniereCommunicationDate?: string | null;
  derniereCommunicationResultat?: string | null;
  derniereCommunicationMessage?: string | null;
  alerteActiveDate?: string | null;
  alerteActiveRaison?: string | null;
  nbVisites?: number;
  premiereVisiteDate?: string | null;
  derniereVisiteDate?: string | null;
  projetId?: UUID | null;
  projetCode?: string | null;
  projetLibelle?: string | null;
  /** Rare et peu fiable : jamais une donnée d'identité. */
  cin?: string | null;
  /** `null` = non transformée, pas une donnée manquante. */
  dossierId?: UUID | null;
  dossierCode?: string | null;
  clientId?: UUID | null;
  statutDossier?: string | null;
}

export interface ProspectionDetailDto {
  id: UUID;
  code?: string;
  typeProspectionId?: UUID | null;
  /** C'est ce champ qu'il faut tester. `null` = anomalie de création : la
   * fiche est invisible dans le logiciel de bureau. */
  typeProspectionCode?: string | null;
  /** Libellé traduit : ne jamais tester dessus. */
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
  // Vides en base (`prix` vaut `0`, jamais `null`) : non affichés en
  // consultation, mais la saisie est conservée volontairement.
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
  trancheCode?: string;
  trancheDescription?: string;
  articleId?: UUID;
  articleCode?: string;
  articleDescription?: string;


  prospectCode?: string | null;
  /** Type du tiers (`PRO`, `PRORNT`), pas du document (`typeProspectionCode`). */
  typeProspect?: string | null;
  typeProspectId?: UUID | null;
  typeProspectLibelle?: string | null;
  mobileProspect?: string | null;
  /** Sans `+` (ex. `212`). */
  indicatifMobile?: string | null;
  /** Email de la fiche tiers, distinct de `tempEmail` saisi sur la prospection. */
  emailFiche?: string | null;
  commercialCode?: string | null;
  origineCode?: string | null;
  origineSupportCode?: string | null;
  etapeCode?: string | null;
  vocationCode?: string | null;
  typeContactCode?: string | null;
  actionCommercialeCode?: string | null;
  raisonFermetureCode?: string | null;
  /** Dérivée de la tranche, jamais saisie : sans tranche, pas de société. */
  societeId?: UUID | null;
  societeCode?: string | null;
  societeLibelle?: string | null;
  articleCategorie?: string | null;
  articleType?: string | null;
  paysId?: UUID | null;
  paysCode?: string | null;
  pays?: string | null;

  /* Tous `null` sur une fiche créée sans type de document (pas de bloc
     `activite`), comme `prospectCode` et `typeProspection*`. */
  creePar?: string | null;
  creeLe?: string | null;
  modifiePar?: string | null;
  modifieLe?: string | null;


  /** Déduit de `noteQualification`. `null` = pas un marqueur reconnu, pas
   * « pas de note ». Ne change pas l'étape. */
  marqueurTri?: 'DOUBLON' | 'SPAM' | 'TRAITE' | null;
  /** Texte libre brut : marqueur de tri sur une pré-prospection, le plus souvent
   * typologie recherchée sur une prospection. */
  noteQualification?: string | null;
  /** Servi même si la résolution du tiers échoue. */
  doublonDeCode?: string | null;
  /** Absent si le code est ambigu (codes de tiers non uniques) : conditionner
   * le lien à `doublonDeId`, pas à `doublonDeCode`. */
  doublonDeId?: UUID | null;
  doublonDeNom?: string | null;

  /** `null` sur une pré-prospection (voir le type). */
  activite?: ActiviteProspectionDto | null;
}

export interface TransformerProspectionRequest {
  commercialId: UUID;
  /** Si omise, la prospection doit déjà porter une tranche, sinon 400. */
  trancheId?: UUID;
  /** Doit appartenir à la tranche effective (fournie ou déjà posée), sinon 400. */
  articleId?: UUID;
}

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
  /* Pas de `trancheId`/`articleId` ici : la tranche principale se change par
     `PATCH .../tranche-principale` (`ModifierTranchePrincipaleRequest`). */
}

export interface ChangerEtapeRequest {
  etapeId: UUID;
  note?: string;
}

export interface ArchiverProspectionRequest {
  raisonId?: UUID;
  raisonTexte?: string;
}


/** Aucune fiche prospect n'est créée : le contact vit en champs libres. */
export interface CreerPreProspectionRequest {
  /** Non blanc, sinon 400. */
  nom: string;
  /** Stocké tel quel ; retrouvé par ses 9 derniers chiffres. */
  telephone?: string;
  email?: string;
  notes?: string;
  /** 403 (pas 400) si son projet est hors du périmètre de l'appelant. */
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

export interface DoublonPreProspectionDto {
  id: UUID;
  /** Peut être atypique (`50`) sur les leads injectés. */
  code?: string | null;
  dateCreation?: string | null;
}

/** Les doublons sont signalés, jamais refusés. */
export interface PreProspectionCreeeDto {
  preProspection: ProspectionDetailDto;
  /** Un champ absent des deux côtés compte comme égal. Limité à ce que
   * l'appelant peut voir. */
  doublons: DoublonPreProspectionDto[];
}

/** `DOUBLON` : même contact, autre date, créée quand même. `DEJA_IMPORTEE` :
 * même contact et même date (à la minute), ignorée. */
export type StatutLigneImport = 'NOUVELLE' | 'DOUBLON' | 'DEJA_IMPORTEE' | 'ERREUR';

export interface LigneImportDto {
  /** L'en-tête est la ligne 1. */
  ligne: number;
  dateCreation?: string | null;
  nom?: string | null;
  telephone?: string | null;
  email?: string | null;
  formulaire?: string | null;
  statut: StatutLigneImport;
  message?: string | null;
  /** Null dans l'aperçu, hors sélection (`statuts`), et pour `DEJA_IMPORTEE` /
   * `ERREUR`. */
  preProspectionId?: UUID | null;
  code?: string | null;
  doublonIds?: UUID[] | null;
}


/** Hors `id`, seules les colonnes demandées par `?colonnes=` sont présentes.
 * `rang`, `alerteActive`, `etat` et `personnel` : ni triables ni groupables. */
export interface SuiviActionDto {
  id: UUID;
  /** Auteur tel qu'écrit, distinct de `commercial`. */
  utilisateur?: string | null;
  typeAction?: string | null;
  /** 1 = la plus récente du même type pour le même tiers. */
  rang?: number | null;
  dateAction?: string | null;
  dateAlerte?: string | null;
  alerteActive?: boolean | null;
  categorie?: string | null;
  resultat?: string | null;
  message?: string | null;
  impaye?: boolean | null;
  systeme?: boolean | null;
  /** Rarement renseigné : le type porte le sens. */
  entrante?: boolean | null;
  /** Commercial concerné, pas l'auteur. */
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
  /** Celle de la prospection, sinon de l'article. */
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

/** Même forme pour l'aperçu et l'import. */
export interface RapportImportPreProspectionsDto {
  /** `false` pour l'aperçu : rien n'est écrit. */
  importe: boolean;
  trancheId?: UUID | null;
  trancheCode?: string | null;
  /** Null si les formulaires du fichier désignent plusieurs tranches :
   * l'utilisateur choisit. */
  trancheSuggereeId?: UUID | null;
  trancheSuggereeCode?: string | null;
  formulaires: string[];
  avertissements: string[];
  totalLignes: number;
  nouvelles: number;
  /** Compteur de classification : créées seulement si sélectionnées. */
  doublons: number;
  dejaImportees: number;
  erreurs: number;
  lignes: LigneImportDto[];
  statutsImportes?: StatutLigneImport[] | null;
  /** 0 dans l'aperçu. */
  creees: number;
  /** Leads créés attribués par la répartition automatique, par commercial ; vide dans l'aperçu. */
  repartition: RepartitionCommercialDto[];
  /** Leads créés restés sans commercial (sans projet ou aucun éligible). */
  nonAttribuees: number;
}


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

/** Seul moyen de changer la tranche/article principal. `articleId` doit
 * appartenir à `trancheId` (400 sinon). */
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
  /** Le code, pas le libellé (`trancheDescription`). */
  tranche?: string;
  trancheDescription?: string;
  articleId?: UUID;
  /** Le code, pas le libellé. */
  article?: string;
  articleDescription?: string;
}

export interface CreerDevisRequest {
  /** Obligatoire, bien que typé optionnel. */
  trancheId?: UUID;
  /** Sans lui, offre « libre » sans ventilation HT/TVA, et `prix` devient
   * obligatoire. */
  articleId?: UUID;
  /** Ignoré si `articleId` est absent. */
  sousArticleIds?: UUID[];
  /** Repris de la prospection si absent. */
  prospectId?: UUID;
  commercialId?: UUID;
  modePaiementId?: UUID;
  /** TTC. Remplace le prix commercial de l'article s'il est fourni. */
  prix?: number;
  /** En pourcentage (5 = 5 %), pas en ratio. */
  remisePercent?: number;
  notes?: string;
}

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
  /** Pourcentage 0–100 (5 = 5 %) sur toutes les offres, OMRAN comprises. */
  remisePercent?: number;
  remiseHT?: number;
  remiseTTC?: number;
  prixM2ApresRemiseHT?: number;
  prixM2ApresRemiseTTC?: number;
  prixArticleApresRemiseHT?: number;
  prixArticleApresRemiseTTC?: number;
  prixSousArticlesApresRemiseHT?: number;
  prixSousArticlesApresRemiseTTC?: number;
  prixVenteHT?: number;
  prixVenteTTC?: number;
  /** Ratio (0.03 = 3 %), malgré le nom — alors que `remisePercent` est un
   * pourcentage entier. */
  commissionPercent?: number;
}

export interface DevisDto {
  id: UUID;
  code?: string;
  dateDocument?: string | null;
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
  /** Calculé sur le TTC après remise. Vide si l'offre n'a pas de prix : rien à
   * afficher, pas une erreur. */
  schemaFinancement?: LigneSchemaFinancementDto[];
}

/** `sommePrixVenteTTCPage` porte sur la page courante seulement, pas sur
 * tout le filtre. */
export interface DevisPageDto {
  content: DevisDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sommePrixVenteTTCPage?: number;
}

export interface CreerInteractionRequest {
  /** Ressort dans `InteractionDto.note`, pas dans `description`. Obligatoire
   * pour une Note. */
  description?: string;
  entrante?: boolean;
  /** Le code `Note` dispense du résultat. */
  actionTypeId: UUID;
  /** Obligatoire sauf pour une Note. Si `necessiteDateRdv`, `dateRdv` devient
   * obligatoire. */
  resultatId?: UUID;
  /** Date-time. Obligatoire si le résultat a `alerteRecommandee`. */
  dateAlerte?: string;
  /** Date-time. */
  dateRdv?: string;
}

export interface InteractionDto {
  id: UUID;
  date?: string | null;
  /** Le texte saisi : c'est lui qu'il faut afficher, malgré une colonne
   * d'origine nommée `AlertMessage`. */
  note?: string | null;
  /** Libellé généré (`date` + auteur), pas un contenu : ne pas l'afficher. */
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
  /** Catégorie ; `resultatId` est la sous-catégorie. */
  categorieId?: UUID | null;
  categorie?: string | null;
  /** Celle de la prospection si `categorie` vaut « Prospection », sinon celle
   * du lot. */
  trancheId?: UUID | null;
  trancheCode?: string | null;
  trancheLibelle?: string | null;
  projetId?: UUID | null;
  projetCode?: string | null;
  projetLibelle?: string | null;
}

/** Canaux indépendants : l'un peut aboutir quand l'autre échoue, c'est courant. */
export interface CanalEnvoiDto {
  envoye?: boolean;
  /** `DESTINATAIRE_ABSENT`, `NUMERO_INEXPLOITABLE` (à réparer dans la fiche),
   * `SERVICE_INACTIF`. D'autres peuvent apparaître : afficher le motif brut. */
  motif?: string;
  destinataire?: string | null;
  /** Toujours 0 sur WhatsApp, souvent 0 par email : zéro n'est pas un symptôme. */
  nombrePiecesJointes?: number;
}

/** 200 même quand rien n'est parti : `envoye: false` n'est pas un échec
 * technique. */
export interface ResultatEnvoiVisiteDto {
  /** Vrai dès qu'un canal a abouti : lire aussi chaque canal. */
  envoye?: boolean;
  email?: CanalEnvoiDto;
  whatsapp?: CanalEnvoiDto;
}

/** Corps vide valide : plein tarif du lot. */
export interface EnvoyerOffrePrixRequest {
  /** En pourcentage (5 = 5 %), pas un ratio 0–1 comme `DossierDetailDto.discount`. */
  remisePercent?: number;
  /** TTC, remplace le prix commercial du lot. */
  prix?: number;
  modePaiementId?: UUID;
  notes?: string;
}

/** 200 même quand rien n'est parti. L'offre existe indépendamment de l'envoi :
 * ne pas conditionner `offreId`/`offreCode` à `envoye`. */
export interface ResultatEnvoiOffreDto {
  envoye?: boolean;
  offreId?: UUID;
  offreCode?: string;
  /** Seulement si l'appel ne demandait ni remise ni prix. */
  offreReutilisee?: boolean;
  /** Le montant annoncé au prospect, à réafficher plutôt que la saisie. */
  prixFinalTTC?: number;
  /** Seul canal à porter le PDF. */
  email?: CanalEnvoiDto;
  /** Montant en texte, jamais de document. */
  whatsapp?: CanalEnvoiDto;
}

export interface ResultatInteractionDto {
  id: UUID;
  code?: string;
  description?: string;
  necessiteDateRdv?: boolean;
  alerteRecommandee?: boolean;
}


export interface ArticleSummaryDto {
  id: UUID;
  code?: string;
  description?: string;
  area?: number;
  price?: number;
  /* Triplets Id/Code/Libellé : l'`Id` pour lier, le `Code` pour comparer, le
     `Libellé` pour afficher. */
  typeId?: UUID;
  typeCode?: string;
  typeLibelle?: string;
  categorieId?: UUID;
  categorieCode?: string;
  categorieLibelle?: string;
  etageId?: UUID;
  etageCode?: string;
  etageLibelle?: string;
  immeubleId?: UUID;
  immeubleCode?: string;
  immeubleLibelle?: string;
  presentationCode?: string | null;
  presentationLibelle?: string | null;
  /** Peut manquer ici alors que la colonne `articleTitreFoncier` de la liste le
   * sert : une absence ne prouve pas qu'il n'y en a pas. */
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
  prospectionId?: UUID;
  prospectionCode?: string;
  /** Distincte de `dateDocument` (réservation) : sa présence fait dériver
   * « Concrétisation » dans `lib/dossierStatus.ts`. */
  dateConcretisation?: string | null;

  prixAvantRemise?: number;
  /** Pourcentage 0–100 (5 = 5 %), contrairement à `probabiliteFinalisation`. */
  remise?: number;
  /** HT. */
  remiseMontant?: number;
  prixApresRemise?: number;
  montantAvance?: number;
  /** Ratio 0–1 typé `NOMBRE` : exige `formatPercent`, sinon 0,35 s'affiche « 0 ». */
  probabiliteFinalisation?: number;
  modePaie?: string;

  // Coûte trois jointures par ligne côté serveur : ne le demander que si affiché.
  /** Vient de la tranche de l'article : le projet de l'article est nul en base. */
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

  articleId?: UUID;
  articleCode?: string;
  articleLibelle?: string;
  articleTitreFoncier?: string;
  /** Une phrase, pas un code : « Immeuble 05 ». */
  bloc?: string;
  etage?: string;
  categorieArticle?: string;
  typeArticle?: string;
  typePresentation?: string;

  /** En jours entiers. `null` tant que la concrétisation n'a pas eu lieu. */
  delaiConcretisation?: number | null;
  /** Concrétisation → compromis, malgré le nom. En jours. */
  delaiNotaire?: number | null;
  /** Compromis → livraison réelle. En jours. */
  delaiLivraison?: number | null;
  dateCompromis?: string | null;
  dateLivraisonReelle?: string | null;

  /** Le notaire, malgré le nom. */
  avocatId?: UUID;
  avocatNom?: string;
  responsableVenteId?: UUID;
  /** Acteur distinct du commercial, pas un synonyme. */
  responsableVenteNom?: string;

  // Déréférence la prospection : même coût que le groupe patrimoine.
  /** `null` quand le dossier est né sans prospection. */
  etapeProspection?: string;
  origineProspection?: string;
  dateProspection?: string | null;

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
  /** Acteur distinct du commercial. */
  responsableVenteId?: UUID;
  responsableVenteNom?: string;
  dateCompromis?: string | null;
  dateLivraisonReelle?: string | null;
  /** En jours entiers. `null` tant que la concrétisation n'a pas eu lieu. */
  delaiConcretisation?: number | null;
  /** Concrétisation → compromis, malgré le nom. En jours. */
  delaiNotaire?: number | null;
  /** Compromis → livraison réelle. En jours. */
  delaiLivraison?: number | null;
  trancheId?: UUID;
  trancheCode?: string;
  trancheLibelle?: string;
  /** Vient de la tranche de l'article : le lire sur l'article donnerait vide. */
  projetId?: UUID;
  projetCode?: string;
  projetLibelle?: string;
  societeId?: UUID;
  societeCode?: string;
  societeLibelle?: string;
  vocationId?: UUID;
  vocationCode?: string;
  vocationLibelle?: string;
  dateProspection?: string | null;
  /** `null` = dossier né sans prospection, pas une donnée manquante. */
  etapeProspection?: string | null;
  origineProspection?: string | null;
  creePar?: string;
  creeLe?: string | null;
  modifiePar?: string;
  modifieLe?: string | null;
  articles?: ArticleSummaryDto[];
  prixAvantRemise?: number;
  /** Pourcentage 0–100 (`formatPercentValue`), quel que soit l'auteur du dossier. */
  remise?: number;
  /** HT ; le TTC est `prixAvantRemise − prixApresRemise`. */
  remiseMontant?: number;
  prixApresRemise?: number;
  prix?: number;
  montantAvance?: number;
  totalAPayer?: number;
  notes?: string;
  /** Fraction, pas pourcentage (`1.00` = 100 %) : `formatPercent`, jamais
   * `formatNumber`. */
  probabiliteFinalisation?: number;
  modePaie?: string;


  prixM2?: number;
  /** HT après remise ; le pendant HT de `prix`. */
  prixHT?: number;
  /** HT avant remise (« Total HT »). */
  prixAvantRemiseHT?: number;
  /** Fraction (`0.2`). `null` ou zéro = non saisi, pas un taux nul. */
  tauxTVA?: number;
  /* `titreFoncier` et `presentation*` sont sur `ArticleSummaryDto`, pas ici :
     lire `articles[0]`. */
  dateValiditeStatut?: string | null;
  /** Fraction, pas pourcentage. Quotes-parts des co-acquéreurs : `/payeurs`. */
  quotePart?: number;
  prospectionId?: UUID;
  prospectionCode?: string;
}

/* ---- Fiche complète du dossier et ses actions (FEATURE-vente-fiche.md) ---- */

/** En-tête de la fiche : article et sous-articles séparés, HT et TTC. Montants en DH. */
export interface EnTeteFicheDto {
  superficie?: number | null;
  prixM2HT?: number | null;
  prixM2TTC?: number | null;
  prixArticleHT?: number | null;
  prixArticleTTC?: number | null;
  prixSousArticlesHT?: number | null;
  prixSousArticlesTTC?: number | null;
  totalHT?: number | null;
  totalTTC?: number | null;
  remiseMontantHT?: number | null;
  /** Pourcentage 0–100 : `formatPercentValue`. */
  remisePourcentage?: number | null;
  prixVenteHT?: number | null;
  prixVenteTTC?: number | null;
  /** `AgreementPrice` : Σ des lignes non exclues du prix contractuel, pas le total à payer. */
  prixContractuel?: number | null;
}

export interface StatutFicheDto {
  code?: string | null;
  dateValidite?: string | null;
  expire: boolean;
}

export interface AutresMontantsFicheDto {
  superficie?: number | null;
  superficieGlobale?: number | null;
  /** Ratio 0–1 : `formatPercent`. */
  tauxTva?: number | null;
  prixArticleM2HT?: number | null;
  prixArticleM2TTC?: number | null;
  prixArticleHT?: number | null;
  prixArticleTTC?: number | null;
  prixSousArticlesHT?: number | null;
  prixSousArticlesTTC?: number | null;
  prixArticleApresRemiseHT?: number | null;
  prixArticleApresRemiseTTC?: number | null;
  prixSousArticlesApresRemiseHT?: number | null;
  prixSousArticlesApresRemiseTTC?: number | null;
  totalHT?: number | null;
  totalTTC?: number | null;
  /** Pourcentage 0–100. */
  remisePourcentage?: number | null;
  prixVenteHT?: number | null;
  prixVenteTTC?: number | null;
  /** `null` si la superficie vendue est nulle. */
  prixVenteM2HT?: number | null;
  prixVenteM2TTC?: number | null;
}

/** Chaque date est `null` tant que le jalon n'est pas atteint. */
export interface DatesFicheDto {
  concretisation?: string | null;
  promesseVente?: string | null;
  visiteTechnique?: string | null;
  envoiNotairePrevisionnel?: string | null;
  envoiNotaireConfirme?: boolean | null;
  enregistrementContrat?: string | null;
  envoiNotaire?: string | null;
  minute?: string | null;
  expedition?: string | null;
  relanceTitreFoncier1?: string | null;
  echeanceRelance1?: string | null;
  relanceTitreFoncier2?: string | null;
  echeanceRelance2?: string | null;
  ficheBancaire?: string | null;
  /** « Compromis / approbation crédit » (`CreditApprovalDate`). */
  compromis?: string | null;
  attestation?: string | null;
  intervention?: string | null;
  assurance?: string | null;
  remiseClesPrevue?: string | null;
  remiseClesEffective?: string | null;
  /** Lu sur la tranche. */
  permisHabiter?: string | null;
  actePrecision?: string | null;
}

export interface DatesAutresFicheDto {
  promesseClient?: string | null;
  promesseEnregistrement?: string | null;
  impressionContrat?: string | null;
  minuteClient?: string | null;
  minuteAvocat?: string | null;
  minuteRemiseLegalisation?: string | null;
  minuteLegalisation?: string | null;
  minuteDepotEnregistrement?: string | null;
  remiseClesClient?: string | null;
  remiseClesEnregistrement?: string | null;
  actePrecisionClient?: string | null;
  actePrecisionAvocat?: string | null;
  actePrecisionRemiseLegalisation?: string | null;
  actePrecisionLegalisation?: string | null;
  actePrecisionDepotEnregistrement?: string | null;
  actePrecisionEnregistrement?: string | null;
  cpfDepot?: string | null;
  cpfRetrait?: string | null;
  remiseCertificatPropriete?: string | null;
  numeroTitre?: string | null;
}

export interface AnnulationFicheDto {
  date?: string | null;
  causes?: string | null;
}

export interface AutresFicheDto {
  gestionnaire1Id?: UUID | null;
  gestionnaire1Nom?: string | null;
  gestionnaire2Id?: UUID | null;
  gestionnaire2Nom?: string | null;
  banqueCreditId?: UUID | null;
  banqueCreditNom?: string | null;
  agenceCredit?: string | null;
  notaireId?: UUID | null;
  notaireNom?: string | null;
  note?: string | null;
  ancienClient?: boolean | null;
  cadeauPlusTard?: boolean | null;
  integrerModificationsAuPrix?: boolean | null;
  meilleurTauxEnvoi?: string | null;
  meilleurTauxDecision?: string | null;
  meilleurTauxDecisionDate?: string | null;
  penalitesDesactivees?: boolean | null;
}

export interface DossierFicheDto {
  id: UUID;
  code?: string | null;
  enTete: EnTeteFicheDto;
  statut: StatutFicheDto;
  autresMontants: AutresMontantsFicheDto;
  dates: DatesFicheDto;
  datesAutres: DatesAutresFicheDto;
  annulation: AnnulationFicheDto;
  autres: AutresFicheDto;
  /** Bandeau « pièces de règlement impayées » : une échéance échue reste due. */
  aDesImpayes: boolean;
  /** Vrai seulement pour le commercial destinataire d'une instruction non lue. */
  instructionNonLue: boolean;
}

export interface ActionDossierDto {
  id: UUID;
  date?: string | null;
  typeId?: UUID | null;
  type?: string | null;
  categorie?: string | null;
  note?: string | null;
  auteur?: string | null;
  dateAlerte?: string | null;
  instruction: boolean;
  destinataireId?: UUID | null;
  destinataireNom?: string | null;
  nonLue: boolean;
}

export interface CompteurTypeActionDto {
  /** `null` pour les actions sans type. */
  typeId?: UUID | null;
  type?: string | null;
  nombre: number;
}

export interface ActionsDossierDto {
  actions: ActionDossierDto[];
  parType: CompteurTypeActionDto[];
}

/** La catégorie est déduite du statut par le serveur ; 409 si le dossier n'a pas de statut. */
export interface CreerActionDossierRequest {
  /** `/api/referentiels/types-contact-prospection` ; « Instruction » refusé (400). */
  typeId: UUID;
  date?: string;
  note: string;
  dateAlerte?: string;
}

export interface CreerInstructionRequest {
  note: string;
  dateAlerte?: string;
}

export interface InstructionCreeeDto {
  instruction: ActionDossierDto;
  emailEnvoye: boolean;
}

/** En PATCH : champ absent ou `null` = inchangé, `""` = effacé ; 50 caractères au plus (400). */
export interface CompteursDto {
  referenceSteg?: string | null;
  compteurElectricite?: string | null;
  releveElectricite?: string | null;
  policeElectricite?: string | null;
  compteurEau?: string | null;
  releveEau?: string | null;
  policeEau?: string | null;
  compteurGaz?: string | null;
  releveGaz?: string | null;
  policeGaz?: string | null;
}

export interface VisiteTechniqueDto {
  id: UUID;
  dossierId?: UUID | null;
  dossierCode?: string | null;
  titre?: string | null;
  debut?: string | null;
  fin?: string | null;
  note?: string | null;
}

export interface CalendrierVisitesDto {
  trancheId?: UUID | null;
  trancheLibelle?: string | null;
  /** `null` = aucune visite ne peut être programmée (409). */
  responsableSav?: string | null;
  /** En heures. */
  delaiMinimumHeures?: number | null;
  maxVisitesParJour?: number | null;
  creneaux: VisiteTechniqueDto[];
}

export interface ProgrammerVisiteRequest {
  debut: string;
  fin: string;
  note?: string;
}

export interface VisiteProgrammeeDto {
  visite: VisiteTechniqueDto;
  emailEnvoye: boolean;
}

export interface EtatPrixDto {
  superficie?: number | null;
  superficieGlobale?: number | null;
  /** Ratio 0–1. */
  tauxTva?: number | null;
  prixM2HT?: number | null;
  prixSousArticlesHT?: number | null;
  totalHT?: number | null;
  remiseMontantHT?: number | null;
  /** Pourcentage 0–100. */
  remisePourcentage?: number | null;
  prixVenteHT?: number | null;
  prixVenteTTC?: number | null;
}

export interface ReinitialisationDto {
  avant: EtatPrixDto;
  apres: EtatPrixDto;
  modifie: boolean;
  /** Codes des sous-articles du stock absents du dossier, ajoutés par la réinitialisation. */
  sousArticlesAjoutes: string[];
}

export type LigneCibleReajustement = 'AUTOFINANCEMENT' | 'CREDIT' | 'NOUVELLE_LIGNE_AUTOFINANCEMENT';

export interface LigneReajustementDto {
  dossierId: UUID;
  dossierCode?: string | null;
  articleCode?: string | null;
  client?: string | null;
  ancienneSuperficie?: number | null;
  nouvelleSuperficie?: number | null;
  differenceSuperficie?: number | null;
  ancienPrix?: number | null;
  nouveauPrix?: number | null;
  differencePrix?: number | null;
  differenceSchema?: number | null;
  ligneCible?: LigneCibleReajustement | null;
  ligneCibleId?: UUID | null;
  ligneCibleDate?: string | null;
  notes?: string | null;
  /** Raison de l'exclusion (prix du m² ou de stock absent…) : non cochable, POST = 409. Null sinon. */
  motifExclusion?: string | null;
}

export interface CreerDossierRequest {
  prospectionId: UUID;
  articleIds: UUID[];
  /** TTC. Avec `remisePercent` : prix avant remise. Sans : prix négocié après
   * remise, la remise étant déduite de l'écart au prix commercial. */
  prix?: number;
  /** Pourcentage 0–100, pas un ratio (400 hors bornes). Les frais syndic ne
   * sont jamais remisés. */
  remisePercent?: number;
  notes?: string;
  /** 400 si absents, bien que la spec ne les marque pas `required`. */
  modePaieId?: UUID;
  cin?: string;
}

/** Ne réserve rien : les articles n'ont pas à être disponibles. */
export interface SimulerSchemaFinancementRequest {
  articleIds: UUID[];
  /** Avec `remisePercent` : prix avant remise. Sans : prix négocié tel quel. */
  prix: number;
  /** Mêmes règles que `CreerDossierRequest.remisePercent`. La réponse ne
   * renvoie pas le prix après remise : il est calculé côté client. */
  remisePercent?: number;
}
export interface LigneSchemaFinancementDto {
  categorie?: string;
  montant?: number;
  /** Frais en sus (frais syndic) : ne pas l'additionner au prix. */
  exclureDuPrix?: boolean;
}
/** Montants de remise lus sur le calcul de `POST /api/dossiers` : principal + annexes, TTC
 * (le dossier créé expose `remiseMontant` en HT). */
export interface SchemaFinancementDto {
  lignes?: LigneSchemaFinancementDto[];
  totalGeneral?: number;
  prixAvantRemise?: number;
  montantRemise?: number;
  /** 0–100 (`formatPercentValue`), pas un ratio. */
  remisePercent?: number;
  prixApresRemise?: number;
}

export interface ChangerStatutRequest {
  statut: string;
  date?: string;
  note?: string;
}

export interface EtapeSuivanteDto {
  statut: string;
  /** Nom du champ date du dossier dont dérive l'étape (ex. `agreementDate`). */
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
  /** `null` si absent : afficher « N.A. » côté front, l'API ne le fait pas. */
  decompte?: string | null;
  /** Création de la ligne, pas l'exigibilité (`dateEcheance`). */
  creeLe?: string | null;
}

/** `categorieId` obligatoire à la création (400 sinon). */
export interface CreerEcheanceRequest {
  dateEcheance?: string | null;
  montant?: number;
  description?: string;
  categorieId: UUID;
  exclureDuPrix?: boolean;
  notes?: string;
}

export type ModifierEcheanceRequest = Partial<CreerEcheanceRequest>;

/** Le payeur peut différer de l'acquéreur principal du dossier. */
export interface ReglementDto {
  id: UUID;
  echeanceId?: UUID;
  reference?: string;
  dateDocument?: string | null;
  dateEcheance?: string | null;
  /** Écrite seulement au passage à `POINTED`, jamais à la création. */
  dateReglement?: string | null;
  /** `IN_WORK`, `POINTED` ou `CANCELED` (terminaux), non énuméré par la spec :
   * normaliser via `encaissementEtatLabel`/`encaissementEtatTone`. */
  statut?: string;
  montant?: number;
  typeId?: UUID;
  typeCode?: string;
  typeLibelle?: string;
  /** Seulement si `TypeReglementDto.banqueObligatoire`. */
  banqueId?: UUID;
  banqueNom?: string;
  payeurId?: UUID;
  payeurNom?: string;
  notes?: string;
}

export interface EncaissementDto {
  id: UUID;
  reference?: string;
  /** Typé `string` : outre `IN_WORK`, `POINTED` et `CANCELED`, d'autres valeurs
   * existent côté légataire (impayé, perdu). */
  etat?: string;
  dossierId?: UUID;
  dossierCode?: string;
  dateDocument?: string | null;
  dateEcheance?: string | null;
  dateReglement?: string | null;
  tierId?: UUID;
  tierNom?: string;
  montantBrut?: number;
  /** Part non encore affectée à une échéance. */
  montantBrutRestant?: number;
  /** Après retenue à la source et timbre. */
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

  description?: string;
  montantBase?: number;
  /** Le tiers qui paie, distinct de `tierId`. */
  tierPayeurId?: UUID;
  tierPayeurNom?: string;
  /** Presque toujours vide : ne pas en faire une colonne qu'on croit remplie. */
  recuCode?: string;
  remisAuCentre?: boolean;
  dateRemiseAuCentre?: string | null;
  bordereauCode?: string;
  dateBordereau?: string | null;
  creePar?: string;
  creeLe?: string | null;
  modifiePar?: string;
  modifieLe?: string | null;
}

/** Un règlement peut porter plusieurs affectations, sur plusieurs dossiers ; la
 * somme des `montantAffecte` vaut `montantBrut - montantBrutRestant`. */
export interface AffectationDto {
  id: UUID;
  /** Part imputée à cette échéance, pas le montant du règlement. */
  montantAffecte?: number;
  echeanceId?: UUID;
  echeanceCode?: string;
  echeanceDescription?: string;
  dateEcheance?: string | null;
  /** Total de l'échéance, toutes imputations confondues. */
  montantEcheance?: number;
  categorieId?: UUID;
  categorie?: string;
  /** Peut différer d'une ligne à l'autre. */
  dossierId?: UUID;
  dossierCode?: string;
}

/** Tous les champs, non filtrés par `?colonnes=`. */
export interface EncaissementDetailDto extends EncaissementDto {
  /** Vide = encaissé mais pas encore imputé. */
  affectations?: AffectationDto[];
}

/** Naît toujours `IN_WORK`. Pour un règlement déjà encaissé : ce POST, puis
 * `POST .../pieces-jointes`, puis `PATCH .../statut` — dans cet ordre. */
export interface CreerReglementRequest {
  /** Au plus le reste à payer de l'échéance (400 sinon). */
  montant: number;
  /** Requise : pas de valeur par défaut côté serveur. */
  dateEcheance: string | null;
  typeId: UUID;
  /** Requise si `TypeReglementDto.banqueObligatoire` (400 sinon). */
  banqueId?: UUID;
  /** Requise si `TypeReglementDto.referenceObligatoire` (400 sinon). */
  reference?: string;
  /** Peut différer de l'acquéreur principal ; candidats : `/payeurs`. */
  payeurId: UUID;
  notes?: string;
  /** Littéral exprès : `POINTED` vaut 400, la preuve de paiement ne pouvant
   * exister avant le règlement. */
  statut?: 'IN_WORK';
  /* `dateReglement` absent exprès, bien que la spec le déclare : 400 si
     fourni à la création. Ne pas l'ajouter. */
}

/** Transitions `IN_WORK → POINTED | CANCELED` seulement (409 sinon). Pointer
 * exige au moins une pièce jointe (409 sinon). */
export interface ModifierStatutReglementRequest {
  statut: 'POINTED' | 'CANCELED';
  /** Requise pour `POINTED` (400 sinon) ; ignorée pour `CANCELED`. */
  dateReglement?: string | null;
}

/** Liste indicative, pas fermée : un tiers hors liste peut payer. */
export interface PayeurDto {
  id: UUID;
  nom?: string;
  role?: 'ACQUEREUR_PRINCIPAL' | 'CO_ACQUEREUR';
  /** Déjà formatée (`CIN: E400556`). */
  pieceIdentite?: string | null;
  /** Pourcentage 0–100, alors que `DossierDetailDto.quotePart` est une
   * fraction. Toujours `null` pour l'acquéreur principal. */
  quotePart?: number | null;
}

export interface CategorieMontantDto {
  categorie?: string;
  montant?: number;
  nombreLignes?: number;
  regle?: number;
  reste?: number;
}

/** `reste` est servi, ne pas le recalculer côté front. */
export interface SyntheseMontantDto {
  montant?: number;
  regle?: number;
  reste?: number;
}

/** Les catégories ne s'additionnent pas jusqu'au prix de vente : `prixVente`
 * et `netAPayer` sont des lignes de synthèse, pas des catégories. */
export interface MontantsDossierDto {
  /** Vide sans échéancier ; les lignes de synthèse restent servies. */
  parCategorie?: CategorieMontantDto[];
  totalGeneral?: number;
  totalSoumisReglePrixTTC?: number;
  /** `montant` est le prix stocké, qui fait foi ; `regle` exclut les frais. */
  prixVente?: SyntheseMontantDto;
  /** Sur un dossier sorti, réduit à l'encaissé et reste à zéro : règle
   * métier à expliquer à l'écran, pas une donnée manquante. */
  netAPayer?: SyntheseMontantDto;
  /** `ANNULATION` ou `DESISTEMENT`. */
  dossierSorti?: boolean;
}

export interface PieceJointeDto {
  id: UUID;
  description?: string;
  /** Catégorie legacy brute (`Yes.Com.Sales.Sale`) : aucune logique dessus. */
  category?: string;
  type?: string | null;
  extension?: string;
  dateCreation?: string | null;
  /** `null` sur les pièces jointes créées hors de cette API. */
  creePar?: string | null;
}


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
  /** Prix plancher, repli quand `salePrice` vaut 0. */
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
  sousArticle?: boolean;
  lotParentId?: UUID;
  dossierId?: UUID;
  dossierCode?: string;
  /** Code brut : passer par `canonicalStatusLabel`/`toneForStatus`. */
  dossierStatut?: string;
  clientId?: UUID;
  clientNom?: string;
  /** Ratio (0.20 = 20 %). */
  tauxTVA?: number;
  /** Scopé par tranche. */
  presentationTypeId?: UUID;
  presentationTypeCode?: string;
  presentationTypeLibelle?: string;
  /** N'inclut pas `area` (superficie de l'article lui-même). */
  superficieSousArticles?: number;
  immeubleId?: UUID;
  immeubleCode?: string;
  immeubleLibelle?: string;
  etageId?: UUID;
  etageCode?: string;
  etageLibelle?: string;
  natureId?: UUID;
  natureCode?: string;
  natureLibelle?: string;
  /** TTC : `comSalePrice` s'il est > 0, sinon `comSalePriceFloor` s'il est > 0,
   * sinon null. Ne pas recalculer côté front. */
  prixSuggere?: number | null;
  prixSuggereEstPlancher?: boolean;
}

export interface ArticleDetailDto {
  id: UUID;
  code?: string;
  description?: string;
  adresse?: string;
  area?: number;
  salePrice?: number;
  comSalePrice?: number;
  /** `salePrice` peut valoir 0 alors qu'un plancher existe : afficher celui-ci
   * en repli. */
  salePriceFloor?: number;
  comSalePriceFloor?: number;
  statut?: ArticleStatut;
  trancheId?: UUID;
  trancheCode?: string;
  trancheDescription?: string;
  lotParentId?: UUID;
  lotParentCode?: string;
  lotParentDescription?: string;
  /** Quel que soit leur statut de disponibilité. */
  sousLots?: ArticleListItemDto[];
  titreFoncier?: string;
  categorieId?: UUID;
  categorieCode?: string;
  categorieLibelle?: string;
  typeId?: UUID;
  typeCode?: string;
  typeLibelle?: string;
  dossierId?: UUID;
  dossierCode?: string;
  dossierStatut?: string;
  clientId?: UUID;
  clientNom?: string;
  /** `null` légitime : un terrain n'a ni immeuble ni étage. */
  immeubleId?: UUID;
  immeubleCode?: string;
  immeubleLibelle?: string;
  etageId?: UUID;
  etageCode?: string;
  etageLibelle?: string;
  natureId?: UUID;
  natureCode?: string;
  natureLibelle?: string;
  /** Ratio (0.20 = 20 %). */
  tauxTVA?: number;
  presentationTypeId?: UUID;
  presentationTypeCode?: string;
  presentationTypeLibelle?: string;
  /** N'inclut pas `area`. */
  superficieSousArticles?: number;
  /** Voir `ArticleListItemDto.prixSuggere`. */
  prixSuggere?: number | null;
  prixSuggereEstPlancher?: boolean;
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

/* Relances commerciales, distinctes de `DashboardDto.relancesEnRetard`
   (relances de dossier) : ne pas confondre les deux populations. */

/** `RETARD` : 1 à 30 jours seulement. L'écran est une file du jour, jamais le
 * compte des relances en retard (l'arriéré se lit via `/api/prospections`). */
export type EcheanceRelance = 'AUJOURDHUI' | 'RETARD';

/** Les relances non affectées sont incluses dans les deux portées. */
export type PorteeRelance = 'MOI' | 'EQUIPE';

export interface RelanceProspectionDto {
  /** C'est l'interaction qu'il faut viser pour désarmer ou reporter, pas la
   * prospection. */
  interactionId: UUID;
  prospectionId: UUID;
  /** Toujours `nonAffectee` dans ce cas. */
  preProspection?: boolean;
  /** `null` sur une pré-prospection : `telephone` est alors le seul repère. */
  prospectNom?: string | null;
  telephone?: string | null;
  /** Date seule (minuit), bien que servie en date-heure. */
  dateRelance?: string | null;
  joursDeRetard?: number;
  motif?: string | null;
  commercialId?: UUID | null;
  commercialNom?: string | null;
  /** Servies quelle que soit la portée, `MOI` compris. */
  nonAffectee?: boolean;
  derniereInteractionDate?: string | null;
}

/** Arrivées par rafales : une journée vide est courante et se lit « aucun
 * lead », jamais « panne ». */
export interface NouveauPreProspectDto {
  /** Route de détail : celle des pré-prospections. */
  prospectionId: UUID;
  code?: string | null;
  nom?: string | null;
  telephone?: string | null;
  email?: string | null;
  dateCreation?: string | null;
}

/* Trois blocs qui ne se somment pas : l'échéancier est du dû, les
   encaissements du réalisé, les ventes un sous-ensemble des dossiers. */

/** Montant dû, pas encaissé. */
export interface PointMensuelDto {
  /** 1 à 12. */
  mois: number;
  /** `0`, jamais `null`, pour un mois vide. */
  montant: number;
  /** Seul moyen de distinguer un mois vide d'un mois à zéro. */
  lignes: number;
}

export interface VentesConcretiseesDto {
  nombreDossiers: number;
  prixTotal: number;
  /** Hors frais : ce n'est pas « prixTotal moins le reste à payer ». */
  montantRegle: number;
  /** Compteur global, pas annuel. À afficher : `nombreDossiers` ne couvre que
   * les dossiers pourvus d'une date d'avance. */
  dossiersSansDateAvance: number;
}

/** Crédits seulement. */
export interface EncaissementsAnnuelsDto {
  nombreLignes: number;
  montantTotal: number;
}

export interface SyntheseAnnuelleDto {
  annee: number;
  /** Toujours 12 points, janvier à décembre, sans trou. */
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


export interface Pageable {
  /** Indexée à partir de 0. */
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


export interface ReferentielItemDto {
  id: UUID;
  code?: string;
  description?: string;
  sorting?: number;
}

/** Distinct de `modes-paiement` : deux tables différentes malgré des noms
 * proches. */
export interface TypeReglementDto {
  id: UUID;
  code?: string;
  description?: string;
  banqueObligatoire?: boolean;
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


export interface EvenementCalendrierDto {
  interactionId: UUID;
  sujet?: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  lieu?: string;
  resultatId?: UUID;
  /** Distinguer RDV et visite par ce code, jamais par le libellé. */
  resultatCode?: string;
  resultatDescription?: string;
  prospectionId?: UUID;
  prospectionCode?: string;
  prospectId?: UUID;
  prospectNom?: string;
  commercialId?: UUID;
  commercialNom?: string;
}


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
  | 'COMMERCIAL_ASSIGNE'
  | 'COMMERCIAL_REAFFECTE'
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


// Le cookie JWT httpOnly n'est jamais lisible côté front : l'état de session
// passe uniquement par `UtilisateurCourantDto`.

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
  /** Drapeau hérité, ignoré : ne bloque plus rien. */
  mustChangePassword?: boolean;
  /** Drapeau hérité, ignoré. */
  profileCompleted?: boolean;
  /** Filtrage fait par le serveur (404 hors périmètre) : le front ne doit
   * jamais refiltrer lui-même. */
  perimetreRestreint?: boolean;
  /** Vide = aucune restriction, jamais « ne voit rien ». */
  projetsAutorises?: ProjetPerimetreDto[];
}

export interface ProjetPerimetreDto {
  id: UUID;
  code?: string;
  libelle?: string;
}

/** Remplacement intégral, pas un delta. `[]` retire toute restriction ;
 * absent ou `null` vaut 400 — ne jamais envoyer `undefined`. */
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

export interface UtilisateurListItemDto {
  id: UUID;
  username?: string;
  description?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  disabled?: boolean;
  employeeId?: UUID;
  employeePrenom?: string;
  employeeNom?: string;
  typeEmployeCode?: string;
  typeEmployeLibelle?: string;
  roles?: string[];
  /** `false` : compte légataire jamais connecté ni initialisé. */
  compteWebInitialise?: boolean;
  /** Drapeau hérité, ignoré : ne bloque plus rien. */
  mustChangePassword?: boolean;
  /** Drapeau hérité, ignoré. */
  profileCompleted?: boolean;
  dateCreation?: string;
  /** 0 = aucune restriction. Ignore les rôles d'exemption : un Administrateur
   * affecté à 2 projets affiche 2 sans jamais être filtré. */
  nombreProjets?: number;
}

/** Absent ou `{}` : envoi à l'adresse connue du compte, ou aucun envoi. */
export interface ReinitialiserMotDePasseRequest {
  /** Pour cette fois seulement, jamais enregistrée. Invalide : 400. */
  email?: string | null;
}

export interface ReinitialiserMotDePasseResponse {
  admUserId: UUID;
  username?: string;
  /** Renvoyé une seule fois, et pas provisoire malgré le nom. */
  motDePasseTemporaire?: string;
  /** Envoi déclenché, remise non garantie. `false` : transmettre à la main. */
  emailEnvoye?: boolean;
  /** Masquée. */
  destinataire?: string | null;
}

export interface HotlineFicheDto {
  tier: ProspectDetailDto;
  prospections?: ProspectionListItemDto[];
  dossiers?: DossierListItemDto[];
  reglements?: ReglementProspectDto[];
  interactions?: InteractionDto[];
  historique?: HistoriqueDto[];
}

export interface HotlineResultDto {
  /** Détermine lesquels des champs `telephone*` / `nomRecherche` sont
   * renseignés ; les autres valent `null`. */
  critere?: 'TELEPHONE' | 'NOM';
  telephoneRecherche?: string | null;
  /** Chiffres seuls, 9 derniers conservés (indicatif ignoré). */
  telephoneNormalise?: string | null;
  nomRecherche?: string | null;
  /** À afficher : liste coupée au-delà de 20 fiches, sinon l'agent croit la
   * personne inconnue. Toujours `false` par téléphone. */
  tronque?: boolean;
  connu?: boolean;
  fiches?: HotlineFicheDto[];
  /** Pré-prospections au même numéro jamais rattachées à une fiche. */
  appelsSansFiche?: ProspectionListItemDto[];
}

/* L'activité est comptée pour celui qui l'a saisie, le portefeuille pour le
   commercial assigné : deux attributions distinctes, volontairement. */
export interface ActionParTypeDto {
  /** « (sans type) » pour les actions sans type. */
  type?: string;
  nombre?: number;
}

export interface PerformanceCommercialDto {
  /** Id du tiers, pas du compte (plusieurs comptes s'additionnent). `null` pour
   * un compte sans employé : la ligne est alors identifiée par `utilisateurId`. */
  commercialId?: UUID | null;
  /** Seulement pour un compte sans employé, qui n'a pas de portefeuille. */
  utilisateurId?: UUID | null;
  commercialNom?: string;
  du?: string;
  au?: string;

  appelsPasses?: number;
  appelsRecus?: number;
  visitesRealisees?: number;
  /** Engagement de visite obtenu au téléphone, pas une visite réalisée. */
  visitesDecrochees?: number;
  rdvObtenus?: number;
  /** Actions « Système » exclues. */
  interactionsTotal?: number;
  actionsParType?: ActionParTypeDto[];

  /** Quel qu'en soit l'assigné. */
  prospectionsTraitees?: number;
  prospectionsAssignees?: number;
  prospectionsCloturees?: number;
  /** Interaction reçue de lui ou d'un autre. */
  prospectionsPrisesEnCharge?: number;
  /** Ratio 0–1. `null` si rien d'assigné, jamais 0. */
  tauxPriseEnCharge?: number | null;
  /** Médiane en heures. Non agrégeable : pas de médiane de médianes. */
  delaiMedianPremiereReponseHeures?: number | null;

  dossiersCrees?: number;
  montantTotal?: number;
  panierMoyen?: number | null;
  /** Ratio 0–1. `null` si aucun appel passé. */
  tauxAppelVersRdv?: number | null;
  /** Ratio 0–1. `null` si aucune action. */
  tauxActionVersRdv?: number | null;
  /** Ratio 0–1. `null` si rien d'assigné. Bruyant sur petit effectif. */
  tauxProspectionVersDossier?: number | null;
}

// « Mon équipe » (/api/equipe/*) : Commercial Chef, Administrateur, Direction Générale.

export interface CommercialEquipeDto {
  admUserId: UUID;
  code?: string;
  nom?: string;
  /** Employé (CfgTier) à envoyer comme `commercialId` ; `null` = ne peut rien recevoir. */
  commercialId?: UUID | null;
  projets: ProjetPerimetreDto[];
  /** État à ce jour, indépendant de la période. */
  portefeuilleOuvert: number;
  sansActionDepuis7Jours: number;
  relancesEnRetard: number;
  performance: PerformanceCommercialDto;
}

export interface ADistribuerDto {
  nombre: number;
  plusAncienneDate?: string | null;
  agePlusAncienneJours?: number | null;
}

/** Ligne de `GET /api/equipe/a-distribuer/lignes` (FEATURE-a-distribuer-jamais-traitees.md §3.1). */
export interface LigneADistribuerDto {
  id: UUID;
  code?: string | null;
  /** Prospect lié, sinon `TempDescription`. */
  nom?: string | null;
  /** `null` = sans tranche. */
  trancheCode?: string | null;
  projetId?: UUID | null;
  dateDocument?: string | null;
  /** Au moins une action non système ; toujours faux quand `toutes=false`. */
  dejaTraitee: boolean;
}

/** Filtre de la carte « À distribuer » ; `toutes` absent = jamais traitées seulement. */
export interface FiltreADistribuer {
  du?: string;
  au?: string;
  projet?: UUID;
  toutes?: boolean;
}

/** Pose le commercial sur la pré-prospection, sans la transformer (comme OMRAN). */
export interface DistribuerRequest {
  preProspectionIds: UUID[];
  commercialId: UUID;
}

export interface ReaffecterRequest {
  /** Prospections et pré-prospections déjà affectées, mêlées ; une pré-prospection sans commercial → 409. */
  prospectionIds: UUID[];
  commercialId: UUID;
  motif?: string | null;
}

export interface LeadsActiviteRequest {
  /** 1 à 200 ids de pré-prospections / prospections ; sinon 400. */
  ids: UUID[];
}

/** `POST /api/equipe/leads/activite` : un élément par lead visible (les autres ids sont omis). */
export interface LeadActiviteDto {
  id: UUID;
  /** Actions non système (`IsSystem` faux ou absent). */
  nombreActions: number;
  /** Plus récente de ces actions ; `null` si aucune. */
  derniereActionDate?: string | null;
  /** Jours entiers depuis la dernière action, à défaut la date du lead. */
  joursSansAction: number;
  /** Même règle que la colonne « Sans action > 7 j ». */
  endormi: boolean;
  /** 0 action **et** étape de départ (`1 A TRAITER` ou aucune) : même règle que la Boîte de tri. */
  jamaisTraite: boolean;
}

export interface LigneLotDto {
  id: UUID;
  code?: string;
  ancienCommercialNom?: string | null;
}

export interface ResultatLotDto {
  nombre: number;
  commercialId?: UUID;
  commercialNom?: string | null;
  lignes: LigneLotDto[];
}

// Répartition automatique (POST /api/equipe/repartir, FEATURE-repartition-notifications.md §3).

export type MotifAttribution = 'CONNU' | 'MOINS_CHARGE';
export type RaisonNonAttribution = 'SANS_PROJET' | 'AUCUN_ELIGIBLE' | 'DEJA_ATTRIBUEE';

/** Exactement un des deux : `preProspectionIds` non vide, ou `filtre` (toutes les lignes du filtre). */
export interface RepartirRequest {
  preProspectionIds?: UUID[];
  filtre?: FiltreADistribuer;
  /** `true` (ou absent) : aperçu, rien n'est écrit. */
  simulation: boolean;
}

export interface RepartitionCommercialDto {
  commercialId?: UUID;
  commercialNom?: string | null;
  nombre: number;
}

export interface AttributionDto {
  preProspectionId?: UUID;
  code?: string;
  commercialId?: UUID;
  commercialNom?: string | null;
  motif?: MotifAttribution;
}

export interface NonAttribueeDto {
  preProspectionId?: UUID;
  code?: string;
  raison?: RaisonNonAttribution;
}

export interface ResultatRepartitionDto {
  simulation: boolean;
  attributions: AttributionDto[];
  nonAttribuees: NonAttribueeDto[];
  parCommercial: RepartitionCommercialDto[];
}

export interface MembreAffectationDto {
  admUserId: UUID;
  code?: string;
  nom?: string;
  commercialId?: UUID | null;
  /** Parmi les projets de l'appelant seulement. */
  projetIds: UUID[];
  sansRestriction: boolean;
  /** `false` : autre chef, admin ou direction — l'appelant ne peut pas le modifier. */
  modifiable: boolean;
}

export interface AffectationsEquipeDto {
  projets: ProjetPerimetreDto[];
  commerciaux: MembreAffectationDto[];
  affectables: MembreAffectationDto[];
}

/** Jamais un remplacement total ; retirer le dernier projet = 409. */
export interface ModifierAffectationsRequest {
  ajouter?: UUID[];
  retirer?: UUID[];
}

// Appel synchrone : la réponse n'arrive qu'en fin de cycle. 409 si un cycle
// tourne déjà ou en mono-base.

export interface SynchronisationResultatDto {
  /** `null` si le Change Tracking n'est pas actif : le cycle n'a rien fait. */
  version?: number | null;
  fusions?: number;
  suppressions?: number;
  tablesTraitees?: number;
  tablesEnEchec?: number;
  dureeMs?: number;
}


/** Route hors portée : 403 `HORS_PORTEE`. */
export type PorteeCleApi = 'PRE_PROSPECTIONS_ECRIRE' | 'PRE_PROSPECTIONS_LIRE' | 'REFERENTIELS_LIRE';

/** Le secret n'est jamais renvoyé ici, seulement `clePrefixe`. */
export interface CleApiDto {
  id: UUID;
  nom?: string;
  clePrefixe?: string;
  compteCode?: string;
  compteNom?: string;
  portees?: PorteeCleApi[];
  /** `false` = révoquée (401). */
  actif?: boolean;
  dernierUsage?: string | null;
  dateCreation?: string | null;
  creePar?: string | null;
  revoqueLe?: string | null;
  revoquePar?: string | null;
}

/** `cle` est montré une seule fois : aucune autre route ne le renvoie. */
export interface CleApiCreeeDto {
  cleApi: CleApiDto;
  /** À envoyer dans `X-Api-Key`. */
  cle: string;
}

export interface CreerCleApiRequest {
  /** Unique (409 sinon). */
  nom: string;
  /** Au moins une (400 sinon). */
  portees: PorteeCleApi[];
  /** Absent : compte de service créé sans rôle ni périmètre, la portée étant
   * sa seule limite. 400 si inconnu. */
  compteCode?: string;
}

// ---------------------------------------------------------------- Parcours commercial
// FEATURE-parcours-commercial.md : « Ma journée », Boîte de tri, Kanban.

export interface LeadJourneeDto {
  prospectionId: UUID;
  code?: string;
  nom?: string | null;
  telephone?: string | null;
  /** Seulement pour le mobile de la fiche ; `null` pour le numéro du formulaire. */
  indicatif?: string | null;
  projetCode?: string | null;
  trancheCode?: string | null;
  recuLe?: string | null;
  ageJours: number;
  message?: string | null;
  source?: string | null;
}

export interface RelanceJourneeDto {
  interactionId: UUID;
  prospectionId: UUID;
  /** Encore une pré-prospection : sa fiche est sous `/pre-prospections/:id`. */
  preProspection: boolean;
  nom?: string | null;
  telephone?: string | null;
  indicatif?: string | null;
  projetCode?: string | null;
  trancheCode?: string | null;
  etape?: string | null;
  echeance?: string | null;
  joursDeRetard: number;
  message?: string | null;
  /** Résultat du dernier contact : l'intention (visite, rappel…). */
  resultat?: string | null;
}

export interface BlocLeadsDto {
  /** Au-delà des 20 lignes servies. */
  total: number;
  lignes: LeadJourneeDto[];
}

export interface BlocRelancesDto {
  total: number;
  lignes: RelanceJourneeDto[];
}

export interface JourneeDto {
  date: string;
  /** `null` : le compte n'a pas d'employé, donc aucune ligne. */
  commercialId?: UUID | null;
  prenom?: string | null;
  nouveauxLeads: BlocLeadsDto;
  relancesDuJour: BlocRelancesDto;
  visitesDuJour: BlocRelancesDto;
  /** Même règle que le tableau de bord RETARD (prospections du mois civil). */
  enRetard: BlocRelancesDto;
}

export type NatureDoublon = 'PROSPECT' | 'PROSPECTION';

export interface DoublonTriDto {
  nature: NatureDoublon;
  id: UUID;
  code?: string | null;
  nom?: string | null;
  criteres: CritereDoublon[];
  /** Toujours `null` pour une fiche prospect. */
  fermee?: boolean | null;
}

export interface LigneTriDto {
  prospectionId: UUID;
  code?: string | null;
  nom?: string | null;
  /** Requis pour qualifier ; sinon « Créer le prospect » d'abord. */
  prospectId?: UUID | null;
  telephone?: string | null;
  indicatif?: string | null;
  email?: string | null;
  recuLe?: string | null;
  ageJours: number;
  message?: string | null;
  source?: string | null;
  sourceSupport?: string | null;
  campagne?: string | null;
  trancheId?: UUID | null;
  trancheCode?: string | null;
  projetCode?: string | null;
  etape?: string | null;
  /** Après « Pas joignable » : demain 10:00. */
  prochaineRelance?: string | null;
  doublons: DoublonTriDto[];
}

export interface ProchaineActionRequest {
  typeId: UUID;
  /** Obligatoire sauf pour une Note (400). */
  sousCategorieId?: UUID;
  /** Aujourd'hui ou plus tard (400 sinon). */
  date: string;
  message?: string;
}

/** 409 : prospection archivée, pré-prospection, ou étape exigeant un projet sur une ligne sans tranche. */
export interface AvancerProspectionRequest {
  etapeId: UUID;
  prochaineAction: ProchaineActionRequest;
}

// Cloche (/api/notifications, FEATURE-repartition-notifications.md §3.3) : compte appelant seulement.

export type TypeNotification = 'LEADS_ATTRIBUES' | 'LEADS_A_DISTRIBUER' | 'RESUME_DEMI_JOURNEE';

export interface NotificationDto {
  id: UUID;
  type: TypeNotification;
  titre: string;
  message: string;
  /** Route du front à ouvrir au clic. */
  lien?: string | null;
  creeLe: string;
  /** null = non lue. */
  lueLe?: string | null;
}

export interface NotificationsDto {
  notifications: NotificationDto[];
  page: number;
  taille: number;
  total: number;
  nonLues: number;
}

export interface NonLuesDto {
  nonLues: number;
}

/** `data` d'un évènement SSE `notification` du flux `/api/notifications/flux`. */
export interface EvenementNotificationDto {
  admUserId: UUID;
  notification: NotificationDto;
  nonLues: number;
}
