import { jourISO, toApiDateTime } from './format';
import type { RendezVousDto, RendezVousEcritureDto } from '../types/rendezVous';

export type VueCalendrier = 'mois' | 'semaine' | 'jour';

export const JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const JOUR_MS = 86_400_000;

export function parseJour(iso: string): Date {
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, j);
}

export function ajouterJours(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function lundiDe(d: Date): Date {
  return ajouterJours(d, -((d.getDay() + 6) % 7));
}

/** Jours de la grille : 42 cases (6 semaines) en mois, lundi à vendredi en semaine, un seul en jour. */
export function joursDeVue(vue: VueCalendrier, ancre: Date): Date[] {
  if (vue === 'jour') return [ancre];
  if (vue === 'semaine') return Array.from({ length: 5 }, (_, i) => ajouterJours(lundiDe(ancre), i));
  const premier = lundiDe(new Date(ancre.getFullYear(), ancre.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => ajouterJours(premier, i));
}

export function decalerAncre(vue: VueCalendrier, ancre: Date, sens: 1 | -1): Date {
  if (vue === 'jour') return ajouterJours(ancre, sens);
  if (vue === 'semaine') return ajouterJours(ancre, 7 * sens);
  return new Date(ancre.getFullYear(), ancre.getMonth() + sens, 1);
}

export function titreVue(vue: VueCalendrier, jours: Date[], ancre: Date): string {
  if (vue === 'mois') return ancre.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const format = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return vue === 'jour' ? format(ancre) : `${format(jours[0])} – ${format(jours[jours.length - 1])}`;
}

/** Corps du PATCH d'un déplacement : le jour change, l'heure et la durée restent. */
export function corpsDeplacement(rdv: RendezVousDto, jourCible: string): RendezVousEcritureDto {
  const debut = rdv.datePrevue ?? '';
  const ecart = Math.round((parseJour(jourCible).getTime() - parseJour(debut).getTime()) / JOUR_MS);
  const fin = rdv.dateFinPrevue;
  return {
    datePrevue: toApiDateTime(jourCible + debut.slice(10)),
    dateFinPrevue: fin ? toApiDateTime(jourISO(ajouterJours(parseJour(fin), ecart)) + fin.slice(10)) : undefined,
  };
}
