import { useCallback, useMemo, useState } from 'react';
import type { ColonneDto, GranulariteGroupe, GroupeDto, PageDto, TriGroupes } from '../types';
import type { ParamsDepliage, ParamsGroupes } from './api';

/** État de la bande de groupement d'une liste.
 *
 * Le **serveur** fait le groupement (`/groupes`) parce que les listes sont
 * paginées : grouper la page chargée ne grouperait qu'elle, et les effectifs
 * comme les totaux seraient faux. Ce fichier ne porte donc que le choix de
 * l'utilisateur et sa traduction en paramètres de requête — aucun calcul.
 *
 * Pas de composant ici, et c'est volontaire : co-loger une constante avec un
 * composant déclenche `react-refresh/only-export-components`, ce qui a déjà
 * coûté une erreur eslint à ce dépôt. Le mécanisme vit dans `lib/`, le rendu
 * dans `components/`.
 *
 * **Le groupement n'est pas persisté**, contrairement à la sélection de
 * colonnes. Une sélection de colonnes est une préférence d'affichage durable ;
 * un groupement est une question qu'on pose une fois. Le retrouver intact en
 * revenant sur l'écran ferait croire à une liste tronquée. */

/** Colonnes que le serveur déclare `agregeable` mais qu'il ne faut **pas**
 * proposer à la somme, parce que le total n'aurait aucun sens métier.
 *
 * Ce ne sont pas des quantités mais des **taux**, et additionner des taux ne
 * produit rien d'interprétable. Mesuré sur les 116 dossiers réels :
 *
 * - `remise` est un **ratio 0–1** (0,068783 ; 0,153439 ; et des valeurs
 *   négatives, qui sont des majorations). Sa somme par statut vaut 1,88 /
 *   4,97 / 0,29 : des nombres que rien à l'écran ne permettrait de lire.
 * - `probabiliteFinalisation` vaut **1 sur les 116 lignes**. Sa somme est donc
 *   exactement l'effectif du groupe, déjà affiché à côté — une colonne de
 *   totaux qui répète le décompte en se faisant passer pour autre chose.
 *
 * Le serveur a raison de les accepter : la somme est techniquement calculable,
 * et c'est à l'affichage de savoir qu'elle n'informe pas. Une moyenne serait
 * l'agrégat juste pour un taux, mais l'endpoint ne sert que des sommes. */
export const AGREGATS_SANS_SENS = new Set(['remise', 'probabiliteFinalisation']);

/** Colonnes à ne pas proposer au groupement sur un écran donné, alors que le
 * serveur les déclare `groupable`.
 *
 * Cas unique aujourd'hui : sur les **pré-prospections**, `prospectNom` et
 * `commercialNom` sont nuls par définition du périmètre
 * (`CfgProspectId IS NULL AND CfgCommercialId IS NULL`). Le serveur les accepte
 * plutôt que d'ajouter un cas particulier, et renvoie un groupe unique sans
 * valeur : exact, mais sans information. Autant ne pas les offrir. */
export const GROUPEMENTS_SANS_INTERET: Record<string, Set<string>> = {
  'pre-prospections': new Set(['prospectNom', 'commercialNom']),
};

/** Le groupe des lignes **sans valeur** n'a pas de libellé serveur. */
export const LIBELLE_GROUPE_VIDE = '(non renseigné)';

export function libelleGroupeAffiche(g: GroupeDto): string {
  return g.libelle ?? LIBELLE_GROUPE_VIDE;
}

/** Clé React stable. `null` est une valeur de groupe légitime et doit se
 * distinguer de la chaîne « null », qu'une colonne texte pourrait porter. */
export function identiteGroupe(g: GroupeDto): string {
  return g.cle === null || g.cle === undefined ? ' vide' : String(g.cle);
}

/** Ce qui part dans `?groupeValeur=`. `undefined` — donc paramètre omis —
 * désigne le groupe sans valeur : c'est le contrat du serveur. */
