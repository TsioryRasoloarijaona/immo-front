import { ApiError } from '../../lib/api';
import { getReferentielsProjet } from '../../lib/apiProjet';
import { useApi } from '../../lib/useApi';
import type { ItemFiltre } from '../../components/liste/BoiteFiltre';
import type { ReferentielsProjetDto } from '../../types/projet';

/** Une fiche inconnue ou hors périmètre répond 404 : `data` reste nul, sans erreur. */
export function useFiche<T>(charger: () => Promise<T>, id: string) {
  return useApi<T | null>(
    () =>
      charger().catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }),
    [id],
  );
}

export function useReferentielsProjet() {
  return useApi<ReferentielsProjetDto>(getReferentielsProjet, [], 'projet-referentiels');
}

export function fournisseursItems(ref: ReferentielsProjetDto | null | undefined): ItemFiltre[] {
  return (ref?.fournisseurs ?? []).map((f) => ({ value: f.id, label: libelleReferentiel(f) }));
}

export function libelleReferentiel(e: { code: string | null; description: string | null }): string {
  return e.description ?? e.code ?? '—';
}
