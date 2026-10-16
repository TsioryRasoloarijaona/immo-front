import { useCallback, useMemo, useState } from 'react';
import type {
  ColonneDto,
  FonctionAgregat,
  GranulariteGroupe,
  GroupeDto,
  PageDto,
  PageGroupesDto,
  TriGroupes,
  TypeColonne,
  ValeurAgregat,
} from '../types';
import { formatCurrency, formatDate, formatNumber } from './format';
import type { ParamsDepliage, ParamsGroupes } from './api';
import type { GroupementGrille } from '../components/DataGrid';

/* Le serveur groupe (`/groupes`) car les listes sont paginées : grouper la page chargée fausserait effectifs et
   totaux. Le groupement n'est pas persisté : le retrouver en revenant ferait croire à une liste tronquée. */

/** Des taux, pas des quantités : seule leur somme est écartée, moyenne, min et max restent proposés.
 * Le serveur accepte la somme ; c'est à l'affichage de savoir qu'elle n'informe pas. */
export const SOMMES_SANS_SENS = new Set(['remise', 'probabiliteFinalisation']);

export const LIBELLES_FONCTION: Record<FonctionAgregat, string> = {
  SUM: 'Somme',
  AVG: 'Moyenne',
  MIN: 'Minimum',
  MAX: 'Maximum',
  COUNT: 'Nombre',
};

/** Libellés de la bande des totaux, où plusieurs résumés s'empilent sous une colonne étroite. */
export const LIBELLES_COURTS_FONCTION: Record<FonctionAgregat, string> = {
  SUM: 'Somme',
  AVG: 'Moy.',
  MIN: 'Min',
  MAX: 'Max',
  COUNT: 'Nb',
};

/** `COUNT` est toujours un entier, hors unité de la colonne (donc sans `formatValeur`).
 * Sur une colonne DATE le serveur renvoie une chaîne ISO. `null` (MIN/MAX sans valeur)
 * s'affiche en tiret, jamais « 0 ». */
export function formatAgregat(
  valeur: ValeurAgregat | undefined,
  formatValeur: ((valeur: unknown) => string) | undefined,
  fonction: FonctionAgregat,
  type: TypeColonne,
): string {
  if (valeur === null || valeur === undefined) return '—';
  if (fonction === 'COUNT') return formatNumber(Number(valeur));
  if (formatValeur) return formatValeur(valeur);
  if (type === 'DATE') return formatDate(String(valeur));
  if (typeof valeur !== 'number') return String(valeur);
  return type === 'MONTANT' ? formatCurrency(valeur) : formatNumber(valeur, 2);
}

/** Fonctions du menu Σ d'une colonne : celles du catalogue, moins la somme d'un taux. */
export function fonctionsProposees(c: ColonneDto): FonctionAgregat[] {
  return (c.fonctions ?? []).filter((f) => !(f === 'SUM' && SOMMES_SANS_SENS.has(c.nom)));
}

/** Contrat serveur : un nom nu vaut une somme, et la clé de retour est alors ce même nom nu. */
export function jetonAgregat(nom: string, fonction: FonctionAgregat): string {
  return fonction === 'SUM' ? nom : `${nom}:${fonction}`;
}

export function decomposerJeton(jeton: string): { nom: string; fonction: FonctionAgregat } {
  const i = jeton.indexOf(':');
  if (i === -1) return { nom: jeton, fonction: 'SUM' };
  return { nom: jeton.slice(0, i), fonction: jeton.slice(i + 1) as FonctionAgregat };
}

/** Déclarées `groupable` par le serveur mais nulles par définition sur les pré-prospections
 * (`CfgProspectId IS NULL AND CfgCommercialId IS NULL`) : un groupe unique sans valeur, sans information. */
export const GROUPEMENTS_SANS_INTERET: Partial<Record<string, Set<string>>> = {
  'pre-prospections': new Set(['prospectNom', 'commercialNom']),
};

