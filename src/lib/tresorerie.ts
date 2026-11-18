import { useState } from 'react';
import { ApiError, DEFAULT_PAGE_SIZE } from './api';
import { useDebouncedValue } from './useApi';
import type { DateTresorerie, FiltresTresorerie, ModuleTresorerie, VueRecette } from '../types/tresorerie';

export const VUES_RECETTES: VueRecette[] = ['proforma', 'factures', 'avoirs', 'encaissements'];

export const LIBELLES_STATUT_TRESORERIE: Record<string, string> = {
  IN_WORK: 'En cours',
  POINTED: 'Pointé',
  NOTPAYED: 'Non payé',
  CANCELED: 'Annulé',
};

export const ITEMS_STATUT_TRESORERIE = Object.entries(LIBELLES_STATUT_TRESORERIE).map(([value, label]) => ({ value, label }));

export const ITEMS_DATE_TRESORERIE: { value: DateTresorerie; label: string }[] = [
  { value: 'PIECE', label: 'Date de la pièce' },
  { value: 'ECHEANCE', label: 'Échéance' },
  { value: 'POINTAGE', label: 'Date de pointage' },
  { value: 'POINTAGE_REPORTE', label: 'Pointage reporté' },
];

export function libelleStatutTresorerie(statut: string | null, libelle?: string | null): string {
  return (statut && LIBELLES_STATUT_TRESORERIE[statut]) || libelle || statut || '—';
}

/** Un 403 du serveur (module hors droits) s'affiche en clair plutôt que le message technique. */
export function accesRefuse<T>(promesse: Promise<T>): Promise<T> {
  return promesse.catch((e: unknown) => {
    if (e instanceof ApiError && e.status === 403) throw new Error('Accès refusé');
    throw e;
  });
}

export interface EtatFiltresTresorerie {
  societeId: string | null;
  projetIds: string[];
  sansProjet: boolean;
  dateSur: DateTresorerie;
  du: string;
  au: string;
  statuts: string[];
  inclureAnnules: boolean;
  recherche: string;
}

const ETAT_INITIAL: EtatFiltresTresorerie = {
  societeId: null,
  projetIds: [],
  sansProjet: false,
  dateSur: 'PIECE',
  du: '',
  au: '',
  statuts: [],
  inclureAnnules: true,
  recherche: '',
};

export function filtresActifs(e: EtatFiltresTresorerie): boolean {
  return (
    e.societeId !== null ||
    e.projetIds.length > 0 ||
    e.sansProjet ||
    e.dateSur !== 'PIECE' ||
    !!e.du ||
    !!e.au ||
    e.statuts.length > 0 ||
    !e.inclureAnnules ||
    !!e.recherche
  );
}

/** Filtres d'une liste de trésorerie : tout changement de filtre revient à la page 0. */
export function useFiltresTresorerie(module: ModuleTresorerie) {
  const [etat, setEtat] = useState(ETAT_INITIAL);
  const [page, setPage] = useState(0);
  const recherche = useDebouncedValue(etat.recherche.trim());

  function changer(partiel: Partial<EtatFiltresTresorerie>) {
    setPage(0);
    setEtat((e) => ({ ...e, ...partiel }));
  }

  const filtres: FiltresTresorerie = {
    module,
    societeId: etat.societeId ?? undefined,
    projetIds: etat.projetIds.length > 0 ? etat.projetIds : undefined,
    sansProjet: etat.sansProjet ? true : undefined,
    dateSur: etat.dateSur,
    du: etat.du || undefined,
    au: etat.au || undefined,
    statuts: etat.statuts.length > 0 ? etat.statuts : undefined,
    inclureAnnules: etat.inclureAnnules ? undefined : false,
    recherche: recherche || undefined,
    page,
    taille: DEFAULT_PAGE_SIZE,
  };

  return { etat, changer, reinitialiser: () => changer(ETAT_INITIAL), page, setPage, filtres };
}
