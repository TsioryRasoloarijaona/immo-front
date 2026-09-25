import type { DispositionColonnes } from './colonnes';

/* Mise en page des listes pilotées par un catalogue serveur : l'ordre des
   colonnes et leurs largeurs relatives.
 *
 * Une disposition par écran, et non une table globale, parce que les trois
 * catalogues partagent des noms avec des intentions différentes — `code` tient
 * en 9 sur une prospection, en 11 sur un dossier et en 12 sur un prospect ;
 * `email` en 12 contre 18. Les avoir côte à côte ici rend ces écarts visibles,
 * ce qu'une table unique masquait en les écrasant.
 *
 * Un fichier `.ts` sans composant, et non le fichier de l'adaptateur : une
 * constante exportée à côté d'un composant casse le rafraîchissement rapide
 * (`react-refresh/only-export-components`).
 *
 * Le serveur ne porte aucune de ces informations et n'a pas à les porter :
 * c'est de la mise en page. */

// ===========================================================================
// Prospections et pré-prospections
// ===========================================================================

/** Ordre d'affichage des colonnes connues, et **rien d'autre** : ni la liste
 * des colonnes, ni lesquelles sont par défaut, qui viennent maintenant du
 * serveur. Les colonnes hors de cette liste s'affichent après, dans l'ordre
 * du catalogue — une colonne ajoutée côté serveur apparaît donc sans qu'on
 * touche à ce tableau, simplement en fin de liste.
 *
 * Les huit premières reproduisent l'ordre historique de la liste, pour que le
 * passage à la sélection serveur ne déplace rien à l'écran. `prix` n'y est
 * plus par défaut — mesuré mort, 4 lignes sur 14 114 — mais garde son rang au
 * cas où on le coche. */
const ORDRE_PROSPECTIONS = [
  // Identité du lead et de son prospect
  'code',
  'prospectCode',
  'prospectNom',
  'typeProspect',
  'ancienClient',
  // Type de document légataire. Juste après `typeProspect` parce que les deux
  // se confondent au premier coup d'œil et qu'il vaut mieux les voir côte à
  // côte que séparés par dix colonnes. `typeProspectionId` n'est pas listé :
  // c'est un UUID, il n'a rien à faire dans une colonne.
  'typeProspectionCode',
  'typeProspection',
  // Suivi commercial
  'etape',
  'origine',
  'origineSupport',
  'actionCommerciale',
  'commercialNom',
  'commercialCode',
  // Rattachements
  'societeCode',
  'societeLibelle',
  'trancheCode',
  'trancheDescription',
  'projetCode',
  'projetLibelle',
  // Financier — mesuré mort, hors défauts, mais gardé à son rang historique
  'prix',
  'surface',
  'dateDocument',
  // Contact. `telephone`/`email` appliquent un repli ; les variantes « fiche »
  // sont les valeurs brutes, utiles pour éditer ou dédoublonner.
  'telephone',
  'indicatifMobile',
  'mobileProspect',
  'email',
  'emailFiche',
  'pays',
  'cin',
  // Relance et clôture
  'derniereAlerteDate',
  'dateFermeture',
  'raisonFermeture',
  // Activité, servie par la vue légataire
  'joursInactivite',
  'nbInteractions',
  'derniereActionDate',
  'derniereCommunicationDate',
  'derniereCommunicationResultat',
  'nbVisites',
  'derniereVisiteDate',
  // Conversion
  'dossierCode',
  'statutDossier',
  // Traçabilité, en dernier : utile ponctuellement, jamais au quotidien
  'creeLe',
  'creePar',
  'modifieLe',
  'modifiePar',
];

/** Largeurs relatives, normalisées à l'affichage. Le serveur ne porte pas
 * cette information et n'a pas à la porter : c'est de la mise en page. Les
 * valeurs reprennent les pourcentages en dur d'avant le sélecteur. */
const POIDS_PROSPECTIONS: Record<string, number> = {
  code: 9,
  prospectCode: 9,
  prospectNom: 17,
  typeProspect: 10,
  // `ComPreProspection` est le plus long code servi — 12 suffit sans tronquer.
  typeProspectionCode: 12,
  typeProspection: 11,
  ancienClient: 8,
  etape: 10,
  origine: 10,
  origineSupport: 11,
  actionCommerciale: 12,
  commercialNom: 11,
  commercialCode: 9,
  societeCode: 9,
  societeLibelle: 12,
  trancheCode: 9,
  trancheDescription: 12,
  projetCode: 9,
  projetLibelle: 12,
  prix: 11,
  surface: 9,
  dateDocument: 9,
  telephone: 10,
  indicatifMobile: 7,
  mobileProspect: 10,
  email: 12,
  emailFiche: 12,
  pays: 9,
  cin: 9,
  derniereAlerteDate: 10,
  dateFermeture: 9,
  raisonFermeture: 12,
  creeLe: 9,
  creePar: 10,
  modifieLe: 9,
  modifiePar: 10,
  joursInactivite: 9,
  nbInteractions: 8,
  derniereActionDate: 10,
  derniereCommunicationDate: 11,
  derniereCommunicationResultat: 12,
  nbVisites: 8,
  derniereVisiteDate: 10,
  dossierCode: 10,
  statutDossier: 11,
};

