import { createContext, useContext } from 'react';

// "Origine" popups — not a general navigation replacement. A detail page
// (e.g. DossierDetail) can list its origin chain (Prospect / Prospection)
// as small clickable entries that open a compact read-only preview without
// leaving the current page. See PreviewProvider (rendered once in App.tsx)
// for the dialog wiring — each dialog fetches its own record by id from the
// real API.
export type PreviewTarget =
  | { type: 'prospection'; id: string }
  | { type: 'dossier'; id: string }
  | { type: 'prospect'; id: string };

export interface PreviewContextValue {
  previewProspection: (id: string) => void;
  previewDossier: (id: string) => void;
  previewProspect: (id: string) => void;
}

export const PreviewContext = createContext<PreviewContextValue | null>(null);

export function usePreview(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error('usePreview must be used within PreviewProvider');
  return ctx;
}
