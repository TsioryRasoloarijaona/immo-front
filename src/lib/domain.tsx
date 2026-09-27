import type { ReactNode } from 'react';
import { IconMessage, IconNote, IconPhoneIn, IconPhoneOut } from '../components/icons';
import { debutMoisISO, finMoisISO, isPastOrToday } from './format';
import type {
  BadgeTone,
  EvenementCalendrierDto,
  FiltresAvancesProspection,
  ProspectionDetailDto,
  ProspectionListItemDto,
} from '../types';

// Best-effort ordered pipeline read off the real étape labels migrated from
// the legacy Omran export (see CLAUDE.md) — the API only ever gives us a
// free-text `etape` string (ProspectionListItemDto/DetailDto), no explicit
// ordered enum, so this is a display convention, not a contract.
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

/** Une relance dont l'échéance est passée, sur un lead encore ouvert : ce que
 * le fond rouge des listes signale.
 *
 * **Même critère que le badge de la colonne Alerte** — échéance `<= aujourd'hui`
 * — pour que les deux signaux s'allument ensemble. Une ligne qui porterait un
 * badge d'alerte sans fond rouge se lirait comme une contradiction.
 *
 * ### Un seuil a été essayé, puis retiré
 *
 * Sans seuil, **336 prospections sur 500 sont en retard** (67 %), soit 17
 * lignes sur 20 en page 1 : un repère qui s'allume sur deux tiers des lignes
 * paraît ne plus rien repérer. Un seuil de 30 jours a donc été livré, ramenant
 * la part à 267 sur 500 (53 %).
 *
 * **Il a été annulé, et pour une raison mesurée, pas d'opinion** : la liste
 * sort triée par date d'alerte décroissante, si bien que le seuil ne
 * répartissait pas le rouge, il le **déplaçait vers le fond de la liste**.
 * Relevé par page : 0 ligne rouge sur les pages 1 à 4, 1 en page 5, puis 9 à
 * 14 à partir de la page 6. À l'ouverture de l'écran, plus rien n'était rouge —
 * exactement l'inverse de ce qu'un repère « au premier coup d'œil » doit faire.
 *
 * C'est aussi le comportement du logiciel de bureau, dont la colonne Alerte
 * porte une icône rouge sur presque chaque ligne. Que la majorité des relances
 * soient en retard est un fait du métier, pas un défaut d'affichage : le
 * repère le constate, et c'est aux filtres de la page de trier.
 *
 * **Ne pas réintroduire de seuil sans remesurer la répartition par page.**
 *
 * ### Ce que la condition contient, et pourquoi
 *
 * `fermee` en fait partie, et ce n'est pas un détail : une prospection perdue
 * garde son alerte, mais plus personne ne la rappellera. Mesuré, 16 lignes sur
 * 500 sont échues **et** fermées. C'est la règle que le tableau de bord
 * applique déjà pour sa liste de relances.
 *
 * **Les deux champs doivent être présents dans la charge utile.** `?colonnes=`
 * est une liste close : sans `derniereAlerteDate` la fonction rend toujours
 * faux, et sans `fermee` elle traiterait les leads perdus comme à relancer.
 * D'où `toujoursDemandees` dans `DISPOSITION_PROSPECTIONS` — les deux colonnes
 * sont demandées au serveur même décochées de la grille. */
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

// StlSettlement.Status confirmed on real /api/encaissements data (see
// instructions/from_front.md, backend repo) — IN_WORK/POINTED/CANCELED.
// The legacy screen also offers Impayé(e)/Perdu(e) as filter checkboxes,
// but no real row carries either code today, so no label/tone is guessed
// for them here; unmapped codes fall back to the raw string, neutral tone.
export const ENCAISSEMENT_ETAT_LABELS: Record<string, string> = {
  IN_WORK: 'En cours',
  POINTED: 'Pointé',
  CANCELED: 'Annulé',
};

export function encaissementEtatLabel(etat: string | undefined): string {
  if (!etat) return '—';
  return ENCAISSEMENT_ETAT_LABELS[etat.toUpperCase()] ?? etat;
}

export function encaissementEtatTone(etat: string | undefined): BadgeTone {
  switch (etat?.toUpperCase()) {
    case 'POINTED': return 'success';
    case 'IN_WORK': return 'info';
    case 'CANCELED': return 'neutral';
    default: return 'neutral';
  }
}

// `ReglementDto.statut` et `EncaissementDto.etat` lisent la même colonne
// `StlSettlement.Status` — un encaissement *est* un règlement, vu depuis le
// catalogue transverse plutôt que depuis son échéance. Ces alias existent
// pour que le code de la fiche dossier se lise dans son propre vocabulaire
// sans dupliquer le mapping (ni renommer les originaux, utilisés par les
// écrans Encaissements).
export const reglementStatutLabel = encaissementEtatLabel;
export const reglementStatutTone = encaissementEtatTone;