/** Partagée par les deux listes de prospection : elles lisent le même
 * `ProspectionListItemDto` et veulent les mêmes largeurs. Ce qui les sépare —
 * les pré-prospections écartent les groupes ACTIVITE et CONVERSION — est un
 * filtre de catalogue posé par l'écran, pas une disposition distincte.
 *
 * Ni `masquees` ni `dependances` : le catalogue des prospections ne sert aucune
 * clé de jointure, et aucune de ses colonnes n'en appelle une autre. */
export const DISPOSITION_PROSPECTIONS: DispositionColonnes = {
  ordre: ORDRE_PROSPECTIONS,
  poids: POIDS_PROSPECTIONS,
  /* Le fond rouge des relances en retard se calcule sur ces deux champs sans
     les afficher. Les laisser dépendre de la sélection ferait disparaître le
     repère dès qu'on décoche la colonne Alerte — et pire, décocher `fermee`
     seule ferait passer les leads perdus pour des relances à faire. */
  toujoursDemandees: ['derniereAlerteDate', 'fermee'],
};

// ===========================================================================
// Dossiers de vente
// ===========================================================================

/** Les neuf premières reproduisent l'ordre de lecture d'avant le sélecteur,
 * pour que le passage au catalogue ne déplace rien à l'écran — à une colonne
 * près : `dateConcretisation` est `parDefaut` côté serveur et n'était affichée
 * nulle part, la vue par défaut passe donc de 8 à 9 colonnes.
 *
 * Le reste suit l'ordre du catalogue, groupe par groupe. */
const ORDRE_DOSSIERS = [
  // Les colonnes historiques, dans leur ordre historique
  'clientNom',
  'code',
  'prospectionCode',
  'statut',
  'commercialNom',
  'prix',
  'totalAPayer',
  'dateDocument',
  'dateConcretisation',
  // Financier
  'prixAvantRemise',
  'remise',
  'remiseMontant',
  'prixApresRemise',
  'montantAvance',
  'probabiliteFinalisation',
  'modePaie',
  // Origine — déréférence la prospection
  'etapeProspection',
  'origineProspection',
  'dateProspection',
  // Délais, à côté des dates auxquelles ils se rapportent. Entiers en jours,
  // le libellé serveur porte déjà l'unité — aucun rendu propre à écrire.
  'delaiConcretisation',
  'delaiNotaire',
  'delaiLivraison',
  'dateCompromis',
  'dateLivraisonReelle',
  // Article — le lot lui-même, avant la chaîne patrimoniale qui le surplombe.
  // Renseignées sur 116/116 dossiers, sauf `articleTitreFoncier` (33/116).
  'articleCode',
  'articleLibelle',
  'typeArticle',
  'categorieArticle',
  'bloc',
  'etage',
  'typePresentation',
  'articleTitreFoncier',
  // Patrimoine — article → tranche → projet → société
  'projetCode',
  'projetLibelle',
  'trancheCode',
  'trancheLibelle',
  'societeCode',
  'societeLibelle',
  'vocationCode',
  'vocationLibelle',
  // Acteurs
  'avocatNom',
  'responsableVenteNom',
  // Traçabilité, en dernier : utile ponctuellement, jamais au quotidien
  'creePar',
  'creeLe',
  'modifiePar',
  'modifieLe',
];