/** Le groupe des lignes **sans valeur** n'a pas de libellé serveur. */
export const LIBELLE_GROUPE_VIDE = '(non renseigné)';

/** `libelleGroupe` ne traduit que l'affichage : la clé envoyée au serveur reste le code brut. */
export function libelleGroupeAffiche(g: GroupeDto, libelleGroupe?: (brut: string) => string): string {
  if (g.libelle == null) return LIBELLE_GROUPE_VIDE;
  return libelleGroupe ? libelleGroupe(g.libelle) : g.libelle;
}

/** `null` est une valeur de groupe légitime, à distinguer de la chaîne « null » qu'une colonne texte peut porter. */
export function identiteGroupe(g: GroupeDto): string {
  return g.cle == null ? ' vide' : String(g.cle);
}

/** Contrat serveur : `?groupeValeur=` omis désigne le groupe sans valeur. */
export function valeurGroupe(cle: GroupeDto['cle']): string | undefined {
  return cle == null ? undefined : String(cle);
}

export const GRANULARITES: { valeur: GranulariteGroupe; libelle: string }[] = [
  { valeur: 'JOUR', libelle: 'Par jour' },
  { valeur: 'MOIS', libelle: 'Par mois' },
  { valeur: 'ANNEE', libelle: 'Par année' },
];

export const TRIS: { valeur: TriGroupes; libelle: string }[] = [
  { valeur: 'LIBELLE', libelle: 'Alphabétique' },
  { valeur: 'NOMBRE', libelle: 'Les plus nombreux en tête' },
];

/** Sur une colonne date, `LIBELLE` trie des clés ISO : l'ordre est chronologique. */
export function libelleTri(t: TriGroupes, estDate: boolean): string {
  if (t === 'LIBELLE' && estDate) return 'Chronologique';
  return TRIS.find((x) => x.valeur === t)?.libelle ?? t;
}

export type EtatGroupement = ReturnType<typeof useGroupement>;

/** `groupable`/`agregeable` se lisent dans le catalogue, jamais déduits du type (un `NOMBRE` peut être non agrégeable).
 * `auChangement` : les écrans y remettent leur pagination à zéro, sinon une page au-delà des groupes reste vide ;
 * `basculerAgregat` ne l'appelle pas, il ne change ni le nombre ni l'ordre des groupes. */
