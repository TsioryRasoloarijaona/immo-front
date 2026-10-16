import { useState } from 'react';
import { listPreProspections, listProspections, type ProspectionFilterParams } from './api';
import type { OngletLeads } from './equipe';
import { useApi } from './useApi';
import type { ProspectionListItemDto } from '../types';

const TAILLE = 100;

export interface LeadsPagines {
  lignes: ProspectionListItemDto[];
  total: number;
  chargee: boolean;
  loading: boolean;
  error: string | null;
  afficherPlus: () => void;
}

/** Une liste de la fenêtre « Réaffecter », la plus récente d'abord ; « Afficher plus » ajoute la page suivante. */
export function useLeadsPagines(type: OngletLeads, filtre: ProspectionFilterParams): LeadsPagines {
  const [pages, setPages] = useState(1);
  const lister = type === 'pre' ? listPreProspections : listProspections;
  const liste = useApi(async () => {
    const lues = await Promise.all(
      Array.from({ length: pages }, (_, page) => lister(filtre, { page, size: TAILLE, sort: ['docDate,desc'] })),
    );
    return { lignes: lues.flatMap((p) => p.content), total: lues[0]?.totalElements ?? 0 };
  }, [type, JSON.stringify(filtre), pages]);

  return {
    lignes: liste.data?.lignes ?? [],
    total: liste.data?.total ?? 0,
    chargee: !liste.error && liste.data !== null,
    loading: liste.loading,
    error: liste.error,
    afficherPlus: () => setPages((p) => p + 1),
  };
}
