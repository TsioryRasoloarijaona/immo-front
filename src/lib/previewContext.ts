import { createContext, useContext } from 'react';

export type PreviewTarget =
  | { type: 'prospection'; id: string }
  | { type: 'dossier'; id: string }
  | { type: 'prospect'; id: string };

export type FicheCible =
  | { type: 'prospection'; id: string; pre: boolean }
  | { type: 'dossier'; id: string }
  | { type: 'prospect'; id: string };

export interface PreviewContextValue {
  previewProspection: (id: string) => void;
  previewDossier: (id: string) => void;
  previewProspect: (id: string) => void;
  /** Dialogue empilé au-dessus des autres ; toute navigation ferme la pile. */
  ouvrirFicheProspection: (id: string, pre: boolean) => void;
  ouvrirFicheDossier: (id: string) => void;
  ouvrirFicheProspect: (id: string) => void;
}

export const PreviewContext = createContext<PreviewContextValue | null>(null);

export function usePreview(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error('usePreview must be used within PreviewProvider');
  return ctx;
}
