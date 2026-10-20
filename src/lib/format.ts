const NBSP = ' ';

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${formatNumber(value, 2)} DH`;
}

/** `undefined` quand le montant est absent : `Field` affiche alors son propre tiret. */
export function formatMontantOptionnel(value: number | null | undefined): string | undefined {
  return value == null ? undefined : formatCurrency(value);
}

export function libellePrix(prix: number | null | undefined, plancher: number | null | undefined): string | undefined {
  if (prix) return formatCurrency(prix);
  if (plancher) return `${formatCurrency(plancher)} (plancher)`;
  return undefined;
}

/** Réservé aux étiquettes de graphique ; partout ailleurs, infobulles comprises,
 * `formatCurrency` fait foi. */
export function formatMontantCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  // Le seuil se choisit sur la valeur arrondie : 999 600 doit donner « 1,0 M », pas « 1000 k ».
  const abs = Math.abs(value);
  if (Math.round(abs / 1_000) >= 1_000) {
    const millions = value / 1_000_000;
    const decimales = Number(Math.abs(millions).toFixed(1)) >= 10 ? 0 : 1;
    return `${millions.toFixed(decimales).replace('.', ',')} M`;
  }
  if (Math.round(abs) >= 1_000) return `${Math.round(value / 1_000)} k`;
  return String(Math.round(value));
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const fixed = value.toFixed(decimals);
  // Signe pris sur la valeur arrondie : -0,004 s'affiche « 0,00 », pas « -0,00 ».
  const negatif = Number(fixed) < 0;
  const absolu = fixed.replace(/^-/, '');
  const point = absolu.indexOf('.');
  const entier = point === -1 ? absolu : absolu.slice(0, point);
  const decimal = point === -1 ? undefined : absolu.slice(point + 1);
  // eslint-disable-next-line sonarjs/super-linear-regex -- appliquée à une suite de chiffres de quelques caractères
  const grouped = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = negatif ? '-' : '';
  return decimal === undefined ? `${sign}${grouped}` : `${sign}${grouped},${decimal}`;
}

/** Coefficient (COS, CUF…) : entier sans décimales (« 3 »), sinon deux décimales (« 0,30 »). */
export function formatRatio(value: number): string {
  return formatNumber(value, Number.isInteger(value) ? 0 : 2);
}

function sansZerosFinaux(texte: string): string {
  if (!texte.includes(',')) return texte;
  // eslint-disable-next-line sonarjs/super-linear-regex -- appliquée à un nombre déjà formaté, quelques caractères
  return texte.replace(/0+$/, '').replace(/,$/, '');
}

/** Pour un **ratio 0–1** (`probabiliteFinalisation`, `tauxTVA`) : multiplie
 * par 100. Valeur déjà en pourcentage : `formatPercentValue`. */
export function formatPercent(ratio: number | null | undefined, decimals = 1): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return '—';
  return `${sansZerosFinaux(formatNumber(ratio * 100, decimals))}${NBSP}%`;
}

export function formatSurface(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${sansZerosFinaux(formatNumber(value, decimals))}${NBSP}m²`;
}

export function formatFourchetteSurface(de: number | null | undefined, a: number | null | undefined): string | undefined {
  if (de === null || de === undefined) return undefined;
  if (!a) return formatSurface(de);
  return `${sansZerosFinaux(formatNumber(de, 2))} à ${formatSurface(a)}`;
}

/** « 1 dossier », « 3 dossiers » (le nombre n'est pas formaté). */
export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`): string {
  return `${n} ${n > 1 ? plurielForme : singulier}`;
}

export function formatFourchetteMontant(de: number | null | undefined, a: number | null | undefined): string | undefined {
  if (de === null || de === undefined) return undefined;
  return a ? `${formatCurrency(de)} à ${formatCurrency(a)}` : formatCurrency(de);
}

/** Pour une valeur **déjà en pourcentage (0–100)** (`remise`, `remisePercent`, `quotePart`) :
 * aucune conversion. La confondre avec `formatPercent` donne un facteur 100. */
export function formatPercentValue(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${sansZerosFinaux(formatNumber(value, decimals))}${NBSP}%`;
}

