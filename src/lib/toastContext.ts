import { createContext, useContext } from 'react';

export type ToastAction =
  | {
      libelle: string;
      /** Route SPA (`/prospects/…`), jamais une URL absolue. */
      vers: string;
      surClic?: never;
    }
  | {
      libelle: string;
      /** Action sans navigation (ex. ouvrir une fiche en dialogue). */
      surClic: () => void;
      vers?: never;
    };

export interface ToastOptions {
  texte: string;
  /** Avec action, le toast reste affiché jusqu'à fermeture ou clic (R1). */
  action?: ToastAction;
  variante?: 'succes' | 'erreur';
}

export type AfficherToast = (opts: ToastOptions | string) => void;

export const ToastContext = createContext<AfficherToast | null>(null);

export function useToast(): AfficherToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
