import { ApiError } from '../../../lib/api';
import { getSuiviLot } from '../../../lib/apiProjet';
import { useApi } from '../../../lib/useApi';
import type { SuiviLotDto } from '../../../types/projet';

/** Chargé une seule fois, à la première ouverture de Suivi ou Retenues ; 404 → `data` null. */
export function useSuiviLot(lotId: string, demande: boolean) {
  const etat = useApi<SuiviLotDto | null>(() => {
    if (!demande) return Promise.resolve(null);
    return getSuiviLot(lotId).catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    });
  }, [lotId, demande]);
  return { ...etat, loading: etat.loading || !demande };
}
