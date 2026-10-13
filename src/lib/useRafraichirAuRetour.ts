import { useEffect, useRef } from 'react';
import { oublierLecturesRecentes } from './api';

/** Au moins 2 s entre deux relectures : `visibilitychange` et `focus` arrivent souvent ensemble. */
const ECART_MIN_MS = 2000;

/**
 * Relit l'écran quand l'utilisateur revient sur l'onglet ou la fenêtre : une action faite ailleurs
 * (autre onglet, autre écran) s'y voit sans rafraîchissement périodique (FEATURE-tri-a-jour.md §Règle 3).
 */
export function useRafraichirAuRetour(refetch: () => Promise<void>): void {
  const refetchRef = useRef(refetch);
  const dernier = useRef(0);

  useEffect(() => {
    refetchRef.current = refetch;
  });

  useEffect(() => {
    // Le montage vient de lire : pas de seconde lecture immédiate.
    dernier.current = Date.now();
    function auRetour() {
      if (document.visibilityState !== 'visible') return;
      const maintenant = Date.now();
      if (maintenant - dernier.current < ECART_MIN_MS) return;
      dernier.current = maintenant;
      // Sinon le cache GET de 30 s (api.ts) rendrait la réponse d'avant le départ.
      oublierLecturesRecentes();
      void refetchRef.current();
    }
    document.addEventListener('visibilitychange', auRetour);
    globalThis.addEventListener('focus', auRetour);
    return () => {
      document.removeEventListener('visibilitychange', auRetour);
      globalThis.removeEventListener('focus', auRetour);
    };
  }, []);
}
