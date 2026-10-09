import { useCallback, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { ErreurVirement } from '../../../lib/virements';
import { cn } from '../../../lib/utils';

export type GenreNotification = 'succes' | 'erreur' | 'avertissement';

/** Durées du guide (§3) : succès ~4 s, erreur ~7 s. */
const DUREE: Record<GenreNotification, number> = { succes: 4000, erreur: 7000, avertissement: 7000 };
const ICONE: Record<GenreNotification, typeof CheckCircle2> = { succes: CheckCircle2, erreur: XCircle, avertissement: AlertTriangle };

export interface Notifications {
  noeud: ReactNode;
  notifier: (msg: string, genre?: GenreNotification) => void;
  /** Message d'une `ErreurVirement` (déjà adapté au code : référence d'un
   * 500, « Accès refusé » d'un 403…), précédé de `prefixe` s'il y en a un.
   * Un 401 ne s'affiche pas : le retour à la connexion est en cours. */
  notifierErreur: (e: unknown, prefixe?: string) => void;
}

/** Notification de bas d'écran, au-dessus des dialogues (`z-60`) : elle
 * confirme souvent un geste fait dans l'un d'eux. Un clic la ferme. */
export function useNotification(): Notifications {
  const [courante, setCourante] = useState<{ msg: string; genre: GenreNotification } | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notifier = useCallback((msg: string, genre: GenreNotification = 'succes') => {
    setCourante({ msg, genre });
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setCourante(null), DUREE[genre]);
  }, []);

  const notifierErreur = useCallback(
    (e: unknown, prefixe?: string) => {
      if (e instanceof ErreurVirement && e.status === 401) return;
      const texte = e instanceof Error ? e.message : 'Erreur inconnue.';
      notifier(prefixe ? `${prefixe} : ${texte}` : texte, 'erreur');
    },
    [notifier],
  );

  const Icone = ICONE[courante?.genre ?? 'avertissement'];
  const noeud = courante ? (
    <button
      type="button"
      role={courante.genre === 'succes' ? 'status' : 'alert'}
      aria-live={courante.genre === 'succes' ? 'polite' : 'assertive'}
      title="Fermer"
      onClick={() => setCourante(null)}
      className={cn(
        'fixed inset-x-4 bottom-4 z-60 flex items-start gap-2 rounded-lg px-4.5 py-3 text-left text-label font-medium shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md',
        courante.genre === 'succes' && 'bg-foreground text-background',
        courante.genre === 'erreur' && 'bg-destructive text-white',
        courante.genre === 'avertissement' && 'border border-(--amber) bg-(--amber-bg) text-(--amber)',
      )}
    >
      <Icone aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{courante.msg}</span>
    </button>
  ) : null;

  return { noeud, notifier, notifierErreur };
}
