import { ApiError, getDesistementDuDossier, type DesistementsFilterParams } from './api';
import { useApi } from './useApi';
import type { BadgeTone, DesistementDto, EtatDesistement } from '../types';

export type FiltresDesistements = {
  q: string;
  trancheId: string | null;
  demandeDu: string;
  demandeAu: string;
  validationDu: string;
  validationAu: string;
  legalisationDu: string;
  legalisationAu: string;
};

export const FILTRES_DESISTEMENTS_DEFAUT: FiltresDesistements = {
  q: '',
  trancheId: null,
  demandeDu: '',
  demandeAu: '',
  validationDu: '',
  validationAu: '',
  legalisationDu: '',
  legalisationAu: '',
};

export const PLAGES_DESISTEMENTS = [
  { label: 'Demande', du: 'demandeDu', au: 'demandeAu' },
  { label: 'Validation', du: 'validationDu', au: 'validationAu' },
  { label: 'Légalisation', du: 'legalisationDu', au: 'legalisationAu' },
] as const;

/** `q` est passé débouncé par la page. */
export function paramsDesistements(f: FiltresDesistements): DesistementsFilterParams {
  return {
    q: f.q.trim() || undefined,
    trancheId: f.trancheId ?? undefined,
    demandeDu: f.demandeDu || undefined,
    demandeAu: f.demandeAu || undefined,
    validationDu: f.validationDu || undefined,
    validationAu: f.validationAu || undefined,
    legalisationDu: f.legalisationDu || undefined,
    legalisationAu: f.legalisationAu || undefined,
  };
}

export function filtresDesistementsActifs(f: FiltresDesistements): boolean {
  return JSON.stringify(f) !== JSON.stringify(FILTRES_DESISTEMENTS_DEFAUT);
}

export const ETATS_DESISTEMENT: Record<EtatDesistement, { libelle: string; tone: BadgeTone }> = {
  BROUILLON: { libelle: 'Brouillon', tone: 'amber' },
  VALIDE: { libelle: 'Validé', tone: 'progress' },
  LEGALISE: { libelle: 'Légalisé', tone: 'success' },
};

/** La légalisation est exigée dès que la pénalité après remise n'est pas nulle (409/400 sinon). */
export function legalisationRequise(penaliteApresRemise: number | null | undefined): boolean {
  return (penaliteApresRemise ?? 0) !== 0;
}

/** Le désistement du dossier, ou `null` s'il n'en a pas (404). */
export function useDesistementDuDossier(dossierId: string) {
  return useApi<DesistementDto | null>(
    () =>
      getDesistementDuDossier(dossierId).catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }),
    [dossierId],
    'dossier-desistement',
  );
}
