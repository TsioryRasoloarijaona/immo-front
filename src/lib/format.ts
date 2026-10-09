const NBSP = ' ';

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${formatNumber(value, 2)} DH`;
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
  const [entier, decimal] = fixed.replace(/^-/, '').split('.');
  const grouped = entier.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = negatif ? '-' : '';
  return decimal === undefined ? `${sign}${grouped}` : `${sign}${grouped},${decimal}`;
}

function sansZerosFinaux(texte: string): string {
  if (!texte.includes(',')) return texte;
  return texte.replace(/0+$/, '').replace(/,$/, '');
}

/** Pour un **ratio 0–1** (`remise`, `probabiliteFinalisation`, `tauxTVA`) : multiplie
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

/** Pour une valeur **déjà en pourcentage (0–100)** (`remisePercent`, `quotePart`) :
 * aucune conversion. La confondre avec `formatPercent` donne un facteur 100. */
export function formatPercentValue(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${sansZerosFinaux(formatNumber(value, decimals))}${NBSP}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

/** Valeur sans heure (`YYYY-MM-DD` nu) : date seule, « 00:00 » serait une invention. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value);
  if (!m) return value;
  const [, y, mo, d, h, min] = m;
  const jour = `${d}/${mo}/${y}`;
  return h !== undefined ? `${jour} ${h}:${min}` : jour;
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

export function daysBetween(a: string | null | undefined, b: string | null | undefined): number | null {
  if (!a || !b) return null;
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return null;
  return Math.round((db - da) / 86400000);
}

/** Ne touche pas au numéro (zéro initial compris) : rien ne dit comment il se
 * recompose avec l'indicatif. */
export function formatTelephone(numero: string | null | undefined, indicatif?: string | null): string {
  if (!numero) return '—';
  return indicatif ? `+${indicatif} ${numero}` : numero;
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatHeures(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return '—';
  const h = Math.round(hours);
  if (h < 24) return `${h} h`;
  const jours = Math.floor(h / 24);
  const reste = h % 24;
  return reste === 0 ? `${jours} j` : `${jours} j ${reste} h`;
}
