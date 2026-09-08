/** Période `du`/`au` des endpoints KPI.
 *
 * Séparé de `PeriodeFilterBar.tsx` : un fichier qui exporte un composant *et*
 * des fonctions casse le Fast Refresh (`react-refresh/only-export-components`).
 *
 * Les deux bornes sont des dates **nues** (`YYYY-MM-DD`), telles que les rend un
 * `<input type="date">` et telles que les attend l'API — voir le commentaire des
 * endpoints KPI dans `lib/api.ts` : y ajouter `T00:00:00` renvoie un 400.
 *
 * Deux chaînes vides ne veulent pas dire « aucune période » mais « les 30
 * derniers jours », valeur par défaut du serveur. */
export interface Periode {
  du: string;
  au: string;
}

export function emptyPeriode(): Periode {
  return { du: '', au: '' };
}

/** Aujourd'hui en UTC. Les bornes de période sont des jours, pas des instants :
 * passer par UTC évite qu'un fuseau à l'ouest de Greenwich ne fasse reculer la
 * borne d'un jour en fin de soirée. */
export function aujourdHuiISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Il y a `jours` jours, même convention UTC. */
export function ilYA(jours: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - jours);
  return d.toISOString().slice(0, 10);
}

export function premierJourDuMois(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
}
