import { createContext, useContext } from 'react';
import type { CommercialListItemDto } from '../types';
import { personDisplayName } from './domain';

export interface AppDataValue {
  commerciaux: CommercialListItemDto[];
  commerciauxLoading: boolean;
}

/** Fourni par `AppDataProvider` (fichier à part : Fast Refresh exige un fichier de composants seuls). */
export const AppDataContext = createContext<AppDataValue | null>(null);

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

export function commercialLabel(c: CommercialListItemDto): string {
  return personDisplayName(c);
}
