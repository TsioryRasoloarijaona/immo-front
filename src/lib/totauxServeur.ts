import { useCallback, useMemo, useState } from 'react';
import type { ColonneDto, FonctionAgregat, TotauxListeDto, ValeurAgregat } from '../types';
import { fonctionsProposees, jetonAgregat } from './groupement';
import { useApi } from './useApi';

/** Prop `totauxServeur` de la grille : Σ calculés par le serveur sur tout le filtre, pas sur la page chargée.
 * Fournie, elle remplace le Σ client ; absente, la grille garde son Σ des lignes chargées. */
export interface TotauxServeurGrille {
  /** Jetons actifs (`jetonAgregat`), dans l'ordre où ils ont été cochés. */
  jetons: string[];
  /** Vide : la colonne n'a pas de Σ. */
  fonctions: (nom: string) => FonctionAgregat[];
  basculer: (nom: string, fonction: FonctionAgregat) => void;
  vider: () => void;
  nombreTotal: number | null;
  totaux: Partial<Record<string, ValeurAgregat>>;
  chargement: boolean;
  erreur: string | null;
  reessayer: () => void;
}

/** `cleFiltres` doit changer avec chaque filtre serveur de la liste (pas avec la page) : les totaux portent sur
 * le filtre entier. `actif` à `false` (mode groupé) : aucune requête, la sélection est conservée. */
export function useTotauxServeur(
  catalogue: ColonneDto[],
  charger: (agregats: string[]) => Promise<TotauxListeDto>,
  cleFiltres: string,
  actif: boolean,
  cacheKey: string,
): TotauxServeurGrille | undefined {
  const [jetons, setJetons] = useState<string[]>([]);

  const parNom = useMemo(() => new Map(catalogue.map((c) => [c.nom, fonctionsProposees(c)])), [catalogue]);
  // Une colonne retirée du catalogue ne doit pas laisser un jeton que le serveur refuserait en 400.
  const jetonsValides = useMemo(
    () => jetons.filter((j) => [...parNom].some(([nom, fs]) => fs.some((f) => jetonAgregat(nom, f) === j))),
    [jetons, parNom],
  );

  const demande = actif && jetonsValides.length > 0;
  const resultat = useApi(
    () => (demande ? charger(jetonsValides) : Promise.resolve(null)),
    [cleFiltres, jetonsValides.join('|'), demande],
    cacheKey,
  );

  const fonctions = useCallback((nom: string) => parNom.get(nom) ?? [], [parNom]);
  const basculer = useCallback((nom: string, fonction: FonctionAgregat) => {
    const jeton = jetonAgregat(nom, fonction);
    setJetons((js) => (js.includes(jeton) ? js.filter((j) => j !== jeton) : [...js, jeton]));
  }, []);
  const vider = useCallback(() => setJetons([]), []);
  const { refetch } = resultat;
  const reessayer = useCallback(() => void refetch(), [refetch]);

  if (!actif) return undefined;
  return {
    jetons: jetonsValides,
    fonctions,
    basculer,
    vider,
    nombreTotal: resultat.data?.nombreTotal ?? null,
    totaux: resultat.data?.totaux ?? {},
    chargement: demande && resultat.loading,
    erreur: demande ? resultat.error : null,
    reessayer,
  };
}