const POIDS_DOSSIERS: Record<string, number> = {
  clientNom: 17,
  code: 11,
  prospectionCode: 11,
  statut: 13,
  commercialNom: 13,
  prix: 10,
  totalAPayer: 11,
  dateDocument: 9,
  dateConcretisation: 9,
  prixAvantRemise: 11,
  remise: 8,
  remiseMontant: 10,
  prixApresRemise: 11,
  montantAvance: 10,
  probabiliteFinalisation: 9,
  modePaie: 11,
  etapeProspection: 12,
  origineProspection: 11,
  dateProspection: 10,
  // Délais : trois chiffres au plus (mesuré, max 443 jours), mais l'en-tête
  // « Délai de concrétisation (j) » est long — c'est lui qui fixe la largeur.
  delaiConcretisation: 12,
  delaiNotaire: 10,
  delaiLivraison: 11,
  dateCompromis: 9,
  dateLivraisonReelle: 10,
  // Article : des codes et des libellés courts (« ARS0501 », « 501 », « T3 »,
  // « APP »), sauf `bloc` et `etage` qui portent des phrases
  // (« Rez de chaussé », « Immeuble 05 »).
  articleCode: 10,
  articleLibelle: 9,
  typeArticle: 7,
  categorieArticle: 9,
  bloc: 11,
  etage: 11,
  typePresentation: 11,
  articleTitreFoncier: 10,
  responsableVenteNom: 13,
  // Les libellés sont des raisons sociales et des noms de projet : ils
  // tronquent à 9, où le code tient tout entier.
  projetCode: 9,
  projetLibelle: 13,
  trancheCode: 9,
  trancheLibelle: 13,
  societeCode: 9,
  societeLibelle: 13,
  vocationCode: 9,
  vocationLibelle: 12,
  avocatNom: 12,
  creePar: 10,
  creeLe: 9,
  modifiePar: 10,
  modifieLe: 9,
};

export const DISPOSITION_DOSSIERS: DispositionColonnes = {
  ordre: ORDRE_DOSSIERS,
  poids: POIDS_DOSSIERS,
  /* Le `parDefaut` du serveur décrit la charge utile : quatre de ses treize
     colonnes sont des clés de jointure (`id`, `clientId`, `commercialId`,
     `prospectionId`). Sans ce filtre, la vue par défaut affiche des UUID. Les
     autres `*Id` ne sont pas `parDefaut` mais seraient proposées au
     sélecteur, ce qui revient au même une fois cochées.

     `articleId` et `responsableVenteId` sont arrivés avec la livraison qui
     ajoute les groupes ARTICLE et DELAIS ; ils tombent sous la même règle. */
  masquees: new Set([
    'id',
    'clientId',
    'commercialId',
    'prospectionId',
    'projetId',
    'trancheId',
    'societeId',
    'avocatId',
    'articleId',
    'responsableVenteId',
  ]),
  /* La colonne « Prospection » est un lien vers `/prospections/{id}`, et cet id
     vient d'être masqué. `?colonnes=` étant une liste close, il faut le
     redemander dès que la sélection s'écarte des défauts.

     Mesuré contre le serveur : demander `prospectionCode` sans
     `prospectionId` renvoie bien la colonne sans son id. Le rendu teste cet id
     et retombe sur un tiret — le lien disparaît donc en silence, ce qui est
     pire qu'une erreur puisque rien ne le signale. */
  dependances: { prospectionCode: ['prospectionId'] },
};

// ===========================================================================
// Prospects
// ===========================================================================

/** Les neuf premières sont les colonnes `parDefaut` du serveur, une fois `id`
 * masqué. La liste en affichait six : le serveur décompose ce que l'écran
 * composait — « Nom » était prénom+nom+raison sociale, « Téléphone » un repli
 * du mobile sur le fixe. Le catalogue nomme les champs bruts, l'écran les suit,
 * et les compositions disparaissent. */
const ORDRE_PROSPECTS = [
  'code',
  'prenom',
  'nom',
  'raisonSociale',
  'type',
  'telephone',
  'mobile',
  'email',
  'ville',
  // Identité, suite
  'cin',
  'ice',
  'dateNaissance',
  'lieuNaissance',
  'nombreEnfants',
  'estAncienClient',
  'filsDe',
  'etDe',
  'titre',
  'sexe',
  'nationalite',
  'situationFamiliale',
  'regimeMatrimonial',
  // Mesurée quasi morte — 14 339 tiers sur 14 516 n'en portent aucun — mais
  // proposée : c'est au serveur d'arbitrer ce qu'il sert.
  'kind',
  'commercialNom',
  // Contact, suite
  'indicatifTelephone',
  'telephone1',
  'telephone2',
  'indicatifMobile',
  'fax',
  'siteWeb',
  // Adresse
  'adresse',
  'adresse2',
  'adresse3',
  'codePostal',
  'pays',
  'paysResidence',
  'typeResidence',
  // Profession — `profession` est mesurée à 0 ligne sur 13 664 et sera
  // toujours vide ; la spec dit de ne pas la proposer comme critère.
  'employeur',
  'anciennete',
  'profession',
  'salaire',
  // Traçabilité
  'creePar',
  'creeLe',
  'modifiePar',
  'modifieLe',
];

