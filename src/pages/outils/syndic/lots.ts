import type { Appartement, Pastille } from './types';

/** Un appartement prêt à recevoir un paiement sur l'exercice affiché (RM-07 : appartement + exercice désignés). */
export interface Lot {
  code: string;
  exerciceId: string;
  exercice: string;
  reste: number;
  pastille: Pastille;
  proprietaires: string;
  proprietaireIds: string[];
}

/** null si l'appartement n'a pas l'exercice demandé, ou si celui-ci a été repris en bloc (RM-32). */
export function lotDe(a: Appartement, exercice: string): Lot | null {
  const e = a.exercice_affiche;
  if (!e || e.label !== exercice || e.repris_en_bloc) return null;
  return {
    code: a.code,
    exerciceId: e.id,
    exercice: e.label,
    reste: e.situation.reste,
    pastille: e.situation.pastille,
    proprietaires: a.proprietaires.map((p) => p.nom).join(' et ') || 'Sans propriétaire',
    proprietaireIds: a.proprietaires.map((p) => p.id),
  };
}

/** Affichage seulement (le service tranche) : le total règle-t-il exactement chaque reste ? Comparé en centimes. */
export function soldeChaqueReste(total: number, lots: Lot[]): boolean {
  const centimes = (v: number) => Math.round(v * 100);
  return lots.every((l) => l.reste > 0) && centimes(total) === lots.reduce((s, l) => s + centimes(l.reste), 0);
}

/** Les autres lots d'un même propriétaire, encore dus : ceux qu'un règlement groupé peut couvrir. */
export function lotsDuMemeProprietaire(principal: Lot, lots: Lot[]): Lot[] {
  return lots.filter((l) => l.code !== principal.code && l.reste > 0 && l.proprietaireIds.some((id) => principal.proprietaireIds.includes(id)));
}
