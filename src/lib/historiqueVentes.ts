import type { DossierFilterParams } from './api';
import { DISPOSITION_HISTORIQUE_VENTES } from './dispositions';
import { OPTION_LIBRE, optionsStatuts } from './dossierListe';
import { CASCADE_VIDE, type SelectionCascade } from './cascadeTranches';
import type { ColonneDto } from '../types';
import type { StatutListeDossierDto } from '../types/dossierListe';

/** Option « Sans statut » du filtre : pas un code `StrStatus`, elle se traduit par `sansStatut=true`. */
const OPTION_SANS_STATUT = '__SANS_STATUT__';

export type ModeDate = 'PERIODE' | 'VIDE' | 'RENSEIGNEE';

/** Filtres de l'écran, tels que saisis (chaînes vides = absent). */
export type FiltresHistorique = SelectionCascade & {
  search: string;
  statuts: string[];
  champDate: string;
  modeDate: ModeDate;
  dateDebut: string;
  dateFin: string;
  totalMin: string;
  totalMax: string;
  commercial: string;
};

export const FILTRES_DEFAUT: FiltresHistorique = {
  ...CASCADE_VIDE,
  search: '',
  statuts: [],
  champDate: 'RESERVATION',
  modeDate: 'PERIODE',
  dateDebut: '',
  dateFin: '',
  totalMin: '',
  totalMax: '',
  commercial: '',
};

function nombreOuAbsent(saisie: string): number | undefined {
  const n = Number(saisie.replace(',', '.').replaceAll(' ', ''));
  return saisie.trim() === '' || Number.isNaN(n) ? undefined : n;
}

function filtreDate(f: FiltresHistorique): Pick<DossierFilterParams, 'champDate' | 'dateDebut' | 'dateFin' | 'dateVide'> {
  if (f.modeDate !== 'PERIODE') return { champDate: f.champDate, dateVide: f.modeDate === 'VIDE' };
  if (!f.dateDebut && !f.dateFin) return {};
  return {
    champDate: f.champDate,
    dateDebut: f.dateDebut ? `${f.dateDebut}T00:00:00` : undefined,
    dateFin: f.dateFin ? `${f.dateFin}T23:59:59` : undefined,
  };
}

/** Paramètres serveur, les mêmes pour la liste, les groupes, les Σ et l'export ; sortis toujours inclus. */
export function versParams(f: FiltresHistorique, trancheId: string[] | undefined): DossierFilterParams {
  const codes = f.statuts.filter((s) => s !== OPTION_SANS_STATUT);
  return {
    search: f.search || undefined,
    trancheId,
    statut: codes.length > 0 ? codes : undefined,
    sansStatut: f.statuts.includes(OPTION_SANS_STATUT) || undefined,
    commercial: f.commercial || undefined,
    totalMin: nombreOuAbsent(f.totalMin),
    totalMax: nombreOuAbsent(f.totalMax),
    inclureSortis: true,
    ...filtreDate(f),
  };
}

export function estModifie(f: FiltresHistorique): boolean {
  return JSON.stringify(f) !== JSON.stringify(FILTRES_DEFAUT);
}

/** Tous les statuts, sorties comprises, puis « Sans statut » (pas de lots libres ici). */
export function optionsStatutsHistorique(statuts: StatutListeDossierDto[]): { label: string; value: string }[] {
  return [
    ...optionsStatuts(statuts).filter((o) => o.value !== OPTION_LIBRE),
    { label: 'Sans statut', value: OPTION_SANS_STATUT },
  ];
}

/** Le catalogue des dossiers, avec pour défaut les colonnes ordonnées de l'Historique (celles absentes sont ignorées). */
export function catalogueHistorique(catalogue: ColonneDto[]): ColonneDto[] {
  const defaut = new Set(DISPOSITION_HISTORIQUE_VENTES.ordre);
  return catalogue.map((c) => ({ ...c, parDefaut: defaut.has(c.nom) }));
}
