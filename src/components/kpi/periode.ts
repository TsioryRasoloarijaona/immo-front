/** Dates nues `YYYY-MM-DD` : y ajouter `T00:00:00` renvoie un 400. Deux chaînes
 * vides = la période par défaut du serveur, pas « aucune période ». Hors de
 * `PeriodeFilterBar.tsx` pour ne pas casser le Fast Refresh. */
export interface Periode {
  du: string;
  au: string;
}

export function emptyPeriode(): Periode {
  return { du: '', au: '' };
}

/** En UTC : un fuseau à l'ouest de Greenwich ferait sinon reculer la borne d'un jour le soir. */
export function aujourdHuiISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ilYA(jours: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - jours);
  return d.toISOString().slice(0, 10);
}

export function premierJourDuMois(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}
