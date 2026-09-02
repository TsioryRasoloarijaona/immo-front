import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { listCommerciaux } from './api';
import { useApi } from './useApi';
import type { CommercialListItemDto } from '../types';
import { personDisplayName } from './domain';

// Small app-wide context for reference data used across many pages (the
// commercial picker shown on Prospection/Dossier headers, filters, …).
// Everything else is fetched per-page directly via the api.ts functions —
// there's no more single "store" now that data lives behind a real REST API.
export interface AppDataValue {
  commerciaux: CommercialListItemDto[];
  commerciauxLoading: boolean;
}

const AppDataContext = createContext<AppDataValue | null>(null);

// Repli stable pour l'état de chargement : `data?.content ?? []` créerait un
// tableau neuf à chaque rendu, donc une nouvelle identité de `commerciaux`
// pour les sept pages qui le consomment.
const AUCUN_COMMERCIAL: CommercialListItemDto[] = [];

export function AppDataProvider({ children }: { children: ReactNode }) {
  // Reference data for dropdowns/filters across the app — fetched as one
  // large page rather than exposing pagination UI for it.
  const { data, loading } = useApi(() => listCommerciaux({ page: 0, size: 500 }), []);
  const value = useMemo<AppDataValue>(
    () => ({ commerciaux: data?.content ?? AUCUN_COMMERCIAL, commerciauxLoading: loading }),
    [data, loading],
  );
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

export function commercialLabel(c: CommercialListItemDto): string {
  return personDisplayName(c);
}