/** Un règlement n'est modifiable (pointage/annulation) que depuis `IN_WORK` :
 * `POINTED` et `CANCELED` sont terminaux. Un statut absent (DTO legacy servi
 * sans la colonne) est traité comme non modifiable — mieux vaut masquer une
 * action possible que d'en proposer une qui finira en 409. */
export function reglementModifiable(statut: string | undefined): boolean {
  return statut?.toUpperCase() === 'IN_WORK';
}

// `PieceJointeDto.type` is free-text off the legacy `AdmAttachedFileType`
// référentiel (no stable enum/id exposed by the API) — keyword-matched
// here purely for a scannable badge color per document family, not a
// business rule. Unmatched/null types fall back to neutral.
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

// `EcheanceDto.categorie` is free-text off the legacy référentiel
// (`GET /api/referentiels/categories-echeance`) — keyword-matched here for
// a scannable badge color per line type on the "Schéma de financement"
// table, same convention as `pieceJointeTypeTone` above. Unmatched/null
// falls back to neutral.
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

// Real business signal, not decoration: a fully-paid line is "Soldée", a
// partly-paid one is "Partielle", and an unpaid line past its own
// `dateEcheance` is "En retard" (the same "make overdue reminders
// prominent" principle CLAUDE.md asks for on prospection alerts, applied
// here to the financing schedule) — everything else unpaid but not yet due
// is plain "À régler".
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

// Shared filter-bar state for ProspectionsList/PreProspectionsList — kept
// here rather than in the component file so ProspectionFilterBar.tsx only
// exports the component (react-refresh requirement).
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
}

/** L'état **par défaut** de la barre, pas un état vide : archivées exclues et
 * période posée sur le mois courant (décision utilisateur du 28/09). C'est
 * aussi ce que rend « Réinitialiser ». */
export function emptyProspectionFilters(): ProspectionFilterBarState {
  return {
    search: '',
    etape: [],
    origine: [],
    commercial: [],
    trancheId: [],
    dateDebut: debutMoisISO(),
    dateFin: finMoisISO(),
    archive: 'non',
  };
}

/** Le filtre « Archivé » traduit vers le paramètre `?ouvertes=` : le serveur
 * pose la question à l'envers. « Tous » omet le paramètre. */
export function ouvertesDepuisArchive(archive: ProspectionFilterBarState['archive']): boolean | undefined {
  return archive === 'non' ? true : archive === 'oui' ? false : undefined;
}

/** True when the user has narrowed the list away from its default state.
 *
 * Compared field-by-field against `emptyProspectionFilters()` rather than a
 * hand-written list of conditions, so a filter added to
 * `ProspectionFilterBarState` later is covered automatically instead of
 * silently falling out of the check. Note the defaults are not blank:
 * `archive` is `'non'` and the period is the current month — switching to
 * "Tous"/"Oui", or clearing the dates, counts as an active filter, which is
 * what makes an empty result explainable.
 *
 * Used by Prospections/Pré-prospections to decide whether an empty result
 * means "your filters excluded everything" (offer a reset) or "there's
 * genuinely nothing here". */
export function hasActiveProspectionFilters(state: ProspectionFilterBarState): boolean {
  const empty = emptyProspectionFilters();
  return (Object.keys(empty) as (keyof ProspectionFilterBarState)[]).some((key) => {
    const current = state[key];
    const base = empty[key];
    return Array.isArray(current) && Array.isArray(base)
      ? current.length !== base.length
      : current !== base;
  });
}

/** État d'écran des filtres avancés.
 *
 * Distinct de `FiltresAvancesProspection`, qui est le contrat réseau : ici les
 * nombres et les dates sont des chaînes, parce qu'ils viennent d'`<input>` et
 * qu'un champ vidé doit valoir « pas de filtre » et non `NaN`. Les booléens
 * sont ternaires pour la même raison — une case à cocher ne sait pas dire
 * « indifférent », alors que `avecAlerteActive: false` veut dire « uniquement
 * celles sans relance », ce qui n'est pas la même chose que ne pas filtrer.
 *
 * `origineSupportId` n'y figure pas : il n'existe pas de référentiel plat des
 * supports, seulement une cascade sous une origine. Le champ reste dans le DTO
 * réseau, sans écran pour l'alimenter. */
