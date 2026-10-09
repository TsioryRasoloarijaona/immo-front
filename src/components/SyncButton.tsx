import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ApiError, declencherSynchronisation } from '../lib/api';
import { useToast } from '../lib/toastContext';
import { refetchAllApis } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import type { SynchronisationResultatDto } from '../types';

/** Les rôles auxquels le backend ouvre `POST /api/synchronisation` (spec du
 * 21/09, MB4) : l'Administrateur et les trois déclinaisons commerciales.
 * Tout autre rôle recevrait 403 — on ne lui montre pas un bouton qui ne peut
 * qu'échouer. */
const ROLES_SYNCHRONISATION = ['Administrateur', 'Commercial', 'Commercial Chef', 'Commercial Aide'];

/** Bouton « Synchroniser » du pied de sidebar (MB4 : accessible aux
 * commerciaux, et bien plus visible que l'ancienne icône seule).
 *
 * L'emplacement a été décidé en deux temps : une pilule flottante bas droit
 * a été essayée puis retirée — elle recouvrait la pagination des listes,
 * qui vit exactement là. Le pied de sidebar est l'endroit qui reste visible
 * sur toutes les pages sans jamais rien recouvrir ; le bouton y est pleine
 * largeur, encre sur fond clair, pour rester un vrai geste et non une icône
 * anonyme. Rail replié : l'icône seule, centrée.
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
  const toast = useToast();

  const autorise = user?.roles?.some((r) => ROLES_SYNCHRONISATION.includes(r)) ?? false;
  if (!autorise) return null;

  function montrerToast(message: string, erreur: boolean) {
    toast({ texte: message, variante: erreur ? 'erreur' : 'succes' });
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
          'flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-foreground px-3',
          'text-label font-medium text-background shadow-sm transition-opacity duration-200',
          'hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand)',
          'disabled:opacity-80',
          'group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:self-center group-data-[collapsible=icon]:px-0',
        )}
      >
        <RefreshCw className={cn('size-4 shrink-0', enCours && 'animate-spin')} />
        <span className="group-data-[collapsible=icon]:hidden">{enCours ? 'Synchronisation…' : 'Synchroniser'}</span>
      </button>
    </>
  );
}
