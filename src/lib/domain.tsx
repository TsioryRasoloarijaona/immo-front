import type { ReactNode } from 'react';
import { IconPhoneIn, IconPhoneOut } from '../components/icons';
import { debutMoisISO, finMoisISO, isPastOrToday } from './format';
import type {
  BadgeTone,
  DateRenseignee,
  EvenementCalendrierDto,
  FiltresAvancesProspection,
  PeriodeSur,
  ProspectionDetailDto,
  ProspectionListItemDto,
} from '../types';

// L'API ne sert qu'un libellé `etape` libre, sans ordre : cet ordre est une convention d'affichage, pas un contrat.
export const PIPELINE_STAGES = [
  '1 A TRAITER',
  '2 EN COURS DE TRAITEMENT',
  '3 QUALIFIÉ',
  '4 APRES VISITES',
  '5 AVANT CONCRETISATION',
] as const;

export const PIPELINE_STAGE_SHORT: Record<string, string> = {
  '1 A TRAITER': 'À traiter',
  '2 EN COURS DE TRAITEMENT': 'En cours',
  '3 QUALIFIÉ': 'Qualifié',
  '4 APRES VISITES': 'Après visites',
  '5 AVANT CONCRETISATION': 'Avant concrétisation',
};

/** Même critère (`<=` aujourd'hui) que le badge Alerte. Pas de seuil en jours : la liste étant triée par alerte
 * décroissante, il repousserait tout le rouge en fin de liste. `derniereAlerteDate` et `fermee` doivent figurer
 * dans `?colonnes=` (liste close), sinon faux résultat : d'où `toujoursDemandees` dans `DISPOSITION_PROSPECTIONS`. */
export function relanceEnRetard(p: {
  derniereAlerteDate?: string | null;
  fermee?: boolean;
}): boolean {
  return !p.fermee && isPastOrToday(p.derniereAlerteDate);
}

export function isSideTrackEtape(etape: string | undefined): boolean {
  const e = (etape ?? '').trim();
  return e === 'A RAPPELER PAR LE COMMERCIAL' || e === 'AFFAIRES A SUIVRE' || e === 'AFFAIRES  A SUIVRE';
}

export function pipelineStageIndex(etape: string | undefined): number {
  return PIPELINE_STAGES.indexOf((etape ?? '') as (typeof PIPELINE_STAGES)[number]);
}

export function etapeBadgeTone(etape: string | undefined, fermee?: boolean): BadgeTone {
  if (fermee) return 'warning';
  if (isSideTrackEtape(etape)) return 'amber';
  const idx = pipelineStageIndex(etape);
  if (idx <= 0) return 'neutral';
  if (idx < PIPELINE_STAGES.length - 1) return 'progress';
  return 'success';
}

// Impayé/Perdu existent comme filtres legacy mais aucune ligne réelle ne les porte : pas de libellé inventé,
// un code inconnu s'affiche brut, ton neutre. Sert aussi `ReglementDto.statut` : même colonne
// `StlSettlement.Status`, donc un seul mapping.
export const ENCAISSEMENT_ETAT_LABELS: Record<string, string> = {
  IN_WORK: 'En cours',
  POINTED: 'Pointé',
  CANCELED: 'Annulé',
};

/** Seul CANCELED sort des totaux de montants (règle du back, `StatutReglement.compteDansLesTotaux`). */
export function encaissementCompteDansLesTotaux(etat: string | undefined): boolean {
  return etat?.trim().toUpperCase() !== 'CANCELED';
}

export function encaissementEtatLabel(etat: string | undefined): string {
  if (!etat) return '—';
  return ENCAISSEMENT_ETAT_LABELS[etat.toUpperCase()] ?? etat;
}

export function encaissementEtatTone(etat: string | undefined): BadgeTone {
  switch (etat?.toUpperCase()) {
    case 'POINTED': return 'success';
    case 'IN_WORK': return 'info';
    // `warning` et non `neutral` : seul un ton non neutre porte un glyphe (TONE_GLYPH).
    case 'CANCELED': return 'warning';
    default: return 'neutral';
  }
}

