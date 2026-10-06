import { useCallback, useRef, useState, type ReactNode } from 'react';

/** Notification de bas d'écran, même rendu que celle de `ClesApiList`.
 * Au-dessus des dialogues (`z-60`) : elle confirme souvent un geste fait
 * dans l'un d'eux. */
export function useNotification(): [ReactNode, (msg: string) => void] {
  const [message, setMessage] = useState<string | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const afficher = useCallback((msg: string) => {
    setMessage(msg);
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setMessage(null), 3600);
  }, []);
  const noeud = message ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-60 rounded-lg bg-foreground px-4.5 py-3 text-center text-label font-medium text-background shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:text-left"
    >
      {message}
    </div>
  ) : null;
  return [noeud, afficher];
}
