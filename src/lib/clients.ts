import type { Dossier, Settlement } from '../types';
import { todayISO } from './format';

// Omran's "Vente > Clients" view is person-centric, not dossier-centric —
// useful when one client holds several dossiers (an investor who bought
// several lots across tranches). See instructions/FIX-clients-and-module-switcher.md.
export interface ClientRow {
  id: string;
  code: string;
  displayName: string;
  mobile: string;
  phone: string;
  email: string;
  age: number | null;
  dossiers: Dossier[];
  totalDue: number;
  totalPaid: number;
  totalRemaining: number;
}

function computeAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const today = new Date(todayISO());
  let age = today.getFullYear() - b.getFullYear();
  const m = today.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age -= 1;
  return age;
}

/**
 * Groups dossiers by client and aggregates À payer / Réglé / Reste.
 *
 * Réglé is summed from settlements.json matched by `tierId === client.id`
 * with `isCredit: true` — the correct join for real data, even though in
 * this 50-row sample that FK only actually resolves for one client (same
 * cross-table gap documented in CLAUDE.md). Most rows will show 0 réglé —
 * that's an honest reflection of the sample, not a bug.
 */
export function buildClientRows(dossiers: Dossier[], settlements: Settlement[]): ClientRow[] {
  const byId = new Map<string, ClientRow>();

  for (const d of dossiers) {
    const client = d.client;
    if (!client) continue;
    let row = byId.get(client.id);
    if (!row) {
      row = {
        id: client.id,
        code: client.code,
        displayName: client.name,
        mobile: client.mobile,
        phone: client.phone,
        email: client.email,
        age: computeAge(client.birthDate),
        dossiers: [],
        totalDue: 0,
        totalPaid: 0,
        totalRemaining: 0,
      };
      byId.set(client.id, row);
    }
    row.dossiers.push(d);
    row.totalDue += d.totalToPay || 0;
  }

  for (const s of settlements) {
    if (!s.tierId || !s.isCredit) continue;
    const row = byId.get(s.tierId);
    if (row) row.totalPaid += s.amount || 0;
  }

  for (const row of byId.values()) {
    row.totalRemaining = row.totalDue - row.totalPaid;
  }

  return Array.from(byId.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}