/** Statut absent (DTO servi sans la colonne) = non modifiable : mieux vaut masquer une action possible que d'en
 * proposer une qui finira en 409. */
export function reglementModifiable(statut: string | undefined): boolean {
  return statut?.toUpperCase() === 'IN_WORK';
}

// Type libre du référentiel legacy, sans id stable exposé : couleur par mot-clé, pas une règle métier.
export function pieceJointeTypeTone(type: string | null | undefined): BadgeTone {
  const t = (type ?? '').toUpperCase();
  if (!t) return 'neutral';
  if (t.includes('IDENTITE')) return 'info';
  if (t.includes('CONTRAT')) return 'progress';
  if (t.includes('REGLEMENT') || t.includes('CHEQUE')) return 'success';
  if (t.includes('REMISE DES CLES')) return 'amber';
  if (t.includes('OBLIGATION') || t.includes('VISITE')) return 'warning';
  return 'neutral';
}

// Catégorie libre du référentiel legacy : même convention par mot-clé que `pieceJointeTypeTone`.
export function echeanceCategorieTone(categorie: string | null | undefined): BadgeTone {
  const c = (categorie ?? '').toUpperCase();
  if (!c) return 'neutral';
  if (c.includes('AVANCE')) return 'progress';
  if (c.includes('AUTO') && c.includes('FINANCEMENT')) return 'info';
  if (c.includes('CREDIT') || c.includes('CRÉDIT')) return 'amber';
  if (c.includes('SYNDIC')) return 'neutral';
  return 'neutral';
}

export type EcheanceStatut = 'soldee' | 'partielle' | 'enretard' | 'aregler';

export const ECHEANCE_STATUT_LABELS: Record<EcheanceStatut, string> = {
  soldee: 'Soldée',
  partielle: 'Partielle',
  enretard: 'En retard',
  aregler: 'À régler',
};

export function echeanceStatutTone(statut: EcheanceStatut): BadgeTone {
  switch (statut) {
    case 'soldee': return 'success';
    case 'partielle': return 'info';
    case 'enretard': return 'warning';
    default: return 'neutral';
  }
}

export function echeanceStatut(e: {
  montant?: number | null;
  montantRegle?: number | null;
  reste?: number | null;
  dateEcheance?: string | null;
}): EcheanceStatut {
  const montant = e.montant ?? 0;
  const regle = e.montantRegle ?? 0;
  const reste = e.reste ?? montant - regle;
  if (montant > 0 && reste <= 0) return 'soldee';
  if (regle > 0 && reste > 0) return 'partielle';
  if (e.dateEcheance && new Date(e.dateEcheance) < new Date(new Date().toDateString())) return 'enretard';
  return 'aregler';
}

// Ici et non dans ProspectionFilterBar.tsx : react-refresh veut qu'un fichier de composant n'exporte que lui.
export interface ProspectionFilterBarState {
  search: string;
  etape: string[];
  origine: string[];
  commercial: string[];
  trancheId: string[];
  dateDebut: string;
  dateFin: string;
  /** « Archivé » à l'écran, `ouvertes` sur le fil — voir `ouvertesDepuisArchive`. */
  archive: 'non' | 'oui' | 'tous';
  /** Prospections seulement : date portant la période. */
  periodeSur: PeriodeSur;
  /** Prospections seulement : « Renseignée / Non renseignée » sur la date choisie (bornes alors ignorées). */
  dateRenseignee: FiltreTriple;
  /** Prospections seulement : « Aboutie » d'OMRAN. Défaut Tous. */
  aboutie: FiltreTriple;
  /** Pré-prospections seulement : « Non affectés » (seul : lignes sans tranche ; avec tranches : les ajoute). */
  sansTranche: boolean;
}

export type FiltreTriple = 'tous' | 'oui' | 'non';

/** L'état par défaut, pas un état vide : archivées exclues (sauf `archive` fourni), période = mois courant.
 * C'est aussi ce que rend « Réinitialiser ». */
