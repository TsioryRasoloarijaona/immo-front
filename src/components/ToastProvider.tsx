import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { ToastContext, type ToastOptions } from '../lib/toastContext';
import { cn } from '../lib/utils';

const DUREE_SANS_ACTION_MS = 3600;
const CLASSE_ACTION =
  'shrink-0 rounded font-semibold whitespace-nowrap underline underline-offset-2 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-current';

/** Le toast partagé, monté une fois autour du layout : il survit donc à une
 * navigation (R3). Un seul message à la fois — le suivant remplace le
 * précédent, comme les copies locales qu'il remplace.
 *
 * Un dialogue modal rend le reste de la page `aria-hidden` et inerte : il
 * monte alors son propre fournisseur, dont la région vit dans son portail. */
export function ToastProvider({
  children,
  onAction,
}: {
  children: ReactNode;
  /** Appelé après un clic sur l'action (ex. fermer le dialogue hôte). */
  onAction?: () => void;
}) {
  const [toast, setToast] = useState<(ToastOptions & { cle: number }) | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fermer = useCallback(() => {
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
    setToast(null);
  }, []);

  const afficher = useCallback((opts: ToastOptions | string) => {
    const normalise = typeof opts === 'string' ? { texte: opts } : opts;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
    setToast({ ...normalise, cle: Date.now() });
    if (!normalise.action) {
      minuteur.current = setTimeout(() => {
        minuteur.current = null;
        setToast(null);
      }, DUREE_SANS_ACTION_MS);
    }
  }, []);

  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  const erreur = toast?.variante === 'erreur';

  return (
    <ToastContext.Provider value={afficher}>
      {children}
      {/* La région live reste montée : un lecteur d'écran n'annonce pas de
          façon fiable une région insérée avec son contenu. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toast && (
          <div
            key={toast.cle}
            className={cn(
              'pointer-events-auto flex max-w-md items-center gap-3 rounded-lg px-4.5 py-3 text-label font-medium shadow-lg',
              erreur ? 'bg-destructive text-white' : 'bg-foreground text-background',
            )}
          >
            <span className="min-w-0 flex-1">{toast.texte}</span>
            {toast.action && (
              <>
                {toast.action.surClic ? (
                  /* Pas d'`onAction` : il ferme le dialogue hôte, alors que
                     l'action s'ouvre par-dessus et doit y revenir. */
                  <button
                    type="button"
                    onClick={() => {
                      const surClic = toast.action!.surClic!;
                      fermer();
                      surClic();
                    }}
                    className={CLASSE_ACTION}
                  >
                    {toast.action.libelle}
                  </button>
                ) : (
                  <Link
                    to={toast.action.vers}
                    onClick={() => {
                      fermer();
                      onAction?.();
                    }}
                    className={CLASSE_ACTION}
                  >
                    {toast.action.libelle}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={fermer}
                  aria-label="Fermer la notification"
                  className="-mr-1.5 inline-flex size-6 shrink-0 items-center justify-center rounded opacity-70 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-current"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
