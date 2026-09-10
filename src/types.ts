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
  | 'ACTIVITE'
  | 'CONVERSION'
  // Dossiers de vente
  | 'ACTEURS'
  | 'ORIGINE'
  | 'PATRIMOINE'
  // Prospects
  | 'ADRESSE'
  | 'PROFESSION'
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

  // -- Acteurs (groupe ACTEURS) ----------------------------------------------
  /** Notaire. 19,3 %. */
  avocatId?: UUID;
  avocatNom?: string;

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
  probabiliteFinalisation?: number;
  modePaie?: string;
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
