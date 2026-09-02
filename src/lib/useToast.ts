import { useCallback, useEffect, useRef, useState } from 'react';

/** Message éphémère affiché en bas de page après une action réussie.
 *
 * Cette logique était copiée à l'identique dans `DossierDetail`,
 * `ProspectionDetail` et `Hotline`, chaque fois sous la forme :
 *
 * ```ts
 * setToast(msg);
 * setTimeout(() => setToast(null), 3600);
 * ```
 *
 * Deux défauts corrigés ici :
 *
 * 1. **Aucun nettoyage au démontage.** Quitter la page dans les 3,6 s laissait
 *    le minuteur écrire dans un composant démonté.
 * 2. **Minuteurs empilés.** Deux actions rapprochées créaient deux minuteurs :
 *    celui du premier message effaçait le second en avance. Le minuteur
 *    précédent est désormais annulé à chaque nouveau message.
 */
export function useToast(delayMs = 3600) {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const showToast = useCallback(
    (msg: string) => {
      clear();
      setToast(msg);
      timer.current = window.setTimeout(() => {
        setToast(null);
        timer.current = null;
      }, delayMs);
    },
    [clear, delayMs],
  );

  return { toast, showToast };
}
