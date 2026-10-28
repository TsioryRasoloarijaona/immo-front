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

/* Période des filtres cochés des listes (lot B1) : Toutes, Aujourd'hui, Cette semaine, Ce mois, Cette année, Personnalisée. */

export type CodePeriode = 'toutes' | 'aujourdhui' | 'semaine' | 'mois' | 'annee' | 'perso';

export const PERIODES: { code: CodePeriode; libelle: string }[] = [
  { code: 'toutes', libelle: 'Toutes' },
  { code: 'aujourdhui', libelle: "Aujourd'hui" },
  { code: 'semaine', libelle: 'Cette semaine' },
  { code: 'mois', libelle: 'Ce mois' },
  { code: 'annee', libelle: 'Cette année' },
  { code: 'perso', libelle: 'Personnalisée' },
];

/** Bornes ISO (jour) d'une période ; `null` pour « Personnalisée » : les dates saisies restent. Semaine : lundi à dimanche. */
export function bornesPeriode(code: CodePeriode, ref: Date = new Date()): { debut: string; fin: string } | null {
  switch (code) {
    case 'toutes':
      return { debut: '', fin: '' };
    case 'aujourdhui':
      return plagePeriode('aujourdhui', ref);
    case 'semaine': {
      const lundi = ref.getDate() - ((ref.getDay() + 6) % 7);
      return {
        debut: jourISO(new Date(ref.getFullYear(), ref.getMonth(), lundi)),
        fin: jourISO(new Date(ref.getFullYear(), ref.getMonth(), lundi + 6)),
      };
    }
    case 'mois':
      return mois(ref, 0);
    case 'annee':
      return annee(ref, 0);
    case 'perso':
      return null;
  }
}

/** Période dont les bornes sont exactement `debut`/`fin`, sinon « Personnalisée ». */
export function periodeDepuis(debut: string, fin: string, ref: Date = new Date()): CodePeriode {
  const trouvee = PERIODES.find((p) => {
    const b = bornesPeriode(p.code, ref);
    return b?.debut === debut && b.fin === fin;
  });
  return trouvee?.code ?? 'perso';
}
