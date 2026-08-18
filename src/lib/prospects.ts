import type { Dossier, Prospection } from '../types';

// Omran's fiche "Prospect" (the Tier/contact record) carries its own
// Prospections/Dossiers tabs — a person-centric view distinct from both the
// Prospections list (lead-centric) and the Clients list (dossier-centric,
// see lib/clients.ts). This prototype has no standalone Person/Tier table
// (contacts only exist embedded on a Prospection via `prospect`), so this
// view is built by deduplicating prospections by their linked `prospect.id`
// — see instructions/FEATURE-transformation-prospect.md §5.
export interface ProspectRow {
  id: string;
  code: string;
  displayName: string;
  phone: string;
  mobile: string;
  email: string;
  city: string;
  prospection: Prospection;
  hasDossier: boolean;
  dossierId: string | null;
  commercial: string | null;
}

/**
 * One row per distinct linked `prospect` contact — pré-prospections without
 * a linked contact are intentionally excluded (that's the whole distinction
 * with the Prospections list). When the same contact ends up linked to more
 * than one prospection (rare, e.g. after a reassignment), the most recently
 * touched prospection wins.
 */
export function buildProspectRows(prospections: Prospection[], dossiers: Dossier[]): ProspectRow[] {
  const dossierByProspectionId = new Map<string, string>();
  for (const d of dossiers) {
    if (d.prospectionId) dossierByProspectionId.set(d.prospectionId, d.id);
  }

  const byId = new Map<string, ProspectRow>();
  for (const p of prospections) {
    if (!p.prospect) continue;
    const existing = byId.get(p.prospect.id);
    if (existing) {
      const existingDate = existing.prospection.updatedAt || existing.prospection.date || '';
      const currentDate = p.updatedAt || p.date || '';
      if (currentDate <= existingDate) continue;
    }
    const dossierId = dossierByProspectionId.get(p.id) ?? null;
    byId.set(p.prospect.id, {
      id: p.prospect.id,
      code: p.prospect.code,
      displayName: p.prospect.name,
      phone: p.prospect.phone,
      mobile: p.prospect.mobile,
      email: p.prospect.email,
      city: p.prospect.city,
      prospection: p,
      hasDossier: dossierId !== null,
      dossierId,
      commercial: p.commercial,
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
}
