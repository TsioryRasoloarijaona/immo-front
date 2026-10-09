import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { listCommerciaux } from './api';
import { useApi } from './useApi';
import type { CommercialListItemDto } from '../types';
import { personDisplayName } from './domain';

export interface AppDataValue {
  commerciaux: CommercialListItemDto[];
  commerciauxLoading: boolean;
}

const AppDataContext = createContext<AppDataValue | null>(null);

const EMPTY: CommercialListItemDto[] = [];

export function AppDataProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { data, loading } = useApi(() => listCommerciaux({ page: 0, size: 500 }), []);
  const commerciaux = data?.content ?? EMPTY;
  const value = useMemo<AppDataValue>(() => ({ commerciaux, commerciauxLoading: loading }), [commerciaux, loading]);
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
