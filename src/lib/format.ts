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

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const parts = value.toFixed(decimals).split('.');
  const grouped = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decimals > 0 ? `${grouped},${parts[1]}` : grouped;
}

export function formatPercent(ratio: number | null | undefined, decimals = 1): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return '—';
  return `${(ratio * 100).toFixed(decimals).replace(/\.0$/, '')}%`;
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

export function todayISO(): string {
  return '2026-08-12';
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