export interface FiltresAvancesState {
  projetId: string[];
  societeId: string[];
  vocationId: string[];
  typeContactId: string[];
  raisonFermetureId: string[];
  paysId: string[];
  actionId: string[];
  /** Codes `StrEntity.Code`. Le seul filtre du lot avec des valeurs **connues
   * d'avance** plutôt qu'un référentiel à charger — d'où `TYPES_PROSPECTION`
   * ci-dessous et non un `use*Referentiel`. */
  typeProspection: string[];
  ancienClient: 'all' | 'oui' | 'non';
  avecAlerteActive: 'all' | 'oui' | 'non';
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

/** Comparaison champ par champ contre l'état vide, comme
 * `hasActiveProspectionFilters` : un filtre ajouté plus tard est couvert sans
 * qu'on pense à modifier cette fonction. */
export function countActiveFiltresAvances(state: FiltresAvancesState): number {
  const empty = emptyFiltresAvances();
  return (Object.keys(empty) as (keyof FiltresAvancesState)[]).filter((key) => {
    const current = state[key];
    const base = empty[key];
    return Array.isArray(current) && Array.isArray(base) ? current.length !== base.length : current !== base;
  }).length;
}

/** Conversion vers le contrat réseau. Un champ inactif est **omis**, jamais
 * envoyé à vide : le backend distingue « absent » de `false`. */
export function toFiltresAvances(state: FiltresAvancesState): FiltresAvancesProspection | undefined {
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

/** Types de document légataire (`StrEntity.Code`) proposés par le filtre.
 *
 * En dur, et non chargés d'un référentiel : la spec énumère les valeurs
 * connues, il n'existe pas d'endpoint qui les serve, et un code inconnu **ne
 * lève pas d'erreur** — il ne correspond à rien et le résultat est vide, ce
 * qui se confond avec « aucun résultat ». Une liste fermée évite donc de
 * fabriquer ce faux négatif à la saisie.
 *
 * Les trois premiers sont ceux réellement observés sur cet écran ; les deux
 * derniers existent dans la base mais relèvent d'autres modules (promotion,
 * gestion locative) et ne devraient jamais rien ramener ici — ils restent
 * proposés parce que les trouver vides *est* l'information utile. */
export const TYPES_PROSPECTION: { label: string; value: string }[] = [
  { label: 'Prospection vente', value: 'ComProspection' },
  { label: 'Pré-prospection', value: 'ComPreProspection' },
  { label: 'Prospection location', value: 'RntProspection' },
  { label: 'Prospection promotion', value: 'PrmProspection' },
  { label: 'Prospection gestion', value: 'RomProspection' },
];

export function standingClass(standing: string): string {
  const s = (standing || '').toLowerCase();
  if (s.includes('très haut')) return 'bg-(--brand-bg) text-(--brand)';
  if (s.includes('touristique')) return 'bg-(--amber-bg) text-(--amber)';
  if (s.includes('haut')) return 'bg-(--info-bg) text-(--info)';
  if (s.includes('social')) return 'bg-(--success-bg) text-(--success)';
  return 'bg-(--neutral-bg) text-foreground';
}

/** Display name for a prospection row/detail — prefers the linked prospect's
 * name, falls back to the free-text lead description captured before a
 * Prospect record exists (pré-prospection), then the code. */
export function prospectionDisplayName(
  p: Pick<ProspectionListItemDto | ProspectionDetailDto, 'prospectNom' | 'code'> & { tempDescription?: string },
): string {
  return p.prospectNom?.trim() || p.tempDescription?.trim() || p.code?.trim() || 'Sans nom';
}

/** Full name from a Prospect/Client DTO's prenom+nom (or raisonSociale for a
 * company record). */
export function personDisplayName(p: { prenom?: string; nom?: string; raisonSociale?: string }): string {
  const full = `${p.prenom ?? ''} ${p.nom ?? ''}`.trim();
  return full || p.raisonSociale?.trim() || 'Sans nom';
}

// InteractionDto only carries `entrante` (incoming/outgoing) — no
// actionType/channel field like the legacy export had — so the icon can only
// reflect direction, not medium (call vs visit vs note).
export function interactionIcon(entrante: boolean | undefined): ReactNode {
  const Icon = entrante ? IconPhoneIn : IconPhoneOut;
  return <Icon />;
}

// EvenementCalendrierDto.resultatCode carries the same text as the
// resultats-interaction référentiel's `code` (a real, stable value, not a
// display-only label) — comparing against it distinguishes a visite from a
// simple rendez-vous without inventing a business enum on the front. Only
// "Le prospect veut faire une visite du projet" behaves as a visite today;
// match loosely on "visite" so a future référentiel entry phrased
// differently (e.g. "Visite du projet demandée") keeps working.
export function isVisiteEvenement(ev: Pick<EvenementCalendrierDto, 'resultatCode'>): boolean {
  return (ev.resultatCode ?? '').toLowerCase().includes('visite');
}

export function noteIcon(): ReactNode {
  return <IconNote />;
}

export function genericIcon(): ReactNode {
  return <IconMessage />;
}