const POIDS_PROSPECTS: Record<string, number> = {
  code: 12,
  prenom: 12,
  nom: 14,
  raisonSociale: 16,
  type: 9,
  telephone: 12,
  mobile: 12,
  email: 18,
  ville: 11,
  cin: 11,
  ice: 11,
  dateNaissance: 11,
  lieuNaissance: 12,
  nombreEnfants: 8,
  estAncienClient: 9,
  filsDe: 12,
  etDe: 12,
  titre: 8,
  sexe: 8,
  nationalite: 11,
  situationFamiliale: 13,
  regimeMatrimonial: 13,
  kind: 9,
  commercialNom: 13,
  indicatifTelephone: 8,
  telephone1: 12,
  telephone2: 12,
  indicatifMobile: 8,
  fax: 11,
  siteWeb: 14,
  adresse: 18,
  adresse2: 14,
  adresse3: 14,
  codePostal: 9,
  pays: 10,
  paysResidence: 12,
  typeResidence: 12,
  employeur: 14,
  anciennete: 9,
  profession: 12,
  salaire: 10,
  creePar: 10,
  creeLe: 9,
  modifiePar: 10,
  modifieLe: 9,
};

export const DISPOSITION_PROSPECTS: DispositionColonnes = {
  ordre: ORDRE_PROSPECTS,
  poids: POIDS_PROSPECTS,
  /* `id` est `parDefaut` et toujours servi ; `commercialId` double
     `commercialNom`. Aucune des deux n'a sa place dans une grille. */
  masquees: new Set(['id', 'commercialId']),
  // Aucune colonne n'en appelle une autre : la ligne n'ouvre que sa propre
  // fiche, et `id` est servi quoi qu'il arrive.
};

/* ---------------------------------------------------------------------------
   Encaissements
   --------------------------------------------------------------------------- */

const ORDRE_ENCAISSEMENTS = [
  // Les dix colonnes que l'ecran declarait en dur avant la conversion, dans
  // leur ordre d'alors : la vue s'elargit, elle ne se reorganise pas.
  'etat',
  'dateDocument',
  'dateReglement',
  'tierNom',
  'dossierCode',
  'typeLibelle',
  'montantBrut',
  'montantBrutRestant',
  'reference',
  'comptabilise',
  // Le reste du groupe IDENTITE / FINANCIER, servi par defaut mais qui n'etait
  // pas affiche jusqu'ici.
  'dateEcheance',
  'montantNet',
  'description',
  'typeCode',
  'entiteCode',
  'entiteLibelle',
  // Acteurs
  'banqueNom',
  'tierPayeurNom',
  // Suivi. `compteCode` et `depotCode` sont servis par defaut mais mesures a
  // 12 et 0 lignes sur 643 : ils restent tout en bas du bloc, pas en tete.
  'notes',
  'remisAuCentre',
  'recuCode',
  'dateRemiseAuCentre',
  'bordereauCode',
  'dateBordereau',
  'compteCode',
  'depotCode',
  // Tracabilite, en dernier : utile ponctuellement, jamais au quotidien.
  'creePar',
  'creeLe',
  'modifiePar',
  'modifieLe',
];

const POIDS_ENCAISSEMENTS: Record<string, number> = {
  // Les dix premieres reprennent telles quelles les `largeur` que l'ecran
  // portait avant la conversion : elles etaient reglees, il n'y a pas de
  // raison de les redecouvrir.
  etat: 9,
  dateDocument: 9,
  dateReglement: 9,
  tierNom: 16,
  dossierCode: 11,
  typeLibelle: 12,
  montantBrut: 11,
  montantBrutRestant: 11,
  reference: 7,
  comptabilise: 5,
  dateEcheance: 9,
  montantNet: 11,
  // 327 valeurs distinctes sur 332 lignes, et des phrases entieres
  // (« CHEQUE BMCE BANK N° ... du 01/09/2026 ») : c'est la colonne qui a le
  // plus besoin de largeur du catalogue.
  description: 24,
  typeCode: 8,
  entiteCode: 8,
  entiteLibelle: 14,
  banqueNom: 14,
  tierPayeurNom: 16,
  notes: 18,
  remisAuCentre: 7,
  recuCode: 8,
  dateRemiseAuCentre: 10,
  bordereauCode: 9,
  dateBordereau: 9,
  compteCode: 9,
  depotCode: 9,
  creePar: 12,
  creeLe: 10,
  modifiePar: 12,
  modifieLe: 10,
};