export function useGroupement(
  cleEcran: string,
  catalogue: ColonneDto[],
  auChangement?: () => void,
) {
  const [colonne, setColonne] = useState<string | null>(null);
  const [granularite, setGranularite] = useState<GranulariteGroupe>('MOIS');
  const [tri, setTri] = useState<TriGroupes>('LIBELLE');
  const [agregats, setAgregats] = useState<string[]>([]);

  const exclues = GROUPEMENTS_SANS_INTERET[cleEcran];

  const groupables = useMemo(
    () => catalogue.filter((c) => c.groupable && !exclues?.has(c.nom)),
    [catalogue, exclues],
  );
  const agregeables = useMemo(
    () =>
      catalogue
        .map((c) => ({ colonne: c, fonctions: fonctionsProposees(c) }))
        .filter((x) => x.fonctions.length > 0),
    [catalogue],
  );

  /* Résolue contre le catalogue : une colonne choisie puis disparue ne laisse pas un `groupBy` que le serveur
     refuserait en 400. */
  const colonneGroupee = useMemo(
    () => groupables.find((c) => c.nom === colonne) ?? null,
    [groupables, colonne],
  );
  const actif = colonneGroupee !== null;
  const estDate = colonneGroupee?.type === 'DATE';

  /** La même granularité doit partir vers `/groupes` et vers la liste dépliée : sinon le groupe déplié revient
   * vide, en HTTP 200, sans message. D'où une seule dérivation ici. */
  const granulariteEffective = estDate ? granularite : undefined;

  const paramsGroupes = useMemo<ParamsGroupes | null>(
    () =>
      colonneGroupee
        ? {
            groupBy: colonneGroupee.nom,
            agregats: agregats.length > 0 ? agregats : undefined,
            granularite: granulariteEffective,
            tri,
            /* Jamais laissé au défaut serveur `false`, qui retire en silence les lignes sans valeur et casse
               l'égalité somme des effectifs = `totalElements` dont dépend l'écran. */
            inclureSansValeur: true,
          }
        : null,
    [colonneGroupee, agregats, granulariteEffective, tri],
  );

  /** `granularite` doit être répétée : le serveur rejoue le découpage, et sans elle rend `totalElements: 0`
   * en HTTP 200. */
  const depliagePour = useCallback(
    (cle: GroupeDto['cle']): ParamsDepliage | undefined =>
      colonneGroupee
        ? {
            groupeColonne: colonneGroupee.nom,
            groupeValeur: valeurGroupe(cle),
            granularite: granulariteEffective,
          }
        : undefined,
    [colonneGroupee, granulariteEffective],
  );

  const cleDeps = useMemo(() => JSON.stringify(paramsGroupes), [paramsGroupes]);

  const choisirColonne = useCallback(
    (nom: string | null) => {
      setColonne(nom);
      auChangement?.();
    },
    [auChangement],
  );

  const changerGranularite = useCallback(
    (g: GranulariteGroupe) => {
      setGranularite(g);
      auChangement?.();
    },
    [auChangement],
  );

  const changerTri = useCallback(
    (t: TriGroupes) => {
      setTri(t);
      auChangement?.();
    },
    [auChangement],
  );

  const basculerAgregat = useCallback((nom: string, fonction: FonctionAgregat) => {
    const jeton = jetonAgregat(nom, fonction);
    setAgregats((a) => (a.includes(jeton) ? a.filter((j) => j !== jeton) : [...a, jeton]));
  }, []);

  const reinitialiser = useCallback(() => {
    setColonne(null);
    setAgregats([]);
    auChangement?.();
  }, [auChangement]);

  return {
    groupables,
    agregeables,
    colonne,
    colonneGroupee,
    actif,
    estDate,
    granularite,
    tri,
    agregats,
    /** Résolus avec leur colonne : le formatage dépend du type (un `MIN` sur une date rend une chaîne ISO). */
    agregatsActifs: useMemo(
      () =>
        agregats
          .map((jeton) => {
            const { nom, fonction } = decomposerJeton(jeton);
            const colonne = catalogue.find((c) => c.nom === nom);
            return colonne ? { jeton, colonne, fonction } : null;
          })
          .filter((x): x is { jeton: string; colonne: ColonneDto; fonction: FonctionAgregat } => x !== null),
      [agregats, catalogue],
    ),
    paramsGroupes,
    depliagePour,
    cleDeps,
    choisirColonne,
    changerGranularite,
    changerTri,
    basculerAgregat,
    reinitialiser,
  };
}

/** Prop `groupes` de la grille, montée de la même façon par toutes les listes groupables.
 * `libelles` : traduction d'affichage par colonne groupée (ex. `statut` → libellé canonique).
 * `actif` : à passer quand l'écran peut bloquer un groupement choisi ; `undefined` rendu, la grille lit `rows`. */
export function groupesGrille<T>(
  groupement: EtatGroupement,
  page: PageGroupesDto | null | undefined,
  lignes: ReturnType<typeof useLignesGroupes<T>>,
  libelles: Partial<Record<string, (brut: string) => string>> = {},
  actif: boolean = groupement.actif,
): GroupementGrille<T> | undefined {
  const colonne = groupement.colonneGroupee;
  if (!actif || !colonne) return undefined;
  return {
    liste: page?.content ?? [],
    colonneLibelle: colonne.libelle,
    libelleGroupe: libelles[colonne.nom],
    agregats: groupement.agregatsActifs,
    totaux: page?.totaux ?? {},
    nombreTotal: page?.nombreTotal ?? 0,
    estOuvert: lignes.estOuvert,
    etat: lignes.etat,
    basculer: lignes.basculer,
    chargerPlus: lignes.chargerPlus,
    lignesChargees: lignes.lignesChargees,
  };
}

