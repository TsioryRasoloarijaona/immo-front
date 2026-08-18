import { createContext, useContext } from 'react';
import type { Person } from '../types';

// "Origine" popups — not a general navigation replacement. A detail page
// (e.g. DossierDetail) can list its origin chain (Prospect / Prospection /
// Pré-prospection) as small clickable entries that open a compact read-only
// preview without leaving the current page; the reverse direction works the
// same way from ProspectionDetail. List pages (ProspectionsList,
// DossiersList, …) keep normal navigation — this is only for peeking at a
// *related* record from within another record's detail. See PreviewProvider
// (rendered once in App.tsx) for the dialog wiring.
export type PreviewTarget =
  | { type: 'prospection'; id: string }
  | { type: 'dossier'; id: string }
  // Person has no dedicated route of its own (a contact only exists inside a
  // Prospection/Dossier context — see instructions/FEATURE-transformation-prospect.md
  // §5), so this carries the record directly instead of an id to resolve.
  | { type: 'prospect'; person: Person; prospectionId?: string };

export interface PreviewContextValue {
  previewProspection: (id: string) => void;
  previewDossier: (id: string) => void;
  previewProspect: (person: Person, prospectionId?: string) => void;
}

export const PreviewContext = createContext<PreviewContextValue | null>(null);

export function usePreview(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error('usePreview must be used within PreviewProvider');
  return ctx;
}
