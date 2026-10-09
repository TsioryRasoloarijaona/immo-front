import { useRef, useState, type ReactNode } from 'react';
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

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  function confirm(opts: ConfirmOptions | string) {
    const normalized = typeof opts === 'string' ? { message: opts } : opts;
    setPending(normalized);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }

  function respond(value: boolean) {
    setPending(null);
    resolver.current?.(value);
    resolver.current = null;
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
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
