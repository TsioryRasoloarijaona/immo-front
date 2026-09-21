import { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ApiError, declencherSynchronisation } from '../lib/api';
import { refetchAllApis } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import type { SynchronisationResultatDto } from '../types';

/** Les rôles auxquels le backend ouvre `POST /api/synchronisation` (spec du
 * 21/09, MB4) : l'Administrateur et les trois déclinaisons commerciales.
 * Tout autre rôle recevrait 403 — on ne lui montre pas un bouton qui ne peut
 * qu'échouer. */
const ROLES_SYNCHRONISATION = ['Administrateur', 'Commercial', 'Commercial Chef', 'Commercial Aide'];

/** Bouton flottant « Synchroniser » — bas droit de l'écran, au-dessus de la
 * feuille (MB4 : accessible aux commerciaux, et bien plus visible que
 * l'ancienne icône du pied de sidebar).
 *
 * Le choix de la pilule flottante plutôt qu'un emplacement de barre : le
 * geste est global (il rafraîchit *toutes* les données, pas celles d'une
 * page), transverse à la navigation, et occasionnel — exactement le profil
 * d'un bouton d'action flottant. La pilule porte son libellé en permanence :
 * une icône seule au même endroit se lirait comme un « rafraîchir la page »
 * quelconque, alors que ceci rapatrie ce que le logiciel de bureau a écrit.
 *
 * Déclenche `POST /api/synchronisation` : rapatriement immédiat depuis la
 * base de référence, au lieu d'attendre le cycle automatique (2 min).
 * L'appel est SYNCHRONE côté backend — quelques secondes — d'où l'icône qui
 * tourne et le bouton inerte pendant le cycle. Un 409 (cycle déjà en cours,
 * ou mono-base) n'est pas une panne : le message du backend est montré tel
 * quel.
 *
 * Au succès, les caches sont déjà vidés (toute mutation passe par
 * `clearApiCache`) ; `refetchAllApis()` re-lance chaque `useApi` monté pour
 * que la page affichée relise des données fraîches sans navigation. */
export default function SyncButton() {
  const { user } = useAuth();
  const [enCours, setEnCours] = useState(false);
  const [toast, setToast] = useState<{ message: string; erreur: boolean } | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const autorise = user?.roles?.some((r) => ROLES_SYNCHRONISATION.includes(r)) ?? false;
  if (!autorise) return null;

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
      <button
        type="button"
        title="Rapatrier les dernières écritures du logiciel de bureau"
        aria-label="Synchroniser les données"
        disabled={enCours}
        onClick={() => void synchroniser()}
        className={cn(
          'fixed bottom-5 right-5 z-40 flex h-10 items-center gap-2 rounded-full bg-foreground pl-3.5 pr-4.5',
          'text-label font-medium text-background shadow-lg transition-all duration-200',
          'hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand)',
          'disabled:translate-y-0 disabled:opacity-80',
        )}
      >
        <RefreshCw className={cn('size-4', enCours && 'animate-spin')} />
        {enCours ? 'Synchronisation…' : 'Synchroniser'}
      </button>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'fixed bottom-18 right-5 z-50 max-w-sm rounded-lg px-4.5 py-3 text-label font-medium shadow-lg',
            toast.erreur ? 'border border-destructive/40 bg-background text-destructive' : 'bg-foreground text-background',
          )}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}
