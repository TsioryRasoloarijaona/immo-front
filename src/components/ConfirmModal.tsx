import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { ConfirmContext, type ConfirmOptions } from '../lib/confirmContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

// Matches the real system's short, direct Oui/Non confirm pattern (e.g. "Vous
// devez enregistrer vos modifications avant cette opération. Voulez-vous
// continuer ?") for the pipeline's meaningful transitions — see
// instructions/FIX-mock-actions-state.md.
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const normalized = typeof opts === 'string' ? { message: opts } : opts;
    setPending(normalized);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const respond = useCallback((value: boolean) => {
    setPending(null);
    resolver.current?.(value);
    resolver.current = null;
  }, []);

  // `ConfirmProvider` enveloppe tout l'arbre applicatif (App.tsx) : sans ce
  // `useMemo`, chaque ouverture/fermeture de la boîte re-rendrait tous les
  // consommateurs de `useConfirm()`.
  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AlertDialog open={!!pending} onOpenChange={(open) => !open && respond(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={pending?.title ? undefined : 'sr-only'}>
              {pending?.title ?? 'Confirmation'}
            </AlertDialogTitle>
            <AlertDialogDescription>{pending?.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => respond(false)}>
              {pending?.cancelLabel ?? 'Non'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => respond(true)}>
              {pending?.confirmLabel ?? 'Oui'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