export function emptyProspectionFilters(
  commercialParDefaut?: string,
  archive: ProspectionFilterBarState['archive'] = 'non',
): ProspectionFilterBarState {
  return {
    search: '',
    etape: [],
    origine: [],
    commercial: commercialParDefaut ? [commercialParDefaut] : [],
    trancheId: [],
    dateDebut: debutMoisISO(),
    dateFin: finMoisISO(),
    archive,
    periodeSur: 'DATE',
    dateRenseignee: 'tous',
    aboutie: 'tous',
    sansTranche: false,
  };
}

/** La part de la barre que le serveur lit avec les filtres avancés (prospections seulement). */
function filtresBarreProspection(state: ProspectionFilterBarState): FiltresAvancesProspection {
  const triple = (v: FiltreTriple) => (v === 'tous' ? undefined : v === 'oui');
  let dateRenseignee: DateRenseignee | undefined;
  if (state.dateRenseignee !== 'tous') dateRenseignee = state.dateRenseignee === 'oui' ? 'OUI' : 'NON';
  return {
    aboutie: triple(state.aboutie),
    periodeSur: state.periodeSur === 'DATE' ? undefined : state.periodeSur,
    dateRenseignee,
  };
}

/** Filtres avancés et part « avancée » de la barre, fusionnés ; `undefined` si rien n'est actif. */
export function filtresServeurProspection(
  avances: FiltresAvancesState,
  barre: ProspectionFilterBarState,
): FiltresAvancesProspection | undefined {
  const fusion = { ...toFiltresAvances(avances), ...filtresBarreProspection(barre) };
  // JSON.stringify omet les clés `undefined` : « {} » = aucun filtre actif.
  return JSON.stringify(fusion) === '{}' ? undefined : fusion;
}

/** Paramètres serveur de la barre communs aux deux listes ; dates seules, la fin vaut le jour entier. */
export function paramsBarre(state: ProspectionFilterBarState, search: string) {
  const liste = (v: string[]) => (v.length > 0 ? v : undefined);
  return {
    search: search || undefined,
    etape: liste(state.etape),
    origine: liste(state.origine),
    commercial: liste(state.commercial),
    trancheId: liste(state.trancheId),
    dateDebut: state.dateDebut || undefined,
    dateFin: state.dateFin || undefined,
    ouvertes: ouvertesDepuisArchive(state.archive),
  };
}

/** Le filtre « Archivé » traduit vers le paramètre `?ouvertes=` : le serveur
 * pose la question à l'envers. « Tous » omet le paramètre. */
function ouvertesDepuisArchive(archive: ProspectionFilterBarState['archive']): boolean | undefined {
  if (archive === 'non') return true;
  if (archive === 'oui') return false;
  return undefined;
}

/** Comparé aux défauts, qui ne sont pas vides (`archive: 'non'`, mois courant) : les vider est un filtre actif.
 * Listes comparées par contenu, pas par longueur : un commercial remplacé par un autre est un filtre actif. */
export function hasActiveProspectionFilters(
  state: ProspectionFilterBarState,
  defauts: ProspectionFilterBarState = emptyProspectionFilters(),
): boolean {
  return (Object.keys(defauts) as (keyof ProspectionFilterBarState)[]).some((key) => {
    const current = state[key];
    const base = defauts[key];
    return Array.isArray(current) && Array.isArray(base)
      ? [...current].sort((a, b) => a.localeCompare(b)).join('|') !== [...base].sort((a, b) => a.localeCompare(b)).join('|')
      : current !== base;
  });
}

type FiltreTernaire = 'all' | 'oui' | 'non';

/** État d'écran, distinct du contrat réseau : nombres et dates en chaînes (champ vidé = pas de filtre, pas `NaN`),
 * booléens ternaires car `avecAlerteActive: false` veut dire « uniquement sans relance », pas « indifférent ». */
export interface FiltresAvancesState {
  projetId: string[];
  societeId: string[];
  vocationId: string[];
  typeContactId: string[];
  raisonFermetureId: string[];
  paysId: string[];
  actionId: string[];
  origineSupportId: string[];
  typeProspection: string[];
  ancienClient: FiltreTernaire;
  avecAlerteActive: FiltreTernaire;
  inactiviteMin: string;
  nbInteractionsMin: string;
  nbVisitesMin: string;
  communicationDepuis: string;
  communicationJusqua: string;
}

