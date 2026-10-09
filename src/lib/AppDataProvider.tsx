import { useMemo, type ReactNode } from 'react';
import { listCommerciaux } from './api';
import { useApi } from './useApi';
import { AppDataContext, type AppDataValue } from './appData';
import type { CommercialListItemDto } from '../types';

const EMPTY: CommercialListItemDto[] = [];

export function AppDataProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { data, loading } = useApi(() => listCommerciaux({ page: 0, size: 500 }), []);
  const commerciaux = data?.content ?? EMPTY;
  const value = useMemo<AppDataValue>(() => ({ commerciaux, commerciauxLoading: loading }), [commerciaux, loading]);
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
