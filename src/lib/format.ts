// Formatting helpers shared across list & detail views.
// Currency: Moroccan Dirham, space thousands separator, comma decimal, "DH" suffix.
// Dates: JSON gives "YYYY-MM-DD" or null; display as "DD/MM/YYYY".

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const parts = value.toFixed(2).split('.');
  const intPart = parts[0].replace(/^-/, '');
  const sign = value < 0 ? '-' : '';
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${grouped},${parts[1]} DH`;
}

/** Montant abrégé pour un axe ou une étiquette de barre : `30,4 M`, `380 k`.
 *
 * Existe parce qu'un axe ne peut pas porter `30 448 000,00 DH` douze fois de
 * suite sans se chevaucher. **Réservé aux étiquettes de graphique** — partout
 * ailleurs, et dans l'infobulle qui accompagne ces barres, c'est
 * `formatCurrency` qui fait foi. Un chiffre abrégé se survole pour être lu en
 * entier, il ne remplace jamais la valeur exacte. */
export function formatMontantCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.', ',')} M`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)} k`;
  return String(Math.round(value));
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const parts = value.toFixed(decimals).split('.');
  const grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimals > 0 ? `${grouped},${parts[1]}` : grouped;
}

/** Pour un **ratio 0–1** (`DossierDetailDto.remise`, `probabiliteFinalisation`,
 * `tauxTVA`…) : multiplie par 100. Ne pas utiliser sur une valeur déjà en
 * pourcentage — voir `formatPercentValue`. */
export function formatPercent(ratio: number | null | undefined, decimals = 1): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return '—';
  return `${(ratio * 100).toFixed(decimals).replace(/\.0$/, '')}%`;
}

/** Pour une valeur **déjà exprimée en pourcentage (0–100)** :
 * `CreerDossierRequest.remisePercent`, `MontantsOffreDto.remisePercent`,
 * `PayeurDto.quotePart`. Aucune conversion — la confondre avec
 * `formatPercent` donne un facteur 100, l'erreur exacte que les sites
 * d'affichage de remise ont déjà connue. Espace insécable avant le `%`,
 * convention typographique française déjà utilisée sur les offres. */
export function formatPercentValue(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${formatNumber(value, decimals)} %`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

/** `DD/MM/YYYY HH:mm` pour un champ `date-time`.
 *
 * C'était jusqu'ici un alias de `formatDate`, donc l'heure était supprimée
 * partout où elle existait — un appel, un rendez-vous et un changement de
 * statut s'affichaient tous à la journée près. Sur un historique où plusieurs
 * actions tombent le même jour, l'ordre devenait illisible.
 *
 * Retombe sur la date seule quand la valeur n'en porte pas (`YYYY-MM-DD`
 * nu) : une échéance n'a pas d'heure et « 00:00 » serait une invention. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value);
  if (!m) return value;
  const [, y, mo, d, h, min] = m;
  const jour = `${d}/${mo}/${y}`;
  return h !== undefined ? `${jour} ${h}:${min}` : jour;
}

// Date `<input type="date">` fields give plain "YYYY-MM-DD" strings, but
// some request DTOs (e.g. ChangerStatutRequest.date) are typed
// `format: date-time` and reject a date-only string with a 400 — pad it out
// to midnight ISO so it deserializes as a LocalDateTime/OffsetDateTime.
// An `<input type="datetime-local">` (date du RDV) gives "YYYY-MM-DDTHH:mm"
// without seconds: only the seconds are padded then, the chosen time stays.
export function toApiDateTime(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value.includes('T')) return value.length === 16 ? `${value}:00` : value;
  return `${value}T00:00:00`;
}

/** `HH:mm` d'une valeur date-time, ou `null` quand elle n'en porte pas — ou
 * porte minuit pile, l'heure de remplissage des saisies à la journée : tous
 * les RDV pris avant le passage du champ en date+heure sont à `T00:00:00`,
 * et leur afficher « 00:00 » inventerait un horaire que la donnée n'a pas.
 * Le prix accepté : un vrai RDV à minuit s'affiche sans heure — improbable
 * pour une visite immobilière, et préférable au mensonge inverse. */
export function formatHeure(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^\d{4}-\d{2}-\d{2}[T ](\d{2}):(\d{2})/.exec(value);
  if (!m) return null;
  const [, h, min] = m;
  if (h === '00' && min === '00') return null;
  return `${h}:${min}`;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

/** Numéro précédé de son indicatif, quand il y en a un : `+212 612345678`.
 *
 * Purement typographique — on n'ajoute qu'un « + » et une espace, sans toucher
 * au numéro. Les champs `telephone`/`indicatifTelephone` n'ont aucune
 * annotation dans la spec : rien n'y dit si le numéro perd son zéro initial
 * une fois l'indicatif renseigné, donc le recomposer ici reviendrait à
 * inventer une règle. On affiche les deux morceaux tels qu'ils arrivent. */
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

/** Délai en heures → libellé court. `null` quand il n’y a rien à mesurer
 * (aucune prospection prise en charge), jamais « 0 h » qui se lirait comme une
 * réponse instantanée. Sous 24 h on reste en heures ; au-delà on passe en
 * jours + heures, un « 109 h » étant illisible. */
export function formatHeures(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || Number.isNaN(hours)) return '—';
  const h = Math.round(hours);
  if (h < 24) return `${h} h`;
  const jours = Math.floor(h / 24);
  const reste = h % 24;
  return reste === 0 ? `${jours} j` : `${jours} j ${reste} h`;
}