/** Valeur de cellule non typée → texte ; un objet sort en JSON plutôt qu'en « [object Object] ». */
export function texteBrut(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
  return JSON.stringify(v);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

/** « Créé par » / « Modifié par » : auteur et date, rien si l'auteur manque (lignes antérieures à la trace). */
export function libelleTrace(auteur: string | null | undefined, le: string | null | undefined): string | undefined {
  return auteur ? `${auteur} — ${formatDate(le)}` : undefined;
}

/** Valeur sans heure (`YYYY-MM-DD` nu) : date seule, « 00:00 » serait une invention. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value);
  if (!m) return value;
  const [, y, mo, d, h, min] = m;
  const jour = `${d}/${mo}/${y}`;
  // Groupe heure optionnel : `h` vaut `undefined` à l'exécution malgré son type `string`.
  return h ? `${jour} ${h}:${min}` : jour;
}

// Un champ `format: date-time` rejette une date seule en 400 : on complète à minuit.
// `datetime-local` donne "YYYY-MM-DDTHH:mm" sans secondes : seules elles sont ajoutées.
export function toApiDateTime(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value.includes('T')) return value.length === 16 ? `${value}:00` : value;
  return `${value}T00:00:00`;
}

/** Minuit pile rend `null` : les RDV saisis à la journée sont stockés à `T00:00:00`,
 * « 00:00 » inventerait un horaire. Un vrai RDV à minuit perd donc son heure. */
export function formatHeure(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^\d{4}-\d{2}-\d{2}[T ](\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const [, h, min] = m;
  if (h === '00' && min === '00') return null;
  return `${h}:${min}`;
}

export function todayISO(): string {
  return jourISO(new Date());
}

/** Jamais `toISOString()` : il convertit en UTC, et à l'est de Greenwich minuit
 * local devient la veille. */
export function jourISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatJourRelatif(value: string | null | undefined): string {
  if (!value) return '—';
  const jour = value.slice(0, 10);
  if (jour === todayISO()) return "Aujourd'hui";
  const d = new Date();
  if (jour === jourISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))) return 'Hier';
  return formatDate(jour);
}

const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** « mardi 13/10 » : jour lu sur la date locale saisie (`YYYY-MM-DD…`), sans conversion de fuseau. */
export function formatJourSemaine(value: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (!m) return '—';
  const [, y, mo, d] = m;
  const jour = new Date(Number(y), Number(mo) - 1, Number(d)).getDay();
  return `${JOURS_SEMAINE[jour]} ${d}/${mo}`;
}

/** « reçu aujourd'hui », « reçu hier », « reçu il y a 3 jours ». */
export function formatRecuIlYa(ageJours: number): string {
  if (ageJours <= 0) return "reçu aujourd'hui";
  if (ageJours === 1) return 'reçu hier';
  return `reçu il y a ${formatNumber(ageJours)} jours`;
}

/** « à l'instant », « il y a 5 min », « il y a 2 h », puis la date-heure. `iso` sans fuseau = heure locale. */
export function formatIlYa(iso: string | null | undefined, maintenant: number = Date.now()): string {
  if (!iso) return '—';
  const quand = new Date(iso).getTime();
  if (Number.isNaN(quand)) return formatDateTime(iso);
  const minutes = Math.floor((maintenant - quand) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${formatNumber(minutes)} min`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${formatNumber(heures)} h`;
  return formatDateTime(iso);
}

export function debutMoisISO(): string {
  const d = new Date();
  return jourISO(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** Le mois entier, pas « jusqu'à aujourd'hui » : une date peut tomber plus tard dans le mois. */
export function finMoisISO(): string {
  const d = new Date();
  return jourISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function isPastOrToday(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return dateStr <= todayISO();
}

/** Ne touche pas au numéro (zéro initial compris) : rien ne dit comment il se
 * recompose avec l'indicatif. */
export function formatTelephone(numero: string | null | undefined, indicatif?: string | null): string {
  if (!numero) return '—';
  return indicatif ? `+${indicatif} ${numero}` : numero;
}

export function formatHeures(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return '—';
  const h = Math.round(hours);
  if (h < 24) return `${h} h`;
  const jours = Math.floor(h / 24);
  const reste = h % 24;
  return reste === 0 ? `${jours} j` : `${jours} j ${reste} h`;
}
