import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { ApiError, declencherSynchronisation } from '../lib/api';
import { refetchAllApis } from '../lib/useApi';
import type { SynchronisationResultatDto } from '../types';

/** Bouton « Synchroniser les données » du pied de sidebar — admin seulement
 * (le rendu est gardé par `isAdmin` dans Layout, comme le module
 * Administration).
 *
 * Déclenche `POST /api/synchronisation` : rapatriement immédiat de ce que le
 * logiciel de bureau a écrit sur la base de référence, au lieu d'attendre le
 * cycle automatique. L'appel est SYNCHRONE côté backend — quelques secondes
 * en régime normal — d'où l'icône qui tourne et le bouton désactivé pendant
 * toute la durée du cycle. Un 409 (cycle déjà en cours, ou mono-base) n'est
 * pas une panne : le message du backend est montré tel quel.
 *
 * Au succès, les caches sont déjà vidés (toute mutation passe par
 * `clearApiCache`) ; `refetchAllApis()` re-lance alors chaque `useApi` monté
 * pour que la page affichée relise des données fraîches sans navigation. */
export default function SyncButton() {
  const [enCours, setEnCours] = useState(false);
  const [toast, setToast] = useState<{ message: string; erreur: boolean } | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  function montrerToast(message: string, erreur: boolean) {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    setToast({ message, erreur });
    // Le bilan est plus long à lire qu'une confirmation simple : 8 s.
    timerRef.current = window.setTimeout(() => setToast(null), 8000);
  }

  function bilan(r: SynchronisationResultatDto): string {
    const fusions = r.fusions ?? 0;
    const suppressions = r.suppressions ?? 0;
    const secondes = ((r.dureeMs ?? 0) / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
    if (fusions === 0 && suppressions === 0) {
      return `Synchronisation terminée (${secondes} s) — aucune modification à rapatrier.`;
    }
    const parts: string[] = [];
    if (fusions > 0) parts.push(`${fusions} ligne${fusions > 1 ? 's' : ''} mise${fusions > 1 ? 's' : ''} à jour`);
    if (suppressions > 0) parts.push(`${suppressions} supprimée${suppressions > 1 ? 's' : ''}`);
    let message = `Synchronisation terminée (${secondes} s) — ${parts.join(', ')}.`;
    if ((r.tablesEnEchec ?? 0) > 0) {
      message += ` ${r.tablesEnEchec} table${(r.tablesEnEchec ?? 0) > 1 ? 's' : ''} en échec, rejouée${(r.tablesEnEchec ?? 0) > 1 ? 's' : ''} au prochain cycle.`;
    }
    return message;
  }

  async function synchroniser() {
    setEnCours(true);
    try {
      const resultat = await declencherSynchronisation();
      // Les caches GET/valeurs sont déjà vidés par la mutation elle-même ;
      // reste à faire relire leurs données aux requêtes montées.
      refetchAllApis();
      montrerToast(bilan(resultat), false);
    } catch (err) {
      // 409 = cycle déjà en cours ou mono-base — le message du backend
      // précise le cas et se suffit. Idem 403.
      const message = err instanceof ApiError ? err.message : 'La synchronisation a échoué.';
      montrerToast(message, true);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Synchroniser les données"
        aria-label="Synchroniser les données"
        disabled={enCours}
        onClick={() => void synchroniser()}
      >
        <RefreshCw className={enCours ? 'animate-spin' : undefined} />
      </Button>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-lg px-4.5 py-3 text-label font-medium shadow-lg ${
            toast.erreur ? 'border border-destructive/40 bg-background text-destructive' : 'bg-foreground text-background'
          }`}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
