import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ApiError, declencherSynchronisation } from '../lib/api';
import { useToast } from '../lib/toastContext';
import { refetchAllApis } from '../lib/useApi';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import type { SynchronisationResultatDto } from '../types';

/** Doit refléter les rôles que le backend ouvre à `POST /api/synchronisation` :
 * tout autre rôle recevrait 403. */
const ROLES_SYNCHRONISATION = ['Administrateur', 'Commercial', 'Commercial Chef', 'Commercial Aide'];

/** L'appel est synchrone côté backend (quelques secondes) : bouton inerte pendant le cycle. */
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
      // Les caches sont déjà vidés par la mutation ; reste à faire relire les `useApi` montés.
      refetchAllApis();
      montrerToast(bilan(resultat), false);
    } catch (err) {
      // 409 = cycle déjà en cours ou mono-base, pas une panne : message backend tel quel.
      const message = err instanceof ApiError ? err.message : 'La synchronisation a échoué.';
      montrerToast(message, true);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button
      type="button"
      title="Rapatrier les dernières écritures du logiciel de bureau"
      aria-label="Synchroniser les données"
      disabled={enCours}
      onClick={() => void synchroniser()}
      className={cn(
        'flex h-7.5 items-center gap-1.5 rounded-md border border-border bg-card px-2.5',
        'text-xs font-medium whitespace-nowrap text-foreground transition-colors duration-150',
        'hover:bg-(--surface-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--brand)',
        'disabled:opacity-70',
      )}
    >
      <RefreshCw className={cn('size-3.5 shrink-0', enCours && 'animate-spin')} />
      {enCours ? 'Synchronisation…' : 'Synchroniser'}
    </button>
  );
}
