// Formatting helpers shared across list & detail views.
// Currency: Moroccan Dirham, space thousands separator, comma decimal, "DH" suffix.
// Dates: JSON gives "YYYY-MM-DD" or null; display as "DD/MM/YYYY".
//
// Les séparateurs sont des espaces **insécables**, pas des espaces ordinaires :
// `1 350 000,00 DH` en espaces ordinaires offre quatre points de coupure, et un
// montant coupé en `1 350` / `000,00 DH` en fin de ligne se lit comme deux
// nombres. Visible dans `Field` (`components/ui.tsx`), qui pose `break-words`
// dans une grille de colonnes de 190 px.
//
// U+202F (espace fine insécable) pour les milliers et U+00A0 (espace insécable)
// devant l'unité : c'est ce que produit `Intl.NumberFormat('fr-FR')`. On ne
// passe pas à `Intl` pour autant — la locale `fr-MA` de CLDR groupe avec des
// points (`1.350.000,00`) et rend MAD en code ISO, ce qui changerait
// silencieusement tous les montants de l'application.
const MILLIERS = ' ';
const AVANT_UNITE = ' ';

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const parts = value.toFixed(2).split('.');
  const intPart = parts[0].replace(/^-/, '');
  const sign = value < 0 ? '-' : '';
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, MILLIERS);
  return `${sign}${grouped},${parts[1]}${AVANT_UNITE}DH`;
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const parts = value.toFixed(decimals).split('.');
  const grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, MILLIERS);
  return decimals > 0 ? `${grouped},${parts[1]}` : grouped;
}

/** Pour un **ratio 0–1** (`DossierDetailDto.remise`, `probabiliteFinalisation`,
 * `tauxTVA`…) : multiplie par 100. Ne pas utiliser sur une valeur déjà en
 * pourcentage — voir `formatPercentValue`. */
export function formatPercent(ratio: number | null | undefined, decimals = 1): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return '—';
  // Espace insécable avant le `%`, comme `formatPercentValue` : les deux
  // rendaient auparavant deux conventions différentes (`12,5%` ici, `12,50 %`
  // là), parfois sur la même page.
  return `${(ratio * 100).toFixed(decimals).replace(/\.0$/, '')}${AVANT_UNITE}%`;
}

/** Pour une valeur **déjà exprimée en pourcentage (0–100)** :
 * `CreerDossierRequest.remisePercent`, `MontantsOffreDto.remisePercent`,
 * `PayeurDto.quotePart`. Aucune conversion — la confondre avec
 * `formatPercent` donne un facteur 100, l'erreur exacte que les sites
 * d'affichage de remise ont déjà connue. Espace insécable avant le `%`,
 * convention typographique française déjà utilisée sur les offres. */
export function formatPercentValue(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${formatNumber(value, decimals)}${AVANT_UNITE}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const [, y, mo, d] = m;
  return `${d}/${mo}/${y}`;
}

export function formatDateTime(value: string | null | undefined): string {
  return formatDate(value);
}

// Date `<input type="date">` fields give plain "YYYY-MM-DD" strings, but
// some request DTOs (e.g. ChangerStatutRequest.date) are typed
// `format: date-time` and reject a date-only string with a 400 — pad it out
// to midnight ISO so it deserializes as a LocalDateTime/OffsetDateTime.
export function toApiDateTime(dateOnly: string | null | undefined): string | undefined {
  if (!dateOnly) return undefined;
  return `${dateOnly}T00:00:00`;
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

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