export function valeurGroupe(cle: GroupeDto['cle']): string | undefined {
  return cle === null || cle === undefined ? undefined : String(cle);
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

export type EtatGroupement = ReturnType<typeof useGroupement>;

/**
 * @param cleEcran identifie l'écran pour `GROUPEMENTS_SANS_INTERET`.
 * @param catalogue catalogue **brut** du serveur ; `groupable` et `agregeable`
 *   s'y lisent, ils ne se déduisent ni du type ni du nom — mesuré,
 *   `joursInactivite` est un `NOMBRE` non agrégeable.
 * @param auChangement appelé quand le **jeu de groupes** change — changement
 *   d'axe, de granularité, d'ordre. Les écrans y remettent leur pagination à
 *   zéro : rester page 7 en passant de 38 groupes à 5 afficherait un écran
 *   vide. Pas appelé par `basculerAgregat`, qui ajoute une colonne de totaux
 *   sans toucher ni au nombre de groupes ni à leur ordre.
 */
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
    () => catalogue.filter((c) => c.agregeable && !AGREGATS_SANS_SENS.has(c.nom)),
    [catalogue],
  );

  /* Le catalogue arrive de façon asynchrone : tant qu'il est vide, aucune
     colonne ne « correspond », et `actif` reste faux. Une colonne choisie puis
     disparue du catalogue ne laisse donc pas un `groupBy` que le serveur
     refuserait en 400. */
  const colonneGroupee = useMemo(
    () => groupables.find((c) => c.nom === colonne) ?? null,
    [groupables, colonne],
  );
  const actif = colonneGroupee !== null;
  const estDate = colonneGroupee?.type === 'DATE';

  /** Une seule granularité circule, et elle doit être **la même** des deux
   * côtés. La dériver ici plutôt qu'à chaque site d'appel est ce qui empêche
   * la liste et les groupes de diverger — l'oubli rend un groupe déplié
   * vide, en HTTP 200, sans le moindre message. */
  const granulariteEffective = estDate ? granularite : undefined;

  const paramsGroupes = useMemo<ParamsGroupes | null>(
    () =>
      colonneGroupee
        ? {
            groupBy: colonneGroupee.nom,
            agregats: agregats.length > 0 ? agregats : undefined,
            granularite: granulariteEffective,
            tri,
            /* Toujours `true`, jamais laissé au défaut serveur.
               Voir `ParamsGroupes.inclureSansValeur` : le défaut `false`
               retire les lignes sans valeur des groupes **sans les signaler
               nulle part**. Mesuré, grouper les dossiers par avocat
               n'afficherait plus que 23 lignes sur 116.
               C'est aussi ce qui maintient l'égalité somme des effectifs =
               `totalElements`, sur laquelle repose tout l'écran. */
            inclureSansValeur: true,
          }
        : null,
    [colonneGroupee, agregats, granulariteEffective, tri],
  );

  /** Les paramètres qui restreignent la **liste** aux lignes d'un groupe.
   *
   * `granularite` y est répétée à l'identique : le serveur rejoue le découpage
   * pour retrouver les lignes, et une clé annuelle confrontée à un découpage
   * mensuel ne correspond à rien. Mesuré, cet oubli rend `totalElements: 0`
   * en **HTTP 200**. */
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

  /** Clé de dépendance pour `useApi`, et clé de remise à zéro des groupes
   * dépliés : elle change dès que la requête de groupement change, et
   * seulement là. */
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

  const basculerAgregat = useCallback((nom: string) => {
    setAgregats((a) => (a.includes(nom) ? a.filter((n) => n !== nom) : [...a, nom]));
  }, []);

  const reinitialiser = useCallback(() => {
    setColonne(null);
    setAgregats([]);
    auChangement?.();
  }, [auChangement]);

  return {
    /** Colonnes proposables au groupement, telles que le serveur les déclare. */
    groupables,
    /** Colonnes sommables, purgées des taux (voir `AGREGATS_SANS_SENS`). */
    agregeables,
    colonne,
    colonneGroupee,
    /** Vrai dès qu'une colonne du catalogue est effectivement groupée. */
    actif,
    estDate,
    granularite,
    tri,
    agregats,
    /** Les colonnes sommées, dans l'ordre du catalogue — une bande de totaux
     * chacune dans l'en-tête de groupe. */
    colonnesAgregats: useMemo(
      () => agregeables.filter((c) => agregats.includes(c.nom)),
      [agregeables, agregats],
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

/** Les lignes chargées pour un groupe déplié. */
export interface LignesGroupe<T> {
  lignes: T[];
  /** Effectif total du groupe côté serveur, qui peut dépasser ce qui est
   * chargé — d'où le bouton « en charger davantage ». */
  total: number;
  chargement: boolean;
  erreur: string | null;
}

/** Combien de lignes on demande à chaque fois qu'un groupe s'ouvre, puis à
 * chaque « charger plus ».
 *
 * Un groupe n'est pas borné : mesuré, « 1 A TRAITER » compte **3 145**
 * prospections. Tout charger à l'ouverture gèlerait l'écran pour une
 * information que personne ne lit d'un coup. Le lot vaut la taille de page de
 * la liste, pour que déplier un groupe coûte exactement ce que coûte une page
 * ordinaire. */
export const TAILLE_LOT_GROUPE = 20;

/** Les groupes dépliés et leurs lignes.
 *
 * **Plusieurs groupes peuvent être ouverts en même temps**, comme dans le
 * logiciel de bureau : chacun garde son propre lot de lignes chargées, son
 * total et son erreur. C'est la raison pour laquelle l'état est un
 * dictionnaire et non un identifiant unique.
 *
 * @param charger fourni par l'écran ; il seul connaît ses filtres et son
 *   endpoint. Reçoit la clé du groupe et le nombre de lignes voulues.
 * @param cleReset toute chaîne qui change quand les groupes changent de sens —
 *   axe, granularité, filtres. Les lignes déjà chargées appartiendraient alors
 *   à d'autres groupes : elles sont jetées.
 */
export function useLignesGroupes<T>(
  charger: (cle: GroupeDto['cle'], taille: number) => Promise<PageDto<T>>,
  cleReset: string,
) {
  const [etats, setEtats] = useState<Record<string, LignesGroupe<T>>>({});

  /* Remise à zéro **pendant le rendu**, pas dans un effet : c'est le patron
     que React documente pour un état dérivé d'une entrée qui change, et il
     évite le rendu intermédiaire où l'on afficherait les lignes de l'ancien
     groupement sous les en-têtes du nouveau. Un effet le ferait aussi, en une
     frame de trop — et tomberait sous `react-hooks/set-state-in-effect`. */
  const [precedent, setPrecedent] = useState(cleReset);
  if (precedent !== cleReset) {
    setPrecedent(cleReset);
    setEtats({});
  }

  /* Volontairement non mémoïsées : ce sont des gestionnaires d'événement, et
     elles doivent lire `charger` tel qu'il est au moment du clic — il se
     referme sur les filtres courants de l'écran. */
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
      // Replier jette les lignes : les rouvrir les recharge. Les garder
      // ferait diverger l'affichage des filtres si ceux-ci ont bougé entre
      // les deux, et un groupe replié ne coûte rien à recharger.
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
    /* Une page plus grande plutôt qu'une concaténation de pages : redemander
       depuis le début évite les doublons comme les trous qu'un décalage
       produirait si une ligne changeait de groupe entre deux appels.

       **Cela suppose un ordre déterministe**, ce que le serveur ne garantit
       pas de lui-même : mesuré, le groupe « 2024 » des dossiers trié sur la
       seule `docDate` ressort dans un ordre différent d'un appel à l'autre,
       les ex æquo étant départagés par le plan SQL du moment. C'est à
       l'appelant de passer un tri qui tranche — voir les `sort` des écrans. */
    recuperer(g, (etat?.lignes.length ?? 0) + TAILLE_LOT_GROUPE);
  };

  return {
    estOuvert: (g: GroupeDto) => etats[identiteGroupe(g)] !== undefined,
    etat: (g: GroupeDto): LignesGroupe<T> | undefined => etats[identiteGroupe(g)],
    /** Toutes les lignes actuellement affichées, tous groupes ouverts
     * confondus — ce sur quoi porte le pied Σ de la grille. */
    lignesChargees: useMemo(() => Object.values(etats).flatMap((e) => e.lignes), [etats]),
    basculer,
    chargerPlus,
  };
}
