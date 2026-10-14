import { jourISO } from './format';

/** Raccourcis du choix de période d'OMRAN (`YesPeriodChoice`) : ils remplissent les deux dates. */
export type RaccourciPeriode =
  | 'aujourdhui'
  | 'mois'
  | 'mois-precedent'
  | 'mois-suivant'
  | 'annee'
  | 'annee-precedente'
  | 'tous';

export const RACCOURCIS_PERIODE: { label: string; value: RaccourciPeriode }[] = [
  { label: "Aujourd'hui", value: 'aujourdhui' },
  { label: 'Mois en cours', value: 'mois' },
  { label: 'Mois précédent', value: 'mois-precedent' },
  { label: 'Mois suivant', value: 'mois-suivant' },
  { label: 'Année en cours', value: 'annee' },
  { label: 'Année précédente', value: 'annee-precedente' },
  { label: 'Toutes les dates', value: 'tous' },
];

function mois(ref: Date, decalage: number): { debut: string; fin: string } {
  return {
    debut: jourISO(new Date(ref.getFullYear(), ref.getMonth() + decalage, 1)),
    fin: jourISO(new Date(ref.getFullYear(), ref.getMonth() + decalage + 1, 0)),
  };
}

function annee(ref: Date, decalage: number): { debut: string; fin: string } {
  const a = ref.getFullYear() + decalage;
  return { debut: jourISO(new Date(a, 0, 1)), fin: jourISO(new Date(a, 11, 31)) };
}

/** Dates `AAAA-MM-JJ` du raccourci ; `tous` les vide. Fin incluse : le serveur prend le jour entier. */
export function plagePeriode(raccourci: RaccourciPeriode, ref: Date = new Date()): { debut: string; fin: string } {
  switch (raccourci) {
    case 'aujourdhui':
      return { debut: jourISO(ref), fin: jourISO(ref) };
    case 'mois':
      return mois(ref, 0);
    case 'mois-precedent':
      return mois(ref, -1);
    case 'mois-suivant':
      return mois(ref, 1);
    case 'annee':
      return annee(ref, 0);
    case 'annee-precedente':
      return annee(ref, -1);
    default:
      return { debut: '', fin: '' };
  }
}

/** Le raccourci dont les dates sont exactement celles-ci, sinon `undefined` (période saisie à la main). */
export function raccourciCourant(debut: string, fin: string): RaccourciPeriode | undefined {
  return RACCOURCIS_PERIODE.find((r) => {
    const p = plagePeriode(r.value);
    return p.debut === debut && p.fin === fin;
  })?.value;
}
