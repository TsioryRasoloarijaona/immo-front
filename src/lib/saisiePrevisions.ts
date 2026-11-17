import type { PointSaisiDto, PrevisionsSaisieLotDto, PrevisionsSaisieRequest, PropositionPointsDto } from '../types/projet';

const JOUR_MS = 86_400_000;

/** Avancement en % (saisie) ; temps et paiement en fraction 0–1 (calculés par le serveur). */
export interface PointEdite {
  cle: string;
  date: string;
  avancement: number | null;
  temps: number | null;
  paiement: number | null;
}

export interface OngletPrevisions {
  debut: string;
  duree: number | null;
  points: PointEdite[];
}

export interface EtatSaisie {
  previsions: OngletPrevisions;
  base: OngletPrevisions;
  ht: number | null;
  tva: number | null;
  ttc: number | null;
}

const arrondi = (v: number, decimales = 2) => Math.round(v * 10 ** decimales) / 10 ** decimales;
const jourMs = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Fin = début + durée (jours). */
export function finDe(debut: string, duree: number | null): string {
  return debut && duree !== null ? iso(jourMs(debut) + duree * JOUR_MS) : '';
}

/** Durée (jours) entre le début et la fin saisie. */
export function dureeDe(debut: string, fin: string): number | null {
  return debut && fin ? Math.round((jourMs(fin) - jourMs(debut)) / JOUR_MS) : null;
}

function finDuMois(date: string, decalageMois = 0): string {
  const d = new Date(jourMs(date));
  return iso(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + decalageMois + 1, 0));
}

function tempsDe(date: string, debut: string, duree: number | null): number | null {
  return duree && debut && date ? arrondi((jourMs(date) - jourMs(debut)) / JOUR_MS / duree, 6) : null;
}

let compteur = 0;
function cleSuivante(): string {
  compteur += 1;
  return `n${compteur}`;
}

function pointsDepuisDto(points: PointSaisiDto[]): PointEdite[] {
  return points.map((p) => ({ cle: p.id, date: p.date.slice(0, 10), avancement: arrondi(p.avancement * 100, 6), temps: p.temps, paiement: p.paiement }));
}

export function etatDepuisDto(d: PrevisionsSaisieLotDto): EtatSaisie {
  return {
    previsions: { debut: d.debut?.slice(0, 10) ?? '', duree: d.duree, points: pointsDepuisDto(d.points) },
    base: { debut: d.debutBase?.slice(0, 10) ?? '', duree: d.dureeBase, points: pointsDepuisDto(d.pointsBase) },
    ht: d.estimationBaseHT,
    tva: d.estimationBaseTVA,
    ttc: d.estimationBaseTTC,
  };
}

/** HT saisi : TVA = HT × taux / 100, TTC = HT + TVA. */
export function avecHT(etat: EtatSaisie, ht: number | null, taux: number): EtatSaisie {
  if (ht === null) return { ...etat, ht, tva: null, ttc: null };
  const tva = arrondi((ht * taux) / 100);
  return { ...etat, ht, tva, ttc: arrondi(ht + tva) };
}

/** TTC saisi : HT = TTC / (1 + taux). */
export function avecTTC(etat: EtatSaisie, ttc: number | null, taux: number): EtatSaisie {
  if (ttc === null) return { ...etat, ttc, ht: null, tva: null };
  const ht = arrondi(ttc / (1 + taux / 100));
  return { ...etat, ttc, ht, tva: arrondi(ttc - ht) };
}

/** Date du nouveau point : fin du mois suivant le dernier point, sinon fin du mois du début. */
export function ajouterPoint(onglet: OngletPrevisions): { onglet: OngletPrevisions; cle: string } {
  const dernier = onglet.points.reduce<string>((max, p) => (p.date > max ? p.date : max), '');
  const date = dernier ? finDuMois(dernier, 1) : finDuMois(onglet.debut || iso(Date.now()));
  const cle = cleSuivante();
  const point: PointEdite = { cle, date, avancement: null, temps: tempsDe(date, onglet.debut, onglet.duree), paiement: null };
  return { onglet: { ...onglet, points: [...onglet.points, point] }, cle };
}

export function changerPoint(onglet: OngletPrevisions, cle: string, patch: Partial<Pick<PointEdite, 'date' | 'avancement'>>): OngletPrevisions {
  return {
    ...onglet,
    points: onglet.points.map((p) => {
      if (p.cle !== cle) return p;
      const date = patch.date ?? p.date;
      return { ...p, ...patch, temps: patch.date ? tempsDe(date, onglet.debut, onglet.duree) : p.temps };
    }),
  };
}

export const retirerPoint = (onglet: OngletPrevisions, cle: string): OngletPrevisions => ({ ...onglet, points: onglet.points.filter((p) => p.cle !== cle) });

/** Copie les points de la source vers la cible : temps conservé, dates recalculées sur les bornes de la cible. */
export function copierPoints(source: OngletPrevisions, cible: OngletPrevisions): OngletPrevisions {
  const points = source.points.map((p) => {
    const temps = p.temps ?? tempsDe(p.date, source.debut, source.duree);
    const date = temps !== null && cible.debut && cible.duree !== null ? iso(jourMs(cible.debut) + Math.round(temps * cible.duree) * JOUR_MS) : p.date;
    return { ...p, cle: cleSuivante(), date, temps };
  });
  return { ...cible, points };
}

/** Une proposition (alignement, modèle) remplace toute la grille « Prévisions » ; fin et durée suivent. */
export function appliquerProposition(etat: EtatSaisie, proposition: PropositionPointsDto): EtatSaisie {
  const { debut } = etat.previsions;
  const duree = proposition.duree ?? etat.previsions.duree;
  const points = proposition.points.map((p) => {
    const date = p.date.slice(0, 10);
    return { cle: cleSuivante(), date, avancement: arrondi(p.avancement * 100, 6), temps: tempsDe(date, debut, duree), paiement: null };
  });
  return { ...etat, previsions: { debut, duree, points } };
}

export const montantPoint = (p: PointEdite, prix: number | null): number | null => (p.paiement !== null && prix !== null ? arrondi(p.paiement * prix) : null);

const versPoints = (points: PointEdite[]) =>
  points
    .filter((p) => p.date)
    .map((p) => ({ date: p.date, avancement: arrondi((p.avancement ?? 0) / 100, 8) }))
    .sort((a, b) => a.date.localeCompare(b.date));

/** Motif de refus avant envoi, ou null. */
export function erreurSaisie(etat: EtatSaisie): string | null {
  const { debut, duree } = etat.previsions;
  if (!debut || duree === null) return 'Renseignez la date de début et la durée des prévisions.';
  return duree < 0 ? 'La date de fin ne peut pas précéder la date de début.' : null;
}

/** Corps du PUT (à appeler quand `erreurSaisie` est null). */
export function versRequete(etat: EtatSaisie): PrevisionsSaisieRequest {
  const { previsions: p, base: b } = etat;
  return {
    debut: p.debut,
    duree: p.duree ?? 0,
    debutBase: b.debut || p.debut,
    dureeBase: b.duree ?? 0,
    estimationBaseHT: etat.ht ?? 0,
    points: versPoints(p.points),
    pointsBase: versPoints(b.points),
  };
}