export function emptyFiltresAvances(): FiltresAvancesState {
  return {
    projetId: [],
    societeId: [],
    vocationId: [],
    typeContactId: [],
    raisonFermetureId: [],
    paysId: [],
    actionId: [],
    origineSupportId: [],
    typeProspection: [],
    ancienClient: 'all',
    avecAlerteActive: 'all',
    inactiviteMin: '',
    nbInteractionsMin: '',
    nbVisitesMin: '',
    communicationDepuis: '',
    communicationJusqua: '',
  };
}

export function countActiveFiltresAvances(state: FiltresAvancesState): number {
  const empty = emptyFiltresAvances();
  return (Object.keys(empty) as (keyof FiltresAvancesState)[]).filter((key) => {
    const current = state[key];
    const base = empty[key];
    return Array.isArray(current) && Array.isArray(base) ? current.length !== base.length : current !== base;
  }).length;
}

/** Un champ inactif est omis, jamais envoyé à vide : le backend distingue « absent » de `false`. */
function toFiltresAvances(state: FiltresAvancesState): FiltresAvancesProspection | undefined {
  if (countActiveFiltresAvances(state) === 0) return undefined;
  const nombre = (v: string) => (v.trim() === '' ? undefined : Number(v));
  const ternaire = (v: 'all' | 'oui' | 'non') => (v === 'all' ? undefined : v === 'oui');
  const liste = (v: string[]) => (v.length > 0 ? v : undefined);
  return {
    projetId: liste(state.projetId),
    societeId: liste(state.societeId),
    vocationId: liste(state.vocationId),
    typeContactId: liste(state.typeContactId),
    raisonFermetureId: liste(state.raisonFermetureId),
    paysId: liste(state.paysId),
    actionId: liste(state.actionId),
    origineSupportId: liste(state.origineSupportId),
    typeProspection: liste(state.typeProspection),
    ancienClient: ternaire(state.ancienClient),
    avecAlerteActive: ternaire(state.avecAlerteActive),
    inactiviteMin: nombre(state.inactiviteMin),
    nbInteractionsMin: nombre(state.nbInteractionsMin),
    nbVisitesMin: nombre(state.nbVisitesMin),
    communicationDepuis: state.communicationDepuis || undefined,
    communicationJusqua: state.communicationJusqua || undefined,
  };
}

/** Codes `StrEntity.Code` en dur : aucun endpoint ne les sert, et un code inconnu rend une liste vide sans erreur.
 * Les deux derniers relèvent d'autres modules et ne ramènent rien ici : les garder, ce vide est l'information. */
export const TYPES_PROSPECTION: { label: string; value: string }[] = [
  { label: 'Prospection vente', value: 'ComProspection' },
  { label: 'Pré-prospection', value: 'ComPreProspection' },
  { label: 'Prospection location', value: 'RntProspection' },
  { label: 'Prospection promotion', value: 'PrmProspection' },
  { label: 'Prospection gestion', value: 'RomProspection' },
];

export function prospectionDisplayName(
  p: Pick<ProspectionListItemDto | ProspectionDetailDto, 'prospectNom' | 'code'> & { tempDescription?: string },
): string {
  return p.prospectNom?.trim() || p.tempDescription?.trim() || p.code?.trim() || 'Sans nom';
}

export function personDisplayName(p: { prenom?: string; nom?: string; raisonSociale?: string }): string {
  const full = `${p.prenom ?? ''} ${p.nom ?? ''}`.trim();
  return full || p.raisonSociale?.trim() || 'Sans nom';
}

// `InteractionDto` ne porte que la direction (`entrante`), pas le canal : l'icône ne distingue pas appel et visite.
export function interactionIcon(entrante: boolean | undefined): ReactNode {
  const Icon = entrante ? IconPhoneIn : IconPhoneOut;
  return <Icon />;
}

// `resultatCode` est le code stable du référentiel résultats-interaction ; « visite » cherché en sous-chaîne pour
// qu'une entrée future formulée autrement reste reconnue.
export function isVisiteEvenement(ev: Pick<EvenementCalendrierDto, 'resultatCode'>): boolean {
  return (ev.resultatCode ?? '').toLowerCase().includes('visite');
}