export const DISPOSITION_ENCAISSEMENTS: DispositionColonnes = {
  ordre: ORDRE_ENCAISSEMENTS,
  poids: POIDS_ENCAISSEMENTS,
  /* Le `masquees` le plus fourni des quatre dispositions, et pour une raison
     mesuree : **sept des vingt-sept colonnes `parDefaut` sont des cles UUID**
     (`dossierId`, `tierId`, `typeId`, `entiteId`, `compteId`, `depotId`,
     `banqueId`). Sans ce filtre, la vue par defaut de l'ecran afficherait sept
     colonnes d'identifiants.

     C'est le meme ecart qu'ailleurs, a plus grande echelle : le `parDefaut` du
     serveur decrit la charge utile, pas la grille. `tierPayeurId` n'est pas
     `parDefaut` mais serait proposee au selecteur, ce qui revient au meme une
     fois cochee. */
  masquees: new Set([
    'id',
    'dossierId',
    'tierId',
    'typeId',
    'entiteId',
    'compteId',
    'depotId',
    'banqueId',
    'tierPayeurId',
  ]),
  /* Aucune dependance : la ligne n'ouvre que sa propre fiche, et `dossierCode`
     s'affiche en texte sans lien — `dossierId` existe mais un reglement peut
     porter sur plusieurs dossiers (654 couples pour 643 reglements), donc le
     code affiche ne designe pas toujours une cible unique. */
};

// ---------------------------------------------------------------------------
// Suivi des actions (FEATURE-suivi-actions.md §4)
// ---------------------------------------------------------------------------

/* L'ordre de la doc OMRAN « Suivi des actions », groupe par groupe : l'action
   elle-meme, ses acteurs, son rattachement. Les identifiants et l'audit ferment
   la marche — hors defaut cote serveur, proposes par le selecteur. */
const ORDRE_SUIVI_ACTIONS = [
  'utilisateur',
  'typeAction',
  'rang',
  'dateAction',
  'dateAlerte',
  'alerteActive',
  'categorie',
  'resultat',
  'message',
  'entrante',
  'systeme',
  'impaye',
  'commercial',
  'personnel',
  'tiersNom',
  'prospectionCode',
  'dossierCode',
  'etat',
  'articleCode',
  'articleLibelle',
  'trancheCode',
  'trancheLibelle',
  'programme',
  'entite',
  'creePar',
  'creeLe',
  'modifiePar',
  'modifieLe',
];

const POIDS_SUIVI_ACTIONS: Record<string, number> = {
  utilisateur: 12,
  typeAction: 11,
  rang: 4,
  dateAction: 11,
  dateAlerte: 11,
  alerteActive: 6,
  categorie: 10,
  resultat: 12,
  // La note saisie, `nvarchar(max)` : la colonne qui a le plus besoin de
  // largeur, et celle que `truncate` coupe le plus souvent.
  message: 24,
  entrante: 6,
  systeme: 6,
  impaye: 6,
  commercial: 12,
  personnel: 12,
  tiersNom: 16,
  prospectionCode: 8,
  dossierCode: 8,
  etat: 10,
  articleCode: 8,
  articleLibelle: 14,
  trancheCode: 7,
  trancheLibelle: 14,
  programme: 12,
  entite: 10,
  creePar: 12,
  creeLe: 10,
  modifiePar: 12,
  modifieLe: 10,
};

/** Les cles que la ligne ouvre : une action se lit depuis sa prospection, a
 * defaut depuis son dossier ; `tiersId` sert au detail (`ActionDetailDialog`)
 * a charger la fiche de la personne — telephone, email, et le critere du
 * bouton « Voir hotline » — car `SuiviActionDto` ne porte pas ses
 * coordonnees. Demandees toujours, jamais affichees — voir
 * `SuiviActionsList`. */
export const CLES_OUVERTURE_SUIVI_ACTION = ['prospectionId', 'dossierId', 'tiersId'];

export const DISPOSITION_SUIVI_ACTIONS: DispositionColonnes = {
  ordre: ORDRE_SUIVI_ACTIONS,
  poids: POIDS_SUIVI_ACTIONS,
  /* Tout le groupe IDENTIFIANTS du catalogue : des cles de jointure que le
     selecteur n'a pas a proposer. `prospectionId`, `dossierId` et `tiersId`
     sont neanmoins demandees a chaque appel (`CLES_OUVERTURE_SUIVI_ACTION`) :
     c'est par elles que le clic sur une ligne ouvre la fiche et que le detail
     retrouve la personne. */
  masquees: new Set(['id', 'typeId', 'categorieId', 'tiersId', 'prospectionId', 'dossierId', 'trancheId']),
};