export interface LignesGroupe<T> {
  lignes: T[];
  /** Effectif serveur du groupe, qui peut dépasser les lignes chargées. */
  total: number;
  chargement: boolean;
  erreur: string | null;
}

/** Un groupe n'est pas borné : tout charger à l'ouverture gèlerait l'écran. Lot = taille de page de la liste. */
export const TAILLE_LOT_GROUPE = 20;

/** Plusieurs groupes peuvent être ouverts à la fois, d'où un dictionnaire.
 * `cleReset` doit changer avec l'axe, la granularité et les filtres : les lignes chargées sont alors jetées. */
export function useLignesGroupes<T>(
  charger: (cle: GroupeDto['cle'], taille: number) => Promise<PageDto<T>>,
  cleReset: string,
) {
  const [etats, setEtats] = useState<Partial<Record<string, LignesGroupe<T>>>>({});

  /* Remise à zéro pendant le rendu, pas dans un effet : évite une frame avec les lignes de l'ancien groupement
     sous les en-têtes du nouveau, et `react-hooks/set-state-in-effect`. */
  const [precedent, setPrecedent] = useState(cleReset);
  if (precedent !== cleReset) {
    setPrecedent(cleReset);
    setEtats({});
  }

  /* Volontairement non mémoïsées : elles doivent lire `charger` au moment du clic, il se referme sur les
     filtres courants de l'écran. */
  const recuperer = (g: GroupeDto, taille: number) => {
    const id = identiteGroupe(g);
    setEtats((e) => ({
      ...e,
      [id]: { lignes: e[id]?.lignes ?? [], total: e[id]?.total ?? g.nombre, chargement: true, erreur: null },
    }));
    charger(g.cle, taille).then(
      (page) =>
        setEtats((e) => ({
          ...e,
          [id]: { lignes: page.content, total: page.totalElements, chargement: false, erreur: null },
        })),
      (err: unknown) =>
        setEtats((e) => ({
          ...e,
          [id]: {
            lignes: e[id]?.lignes ?? [],
            total: e[id]?.total ?? g.nombre,
            chargement: false,
            erreur: err instanceof Error ? err.message : 'Chargement impossible.',
          },
        })),
    );
  };

  const basculer = (g: GroupeDto) => {
    const id = identiteGroupe(g);
    if (etats[id]) {
      // Replier jette les lignes : les garder ferait diverger l'affichage si les filtres ont bougé entre-temps.
      setEtats((e) => {
        const suivant = { ...e };
        delete suivant[id];
        return suivant;
      });
      return;
    }
    recuperer(g, TAILLE_LOT_GROUPE);
  };

  const chargerPlus = (g: GroupeDto) => {
    const etat = etats[identiteGroupe(g)];
    /* Une page plus grande plutôt que des pages concaténées : ni doublon ni trou si une ligne change de groupe.
       Suppose un ordre déterministe, que le serveur ne garantit pas sur les ex æquo : l'écran doit passer un
       `sort` qui tranche. */
    recuperer(g, (etat?.lignes.length ?? 0) + TAILLE_LOT_GROUPE);
  };

  return {
    estOuvert: (g: GroupeDto) => etats[identiteGroupe(g)] !== undefined,
    etat: (g: GroupeDto): LignesGroupe<T> | undefined => etats[identiteGroupe(g)],
    lignesChargees: useMemo(() => Object.values(etats).flatMap((e) => e?.lignes ?? []), [etats]),
    basculer,
    chargerPlus,
  };
}
