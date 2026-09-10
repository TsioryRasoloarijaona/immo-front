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
};
