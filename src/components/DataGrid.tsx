import { Fragment, useCallback, useDeferredValue, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Sigma, SquareMinus, SquarePlus } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './ui/table';
import { sansAccents, useOrdreColonnes } from '../lib/colonnes';
import { formatCurrency, formatDate, formatNumber } from '../lib/format';
import { cn } from '../lib/utils';
import {
  LIBELLES_FONCTION,
  TAILLE_LOT_GROUPE,
  identiteGroupe,
  libelleGroupeAffiche,
  type LignesGroupe,
} from '../lib/groupement';
import type { ColonneDto, FonctionAgregat, GroupeDto, TypeColonne, ValeurAgregat } from '../types';

/** Grille de données partagée par tous les écrans de liste.
 *
 * Porte le chrome de la grille légataire Omran — bandeau de regroupement,
 * gouttière d'indicateur et de case à cocher, en-têtes triables, bascule Σ
 * avec pied de tableau, ligne de filtres par colonne — au-dessus du primitif
 * `ui/table`, qui porte la densité.
 *
 * Extraite de `ProspectionTable`, où ce chrome a été construit d'abord. Les
 * écrans déclarent des **colonnes** au lieu d'écrire du balisage : c'est ce
 * qui rend le chrome uniforme sans le recopier neuf fois.
 *
 * Tri, filtres et Σ sont **réels mais côté client, sur les lignes déjà
 * chargées** — le comportement par défaut de la grille DevExpress d'origine.
 * Le filtrage serveur reste l'affaire des volets de filtres de chaque page,
 * qui eux paginent. Ne pas fusionner les deux : ils ne répondent pas à la
 * même question. */
export type ColonneGrille<T> = {
  /** Clé technique. Sert d'identité de colonne et, par défaut, d'accesseur
   * dans la ligne (`row[nom]`). */
  nom: string;
  libelle: string;
  /** Porte l'alignement, le formatage par défaut et le glyphe d'opérateur de
   * la ligne de filtres. `TEXTE` par défaut. */
  type?: TypeColonne;
  /** **Largeur maximale** de la colonne, en poids — et non plus une part fixe
   * de la table.
   *
   * La grille était en disposition fixe (`table-layout: fixed`) : chaque colonne
   * recevait un pourcentage
   * de la largeur disponible, et tout ce qui dépassait était coupé, y compris
   * sur une colonne courte que rien n'obligeait à l'être. Maintenant que le
   * conteneur de page défile horizontalement, la table est en `table-auto` :
   * **chaque colonne prend la largeur de son contenu**, et `largeur` ne sert
   * plus qu'à borner celles qui déraillent — une note libre, une adresse, un
   * libellé de référentiel à rallonge.
   *
   * Les valeurs ne changent pas de sens relatif : une colonne à 24 reste deux
   * fois plus permissive qu'une à 12, et les tables de poids réglées écran par
   * écran (`lib/dispositions.ts`) gardent donc leur réglage. Converti en
   * pixels par `plafondColonne`. */
  largeur?: number;
  /** Rendu riche — pastille, lien, seuil coloré. Sans lui, la valeur est
   * formatée selon `type`. */
  rendu?: (row: T) => ReactNode;
  /** Valeur pour le tri et le filtre, quand elle ne se lit pas directement
   * dans `row[nom]` (nom composé, repli entre deux champs…). */
  valeur?: (row: T) => unknown;
  classe?: string;
  /** Formateur d'une **valeur nue**, distinct de `rendu` qui prend une ligne
   * entière.
   *
   * Sert aux bandes de totaux, où il n'y a pas de ligne à passer : sans lui,
   * une moyenne de `remise` s'afficherait « 0,07 » au lieu de « 7,31 % »,
   * puisque le serveur type la colonne `NOMBRE` alors que c'est un ratio.
   * À poser dans l'adaptateur, là où le rendu de cellule est déjà décidé. */
  formatValeur?: (valeur: unknown) => string;
  /** Infobulle : le texte complet, pour les valeurs assez longues pour
   * atteindre le plafond de la colonne et se faire couper. */
  titre?: (row: T) => string | undefined;
  /** Pas de bascule Σ sur cette colonne : un total qui doit venir du
   * serveur (montants des ordres de virement) ne se recalcule pas à l'écran. */
  sansSomme?: boolean;
};

const TIRET = <span className="text-muted-foreground">—</span>;

/** Ce qu'un écran fournit à `DataGrid` pour replier sa liste en groupes.
 *
 * Compose `useGroupement` (l'axe, servi par `/groupes`) et `useLignesGroupes`
 * (les lignes de chaque groupe déplié). La grille ne connaît ni l'un ni
 * l'autre : elle reçoit des données et des rappels. */
export type GroupementGrille<T> = {
  liste: GroupeDto[];
  /** Libellé de la colonne groupée, préfixe de chaque en-tête. */
  colonneLibelle: string;
  /** Agrégats actifs, résolus par `useGroupement` : le jeton envoyé, la
   * colonne qu'il vise et la fonction appliquée. Les trois sont nécessaires au
   * formatage — un `MIN` sur une colonne date rend une chaîne ISO. */
  agregats: { jeton: string; colonne: ColonneDto; fonction: FonctionAgregat }[];
  /** Les mêmes agrégats sur **tout le périmètre filtré**, et l'effectif dont
   * ils sont tirés. C'est le « Total : » de bas de grille du logiciel de
   * bureau, à ne pas confondre avec le Σ par colonne, qui lui ne porte que sur
   * les lignes chargées. */
  totaux: Record<string, ValeurAgregat>;
  nombreTotal: number;
  estOuvert: (g: GroupeDto) => boolean;
  etat: (g: GroupeDto) => LignesGroupe<T> | undefined;
  basculer: (g: GroupeDto) => void;
  chargerPlus: (g: GroupeDto) => void;
  /** Toutes les lignes affichées, tous groupes ouverts confondus — ce sur quoi
   * porte le pied Σ. */
  lignesChargees: T[];
};

const NUMERIQUES: TypeColonne[] = ['MONTANT', 'NOMBRE'];

/** Met en forme un agrégat. **La fonction décide autant que le type.**
 *
 * - `COUNT` est un effectif : un entier, quelle que soit la colonne comptée.
 *   Formater le compte de dates comme une date n'aurait aucun sens.
 * - `SUM`/`AVG`/`MIN`/`MAX` gardent l'unité de la colonne — d'où `formatDate`
 *   sur une colonne DATE, le serveur renvoyant alors une **chaîne ISO** et non
 *   un nombre.
 * - `null` ne concerne que `MIN`/`MAX` sans aucune valeur (mesuré, 1 groupe
 *   sur 7) : un tiret, jamais « 0 », qui serait un mensonge. Une somme vide
 *   vaut `0` côté serveur et s'affiche donc bien « 0,00 DH ».
 *
 * `formatValeur`, quand la colonne en porte un, l'emporte sur le type : c'est
 * ce qui rend une moyenne de taux en pourcentage. Pas sur `COUNT`, qui n'est
 * plus dans l'unité de la colonne. */
function formatAgregat<T>(
  valeur: ValeurAgregat | undefined,
  colonne: ColonneGrille<T> | undefined,
  fonction: FonctionAgregat,
  type: TypeColonne,
): string {
  if (valeur === null || valeur === undefined) return '—';
  if (fonction === 'COUNT') return formatNumber(Number(valeur));
  if (colonne?.formatValeur) return colonne.formatValeur(valeur);
  if (type === 'DATE') return formatDate(String(valeur));
  if (typeof valeur !== 'number') return String(valeur);
  return type === 'MONTANT' ? formatCurrency(valeur) : formatNumber(valeur, 2);
}

/** Rendu par défaut, piloté par le `type` de la colonne. */
function rendreParType(valeur: unknown, type: TypeColonne): ReactNode {
  if (valeur === null || valeur === undefined || valeur === '') return TIRET;
  switch (type) {
    case 'MONTANT':
      return typeof valeur === 'number' ? formatCurrency(valeur) : String(valeur);
    case 'NOMBRE':
      return typeof valeur === 'number' ? formatNumber(valeur) : String(valeur);
    case 'DATE':
      return formatDate(String(valeur));
    case 'BOOLEEN':
      return valeur ? 'Oui' : 'Non';
    default:
      return String(valeur);
  }
}

function typeDe<T>(c: ColonneGrille<T>): TypeColonne {
  return c.type ?? 'TEXTE';
}

function valeurDe<T>(row: T, c: ColonneGrille<T>): unknown {
  if (c.valeur) return c.valeur(row);
  return (row as unknown as Record<string, unknown>)[c.nom];
}

/** Texte sur lequel la ligne de filtres compare, dans la *forme affichée* :
 * l'utilisateur voit `09/09/2026` et tape `09/09`, pas `2026-09-09`. */
function texteComparable<T>(row: T, c: ColonneGrille<T>): string {
  const v = valeurDe(row, c);
  if (v === null || v === undefined) return '';
  const type = typeDe(c);
  if (type === 'DATE') return formatDate(String(v));
  if (type === 'BOOLEEN') return v ? 'oui' : 'non';
  return String(v);
}

/** Forme numérique saisie ou affichée, ramenée à `50000.00` : sans espaces
 * (`\s` couvre les insécables), sans unité finale (DH, m², %), virgule décimale en point. */
function normaliserNombre(texte: string): string {
  return texte.replace(/\s/g, '').replace(/(dh|m²|m2|%)$/i, '').replace(',', '.');
}

/** Formes d'une valeur numérique que l'utilisateur peut recopier : la forme
 * formatée et la valeur brute, qui garde ses décimales réelles (`85.47`). */
function textesNumeriques<T>(v: unknown, c: ColonneGrille<T>): string[] {
  if (c.formatValeur) return [c.formatValeur(v), String(v)];
  if (typeof v !== 'number') return [String(v)];
  return [typeDe(c) === 'MONTANT' ? formatCurrency(v) : formatNumber(v), String(v)];
}

/** Prédicat de la ligne de filtres pour une colonne : sous-chaîne sans accents
 * sur le texte, égalité sur les nombres (`=`), voir FIX-grille-filtres-fiches.md §1-2. */
function predicatFiltre<T>(c: ColonneGrille<T>, saisie: string): (row: T) => boolean {
  if (!NUMERIQUES.includes(typeDe(c))) {
    const aiguille = sansAccents(saisie);
    return (r) => sansAccents(texteComparable(r, c)).includes(aiguille);
  }
  const aiguille = normaliserNombre(saisie).toLowerCase();
  const n = Number(aiguille);
  // Un ratio affiché en % (`formatValeur`) ne se compare qu'à sa forme affichée.
  if (!c.formatValeur && /^-?[\d.]+$/.test(aiguille) && Number.isFinite(n)) {
    const tolerance = typeDe(c) === 'MONTANT' ? 0.005 : 0;
    return (r) => {
      const v = valeurDe(r, c);
      if (v === null || v === undefined || v === '') return false;
      return Math.abs(Number(v) - n) <= tolerance;
    };
  }
  return (r) => {
    const v = valeurDe(r, c);
    if (v === null || v === undefined || v === '') return false;
    return textesNumeriques(v, c).some((t) => normaliserNombre(t).toLowerCase().includes(aiguille));
  };
}

/* `A` sur le texte, `=` sur tout ce qui se compare — les deux glyphes que la
   grille légataire pose dans sa ligne de filtres. Purement indicatifs :
   ils annoncent le mode de comparaison, ils ne l'ouvrent pas au choix. */
function glypheOperateur(type: TypeColonne): string {
  return type === 'TEXTE' ? 'A' : '=';
}

/** « Prix » pour une somme, « Prix (moyenne) » pour le reste.
 *
 * La somme reste implicite parce qu'elle l'est déjà côté serveur — un nom nu
 * vaut une somme — et parce qu'écrire « Prix (somme) » sur le cas courant
 * alourdirait la bande pour ne rien apprendre. */
function libelleAgregat(a: { colonne: ColonneDto; fonction: FonctionAgregat }): string {
  return a.fonction === 'SUM' ? a.colonne.libelle : `${a.colonne.libelle} (${LIBELLES_FONCTION[a.fonction].toLowerCase()})`;
}

export default function DataGrid<T extends { id: string }>({
  rows,
  colonnes: colonnesRecues,
  cleOrdre,
  onOuvrir,
  libelleLigne,
  minWidth,
  bandeauRegroupement = true,
  selection,
  classeLigne,
  rendreDetail,
  actions,
  groupes,
}: {
  rows: T[];
  colonnes: ColonneGrille<T>[];
  /** Identité de l'écran pour la persistance de l'ordre des colonnes.
   *
   * Même clé que la sélection de colonnes (`useColonnesVisibles`) — c'est le
   * même écran — mais un espace de stockage distinct : quelles colonnes et dans
   * quel ordre sont deux préférences indépendantes.
   *
   * Absente, le glisser-déposer fonctionne quand même, en mémoire seulement :
   * mieux vaut une grille réordonnable qui oublie qu'une grille figée. */
  cleOrdre?: string;
  /** Sans lui, les lignes ne sont ni cliquables ni focusables — pour les
   * grilles de consultation pure. */
  onOuvrir?: (id: string) => void;
  /** Étiquette d'accessibilité de la ligne, p. ex. `Ouvrir la fiche de X`. */
  libelleLigne?: (row: T) => string;
  /** Largeur minimale de la table. Par défaut ~8rem par colonne, calibré sur
   * les métriques de cellule dense (12.5px de texte, 6px de gouttière). */
  /** Largeur minimale de la table. N'a plus de défaut calculé : `min-w-full`
   * suffit à remplir le conteneur, et `table-auto` fait le reste. À ne passer
   * que pour forcer un plancher précis. */
  minWidth?: string;
  /** Le bandeau inerte « glisser un en-tête pour regrouper ».
   *
   * **À couper sur les listes qui ont un vrai groupement** — prospections,
   * pré-prospections, dossiers : celles-là rendent `BandeGroupement` au niveau
   * de l'écran, au-dessus de la grille, pour que la bande survive aux états
   * vides. Une liste dépliée qui ne renvoie rien doit garder sa sortie « Tous
   * les groupes », sinon l'écran est sans issue.
   *
   * Partout ailleurs il reste, et son « Bientôt » reste exact : le serveur ne
   * sait pas grouper ces listes, ce n'est pas un câblage oublié. */
  bandeauRegroupement?: boolean;
  /** Sélection **pilotée par la page**. Sans elle, la gouttière garde un état
   * interne purement visuel : elle coche, rien ne la consomme.
   *
   * L'écran Dossiers, lui, a une vraie sélection multiple — la génération de
   * documents en lot — et avait donc sa propre colonne de cases. Deux colonnes
   * de cases dont une décorative serait un bug d'interface : en passant sa
   * sélection ici, la gouttière *devient* le sélecteur de lot. */
  selection?: {
    ids: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: (ids: string[]) => void;
  };
  /** Panneau de détail dépliable sous la ligne (maître-détail).
   *
   * Ajoute une gouttière de chevron et, quand la ligne est dépliée, une
   * seconde `<tr>` en `colSpan` sur toute la largeur. Sans ce prop, aucune des
   * deux n'existe — les grilles plates n'y gagnent rien.
   *
   * C'est ce qui permet à l'écran Offres de garder son détail des montants
   * tout en recevant le même chrome que les autres listes : sans lui, le
   * convertir aurait voulu dire supprimer une fonctionnalité qui marche. */
  /** Classe posée sur la ligne entière, d'après la ligne elle-même.
   *
   * Sert à porter un **état qui appartient à l'enregistrement**, pas à une de
   * ses cellules — une relance en retard, par exemple, qu'on veut repérer d'un
   * coup d'œil sans lire la colonne Alerte.
   *
   * Appliquée **avant** les teintes « cochée » et « ligne courante », qui
   * doivent continuer de gagner : twMerge garde la dernière classe pour une
   * même propriété, et l'état de sélection doit rester lisible sur une ligne
   * déjà teintée. */
  classeLigne?: (row: T) => string | undefined;
  rendreDetail?: (row: T) => ReactNode;
  /** Colonne « Actions » **statique** en tête de grille, après les
   * gouttières : un rendu par ligne
   * (menu contextuel, boutons), volontairement hors tri, filtre, Σ et
   * glisser-déposer — ces chromes comparent des valeurs et cette colonne
   * n'en porte pas. Les clics et touches y sont arrêtés avant la ligne,
   * sinon ouvrir le menu ouvrirait aussi la fiche. */
  actions?: (row: T) => ReactNode;
  /** Groupement **déplié sur place**, comme dans le logiciel de bureau.
   *
   * Quand il est fourni, le corps du tableau n'est plus une suite de lignes
   * mais une suite d'**en-têtes de groupe** — `⊟ Statut : CONCRETISATION
   * (68 items)` — chacun pouvant s'ouvrir pour laisser apparaître ses lignes
   * juste en dessous, dans les mêmes colonnes. Plusieurs groupes restent
   * ouverts en même temps ; c'est tout l'intérêt du dépliant, et c'est ce
   * qu'une bascule entre deux écrans ne permettrait pas.
   *
   * `rows` est alors ignoré : les lignes de chaque groupe viennent de `etat`,
   * chargées à la demande par l'écran. Un groupe n'est pas borné — mesuré,
   * 3 145 prospections pour « 1 A TRAITER » — d'où le chargement par lots et
   * la ligne « en charger davantage » en pied de groupe. */
  groupes?: GroupementGrille<T>;
}) {
  /* Poids -> plafond en pixels. 20 px par unité : une colonne à 10 — le
     défaut — plafonne à 200 px, une à 24 (un nom complet) à 480 px. Le plancher
     de 120 px évite qu'une colonne volontairement étroite, comme un indicatif
     à 7, coupe un en-tête qui tient pourtant.

     Un plafond et non une largeur : en `table-auto` le navigateur donne à
     chaque colonne la largeur de son contenu, et `max-width` ne mord que sur
     celles qui dépassent. Une colonne de codes courts reste donc serrée sans
     qu'on ait à l'indiquer. */
  const plafondColonne = (c: ColonneGrille<T>) => `${Math.max(120, (c.largeur ?? 10) * 20)}px`;
  const aDroite = (c: ColonneGrille<T>) => NUMERIQUES.includes(typeDe(c));

  const [filtres, setFiltres] = useState<Record<string, string>>({});
  /* La ligne de filtres refiltre et retrie **toute la page chargee** a chaque
     frappe — jusqu'a 500 lignes sur les dossiers — puis rerend le tableau. Fait
     dans la foulee de la touche, c'est l'input qui attend. Les champs lisent
     donc `filtres`, immediat, et le tableau lit `filtresDiff`, que React
     recalcule sans bloquer la saisie. */
  const filtresDiff = useDeferredValue(filtres);
  const [tri, setTri] = useState<{ nom: string; sens: 'asc' | 'desc' } | null>(null);
  const [sommes, setSommes] = useState<Set<string>>(new Set());
  const [cocheesLocales, setCocheesLocales] = useState<Set<string>>(new Set());
  const [courante, setCourante] = useState<string | null>(null);

  const cochees = selection?.ids ?? cocheesLocales;
  const [depliee, setDepliee] = useState<string | null>(null);

  /* ---------------------------------------------------------------------
     L'ordre des colonnes, déplaçable.

     Posé ici plutôt que dans chaque écran : la chrome de grille existe une
     fois et les dix listes en héritent. Un écran n'a rien à déclarer, sinon sa
     clé de persistance.

     Le glisser natif du navigateur, sans bibliothèque — la grille n'a pas de
     dépendance de ce genre et n'en gagne pas une pour ça. Il ne couvre pas le
     clavier, d'où `decaler` sur Alt+Flèches : sans lui la fonctionnalité
     serait à la souris seule, ce qui n'est pas une fonctionnalité.
     --------------------------------------------------------------------- */
  const {
    colonnesOrdonnees: colonnes,
    deplacerVers,
    decaler,
    reinitialiser: reinitialiserOrdre,
    personnalise: ordrePersonnalise,
  } = useOrdreColonnes(cleOrdre, colonnesRecues);
  /** Colonne en cours de glissement, et celle survolée — deux états distincts :
   * l'indicateur d'insertion se pose sur la seconde. */
  const [glissee, setGlissee] = useState<string | null>(null);
  const [surveeOrdre, setSurveeOrdre] = useState<string | null>(null);

  /* `colonnes.find(...)` etait appele par agregat **et** par groupe : sur un
     ecran replie, O(groupes x agregats x colonnes) a chaque rendu. L'index le
     ramene a une lecture. */
  const parNom = useMemo(() => new Map(colonnes.map((c) => [c.nom, c])), [colonnes]);

  /* Le filtre et le tri de la grille, isolés pour pouvoir s'appliquer soit à
     la liste plate, soit **à chaque groupe séparément**. Trier à l'intérieur
     d'un groupe est le seul tri qui ait un sens une fois la liste repliée :
     un tri global réordonnerait les lignes à travers les groupes et les en
     sortirait. */
  const filtrer = useCallback(
    (source: T[]) => {
      /* Prédicats construits une fois par passe : l'aiguille est normalisée
         ici, pas par ligne et par colonne filtrée. */
      const actifs: ((r: T) => boolean)[] = [];
      for (const c of colonnes) {
        const saisie = (filtresDiff[c.nom] ?? '').trim();
        if (saisie !== '') actifs.push(predicatFiltre(c, saisie));
      }
      return actifs.length ? source.filter((r) => actifs.every((p) => p(r))) : source;
    },
    [colonnes, filtresDiff],
  );

  const appliquer = useCallback(
    (source: T[]) => {
      const filtrees = filtrer(source);
      if (!tri) return filtrees;
      const col = parNom.get(tri.nom);
      if (!col) return filtrees;
      const signe = tri.sens === 'asc' ? 1 : -1;
      /* Le type de la colonne ne change pas d'une comparaison a l'autre : le
         tester dans le comparateur le recalculait O(n log n) fois. */
      const numerique = NUMERIQUES.includes(typeDe(col));
      return [...filtrees].sort((a, b) => {
        const va = valeurDe(a, col);
        const vb = valeurDe(b, col);
        // Les vides finissent en bas quel que soit le sens : « trier par date
        // de visite » veut dire « les visités d'abord », pas « les nulls ».
        if (va === null || va === undefined || va === '') return 1;
        if (vb === null || vb === undefined || vb === '') return -1;
        if (numerique) return (Number(va) - Number(vb)) * signe;
        return String(va).localeCompare(String(vb), 'fr') * signe;
      });
    },
    [filtrer, parNom, tri],
  );

  const visibles = useMemo(() => appliquer(rows), [appliquer, rows]);
  const filtreActif = colonnes.some((c) => (filtresDiff[c.nom] ?? '').trim() !== '');

  /* Ce que le Σ somme, et ce que la barre de résumé compte : les lignes
     réellement à l'écran. En mode groupé ce sont celles des groupes ouverts
     qui passent le filtre, `rows` étant alors vide. */
  const lignesDepliees = groupes?.lignesChargees;
  const sommables = useMemo(
    () => (lignesDepliees ? filtrer(lignesDepliees) : visibles),
    [lignesDepliees, filtrer, visibles],
  );

  const basculerTri = (nom: string) =>
    setTri((t) => (t?.nom !== nom ? { nom, sens: 'asc' } : t.sens === 'asc' ? { nom, sens: 'desc' } : null));

  const basculerSomme = (nom: string) =>
    setSommes((s) => {
      const suivant = new Set(s);
      if (!suivant.delete(nom)) suivant.add(nom);
      return suivant;
    });

  const basculerCoche = (id: string) => {
    if (selection) {
      selection.onToggle(id);
      return;
    }
    setCocheesLocales((s) => {
      const suivant = new Set(s);
      if (!suivant.delete(id)) suivant.add(id);
      return suivant;
    });
  };

  const toutesCochees = visibles.length > 0 && visibles.every((r) => cochees.has(r.id));

  const basculerToutes = () => {
    const ids = visibles.map((r) => r.id);
    if (selection) {
      selection.onToggleAll(toutesCochees ? [] : ids);
      return;
    }
    setCocheesLocales(toutesCochees ? new Set() : new Set(ids));
  };

  /* Σ : somme pour les colonnes numériques, décompte des valeurs renseignées
     sinon — le comportement de la grille d'origine, où Σ sur une colonne
     texte affiche « Count ». */
  /* Le pied Sigma reparcourait toutes les lignes chargees **par colonne
     sommee**, a chaque rendu — donc a chaque frappe dans la ligne de filtres.
     Calcule une fois, et seulement pour les colonnes reellement cochees. */
  const resumes = useMemo(() => {
    const m = new Map<string, string>();
    if (sommes.size === 0) return m;
    for (const c of colonnes) {
      if (!sommes.has(c.nom)) continue;
      const type = typeDe(c);
      if (NUMERIQUES.includes(type)) {
        let total = 0;
        for (const r of sommables) {
          const v = valeurDe(r, c);
          if (typeof v === 'number') total += v;
        }
        m.set(c.nom, type === 'MONTANT' ? formatCurrency(total) : formatNumber(total));
      } else {
        let renseignees = 0;
        for (const r of sommables) {
          const v = valeurDe(r, c);
          if (v !== null && v !== undefined && v !== '') renseignees++;
        }
        m.set(c.nom, formatNumber(renseignees));
      }
    }
    return m;
  }, [colonnes, sommes, sommables]);

  const cliquable = Boolean(onOuvrir);

  /* Les gouttières : indicateur de ligne courante, case à cocher, et le
     chevron de maître-détail quand il existe. Sert au `colSpan` des lignes qui
     couvrent toute la largeur — en-têtes de groupe et leurs pieds. */
  const nbColonnes = colonnes.length + (rendreDetail ? 3 : 2) + (actions ? 1 : 0);

  /* Extraite de la boucle : la même ligne se rend à plat ou sous un en-tête de
     groupe, et la dupliquer serait le meilleur moyen de faire diverger les
     deux rendus au premier correctif. */
  const rendreLigne = (r: T) => {
      const estCourante = courante === r.id;
      const estCochee = cochees.has(r.id);
      const estDepliee = depliee === r.id;
      return (
        <Fragment key={r.id}>
        <TableRow
          tabIndex={cliquable ? 0 : undefined}
          aria-label={libelleLigne?.(r)}
          aria-selected={estCourante}
          // Pas de `role="link"` : la ligne porte une case à cocher, et
          // un lien ne peut pas contenir de contrôle. Le `<tr>` garde son
          // rôle `row` implicite, l'ouverture reste au clic et à Entrée.
          className={cn(
            cliquable && 'cursor-pointer',
            // État propre à l'enregistrement d'abord, états de sélection
            // ensuite : cochée puis courante. twMerge garde la dernière classe
            // pour une même propriété, si bien qu'une ligne sélectionnée reste
            // identifiable même déjà teintée.
            classeLigne?.(r),
            estCochee && 'bg-muted/40 hover:bg-muted/40',
            estCourante && 'bg-(--brand-bg) hover:bg-(--brand-bg)',
          )}
          onClick={cliquable ? () => { setCourante(r.id); onOuvrir?.(r.id); } : undefined}
          onFocus={() => setCourante(r.id)}
          onKeyDown={
            cliquable
              ? (e) => {
                  if (e.key === 'Enter') onOuvrir?.(r.id);
                }
              : undefined
          }
        >
          {rendreDetail && (
            <TableCell
              className="w-(--gutter-check) p-0 text-center"
              onClick={(e) => {
                e.stopPropagation();
                setDepliee(estDepliee ? null : r.id);
              }}
            >
              <button
                type="button"
                aria-expanded={estDepliee}
                aria-label={estDepliee ? 'Replier le détail' : 'Déplier le détail'}
                className="align-middle"
              >
                {estDepliee ? (
                  <ChevronDown className="size-3 text-(--brand)" aria-hidden />
                ) : (
                  <ChevronRight className="size-3 text-muted-foreground" aria-hidden />
                )}
              </button>
            </TableCell>
          )}
          <TableCell className="w-(--gutter-mark) p-0 text-center">
            {estCourante && (
              <span className="text-(--brand)" aria-hidden>
                ▶
              </span>
            )}
          </TableCell>
          <TableCell
            className="w-(--gutter-check) px-0 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className="size-3 cursor-pointer align-middle accent-(--brand)"
              checked={cochees.has(r.id)}
              onChange={() => basculerCoche(r.id)}
              aria-label={libelleLigne ? `Sélectionner — ${libelleLigne(r)}` : 'Sélectionner la ligne'}
            />
          </TableCell>
          {actions && (
            <TableCell
              className="px-1 text-center"
              /* Le clic ouvre le menu, pas la fiche ; Entrée sur le
                 déclencheur focalisé remonterait sinon jusqu'au onKeyDown de
                 la ligne et naviguerait par-dessus le menu ouvert. */
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {actions(r)}
            </TableCell>
          )}
          {colonnes.map((c) => (
            <TableCell
              key={c.nom}
              /* `truncate` ne mord plus qu'au-delà du plafond : sans
                 largeur imposée, une valeur courte s'affiche en entier. */
              className={cn('truncate', aDroite(c) && 'text-right tabular-nums', c.classe)}
              style={{ maxWidth: plafondColonne(c) }}
              title={c.titre?.(r)}
            >
              {c.rendu ? c.rendu(r) : rendreParType(valeurDe(r, c), typeDe(c))}
            </TableCell>
          ))}
        </TableRow>
        {rendreDetail && estDepliee && (
          /* `colSpan` couvre les colonnes plus les gouttieres : chevron
             (si present), indicateur, case a cocher. */
          <TableRow className="hover:bg-transparent">
            {/* `nbColonnes` : les colonnes, plus les trois gouttières — chevron,
                indicateur de ligne courante, case à cocher. Cette
                branche n'existe que si `rendreDetail` est fourni, donc
                le chevron est toujours là. */}
            <TableCell colSpan={nbColonnes} className="bg-muted/30 py-3 whitespace-normal">
              {rendreDetail(r)}
            </TableCell>
          </TableRow>
        )}
        </Fragment>
      );
  };

  return (
    <div className="flex min-w-0 flex-col">
      {bandeauRegroupement && (
        /* Pas de bordure propre au bandeau : les pages l'enveloppent déjà
           d'une Card bordée, et un cadre de plus se lirait comme un double
           filet. Sur ces écrans-là le groupement n'existe pas côté serveur —
           le bandeau tient la place et l'énonce, plutôt que de mentir avec
           une cible inerte. */
        <div className="flex h-6 shrink-0 items-center gap-1.5 bg-muted/40 px-2 text-micro text-muted-foreground">
          <span className="truncate opacity-70">
            Faites glisser un en-tête de colonne ici pour regrouper par cette colonne
          </span>
          <span className="shrink-0 rounded-full bg-(--amber-bg) px-1.25 font-bold text-(--amber)">Bientôt</span>
        </div>
      )}
      {(tri || sommes.size > 0 || cochees.size > 0 || filtreActif || ordrePersonnalise) && (
        <div className="flex h-5 shrink-0 items-center gap-3 border-b border-border/70 bg-card px-2 text-micro text-muted-foreground">
          {cochees.size > 0 && <span className="shrink-0">{cochees.size} sélectionnée(s)</span>}
          {tri && (
            <button type="button" className="shrink-0 truncate hover:text-foreground hover:underline" onClick={() => setTri(null)}>
              Tri sur « {parNom.get(tri.nom)?.libelle ?? tri.nom} » — retirer
            </button>
          )}
          {sommes.size > 0 && (
            <button type="button" className="shrink-0 hover:text-foreground hover:underline" onClick={() => setSommes(new Set())}>
              {sommes.size} total(aux) — masquer
            </button>
          )}
          {/* La sortie, au même endroit que celles du tri et des totaux : un
              ordre déplacé sans moyen visible de revenir au défaut est un
              piège, d'autant qu'il survit au rechargement. */}
          {ordrePersonnalise && (
            <button type="button" className="shrink-0 hover:text-foreground hover:underline" onClick={reinitialiserOrdre}>
              Ordre des colonnes modifié — rétablir
            </button>
          )}
          <span className="ml-auto shrink-0 tabular-nums">
            {groupes
              ? filtreActif
                ? `${formatNumber(groupes.liste.length)} groupe(s), ${formatNumber(sommables.length)} / ${formatNumber(
                    groupes.lignesChargees.length,
                  )} ligne(s) dépliée(s) — filtre sur les lignes dépliées seulement`
                : `${formatNumber(groupes.liste.length)} groupe(s), ${formatNumber(sommables.length)} ligne(s) dépliée(s)`
              : filtreActif
                ? `${formatNumber(visibles.length)} / ${formatNumber(rows.length)} ligne(s) chargée(s) — filtre sur la page affichée seulement`
                : `${formatNumber(rows.length)} ligne(s)`}
          </span>
        </div>
      )}
      <Table
        /* `w-max` : la table prend la largeur de son contenu et déborde le
           conteneur, qui défile — c'est ce qui permet d'afficher chaque valeur
           en entier. `min-w-full` la fait quand même remplir l'écran quand les
           colonnes sont peu nombreuses, sinon une liste à quatre colonnes
           laisserait un vide à droite. */
        className="w-max min-w-full table-auto"
        // Le défilement, dans les deux axes, appartient au conteneur de la
        // page : c'est lui qui a une hauteur bornée, donc lui seul peut placer
        // une barre horizontale visible et servir de référence au `sticky`.
        containerClassName="overflow-visible"
        style={minWidth ? { minWidth } : undefined}
      >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* Gouttières. Volontairement NON figées à gauche : figer demande
                un fond opaque par cellule de gouttière pour occulter ce qui
                défile dessous, donc de rejouer à la main la couleur de ligne
                courante et de pied — et rien dans la capture de référence ne
                prouve que la grille d'origine les fige. */}
            {rendreDetail && <TableHead className="sticky top-0 z-10 w-(--gutter-check) bg-(--surface-hover) p-0" aria-label="Deplier" />}
            <TableHead className="sticky top-0 z-10 w-(--gutter-mark) bg-(--surface-hover) p-0" aria-label="Ligne courante" />
            <TableHead className="sticky top-0 z-10 w-(--gutter-check) bg-(--surface-hover) px-0 text-center">
              <input
                type="checkbox"
                className="size-3 cursor-pointer align-middle accent-(--brand)"
                checked={toutesCochees}
                onChange={basculerToutes}
                aria-label={toutesCochees ? 'Tout décocher' : 'Tout cocher'}
              />
            </TableHead>
            {actions && (
              /* Ni triable, ni déplaçable, ni sommable : l'en-tête est un
                 libellé nu, pas un bouton. En tête de grille, avec les
                 gouttières — un geste, pas une donnée. */
              <TableHead className="sticky top-0 z-10 bg-(--surface-hover) px-1 text-center whitespace-nowrap">
                Actions
              </TableHead>
            )}
            {colonnes.map((c, iCol) => {
              const trie = tri?.nom === c.nom;
              /* De quel côté poser le trait d'insertion. Les deux sens ne se
                 valent pas : glisser vers la droite dépose **après** la colonne
                 survolée, vers la gauche **avant** — conséquence du retrait
                 puis de la réinsertion. Montrer le trait du mauvais côté
                 annoncerait un résultat que le geste ne produit pas. */
              const iGlissee = glissee ? colonnes.findIndex((x) => x.nom === glissee) : -1;
              const estCible = !!glissee && glissee !== c.nom && surveeOrdre === c.nom;
              const versLaDroite = iGlissee !== -1 && iGlissee < iCol;
              return (
                <TableHead
                  key={c.nom}
                  // `sticky` sur les cellules et non sur la ligne : la
                  // preflight Tailwind pose `border-collapse: collapse`, mode
                  // dans lequel Chrome ignore un `sticky` porté par un `<tr>`.
                  // Le fond opaque doit alors suivre sur chaque `<th>`.
                  className={cn(
                    // `bg-(--surface-hover)` : le bandeau d'en-tête gris de
                    // table.tsx, redit ici parce que le collant exige un fond
                    // opaque par cellule.
                    'sticky top-0 z-10 bg-(--surface-hover) whitespace-nowrap cursor-grab',
                    glissee === c.nom && 'cursor-grabbing opacity-50',
                    // Trait d'insertion en ombre interne : aucun décalage de
                    // mise en page, là où une bordure élargirait la cellule et
                    // ferait tressauter toute la grille au survol.
                    estCible &&
                      (versLaDroite
                        ? 'shadow-[inset_-2px_0_0_0_var(--brand)]'
                        : 'shadow-[inset_2px_0_0_0_var(--brand)]'),
                  )}
                  style={{ maxWidth: plafondColonne(c) }}
                  aria-sort={trie ? (tri.sens === 'asc' ? 'ascending' : 'descending') : 'none'}
                  draggable
                  onDragStart={(ev) => {
                    setGlissee(c.nom);
                    // Firefox n'amorce pas de glissement sans charge utile.
                    ev.dataTransfer.effectAllowed = 'move';
                    ev.dataTransfer.setData('text/plain', c.nom);
                  }}
                  onDragOver={(ev) => {
                    if (!glissee) return;
                    // Sans `preventDefault`, la cellule n'est pas une cible de
                    // dépôt et le curseur affiche « interdit ».
                    ev.preventDefault();
                    ev.dataTransfer.dropEffect = 'move';
                    setSurveeOrdre(c.nom);
                  }}
                  onDrop={(ev) => {
                    ev.preventDefault();
                    const nom = glissee ?? ev.dataTransfer.getData('text/plain');
                    if (nom) deplacerVers(nom, c.nom);
                    setGlissee(null);
                    setSurveeOrdre(null);
                  }}
                  onDragEnd={() => {
                    setGlissee(null);
                    setSurveeOrdre(null);
                  }}
                >
                  <span className={cn('flex items-center gap-1', aDroite(c) && 'justify-end')}>
                    <button
                      type="button"
                      className="min-w-0 whitespace-nowrap hover:underline"
                      onClick={() => basculerTri(c.nom)}
                      /* Alt et non les flèches nues : le bouton est dans une
                         barre d'en-têtes que les flèches seules servent à
                         parcourir. */
                      onKeyDown={(ev) => {
                        if (!ev.altKey) return;
                        if (ev.key === 'ArrowLeft') {
                          ev.preventDefault();
                          decaler(c.nom, -1);
                        } else if (ev.key === 'ArrowRight') {
                          ev.preventDefault();
                          decaler(c.nom, 1);
                        }
                      }}
                      title={`Trier par ${c.libelle} — glisser l'en-tête, ou Alt+← / Alt+→, pour déplacer la colonne`}
                    >
                      {c.libelle}
                    </button>
                    {trie &&
                      (tri.sens === 'asc' ? (
                        <ChevronUp className="size-3 shrink-0 text-(--brand)" aria-hidden />
                      ) : (
                        <ChevronDown className="size-3 shrink-0 text-(--brand)" aria-hidden />
                      ))}
                    {!c.sansSomme && (<button
                      type="button"
                      className={cn(
                        'shrink-0 rounded px-0.5 hover:bg-muted',
                        sommes.has(c.nom) ? 'text-(--brand)' : 'text-muted-foreground/50',
                      )}
                      onClick={() => basculerSomme(c.nom)}
                      title={
                        NUMERIQUES.includes(typeDe(c))
                          ? `Afficher le total de ${c.libelle}`
                          : `Compter les ${c.libelle} renseignés`
                      }
                      aria-pressed={sommes.has(c.nom)}
                    >
                      <Sigma className="size-2.75" aria-hidden />
                    </button>)}
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
          {/* Ligne de filtres. Le glyphe annonce le mode de comparaison — `A`
              pour « contient », `=` pour une égalité de forme affichée. */}
          <TableRow className="hover:bg-transparent">
            {rendreDetail && <TableHead className="h-(--row-h-filter) w-(--gutter-check) bg-card p-0" />}
            <TableHead className="h-(--row-h-filter) w-(--gutter-mark) bg-card p-0" />
            <TableHead className="h-(--row-h-filter) w-(--gutter-check) bg-card p-0" />
            {actions && <TableHead className="h-(--row-h-filter) bg-card p-0" />}
            {colonnes.map((c) => (
              <TableHead key={c.nom} className="h-(--row-h-filter) bg-card p-0">
                <span className="flex h-full items-center">
                  <span
                    className="w-3.5 shrink-0 text-center font-mono text-micro text-muted-foreground/70"
                    aria-hidden
                    title={typeDe(c) === 'TEXTE' ? 'Contient' : 'Égal à'}
                  >
                    {glypheOperateur(typeDe(c))}
                  </span>
                  <input
                    value={filtres[c.nom] ?? ''}
                    onChange={(e) => setFiltres((f) => ({ ...f, [c.nom]: e.target.value }))}
                    className="h-full min-w-0 flex-1 bg-transparent pr-1 text-micro font-normal outline-none placeholder:text-muted-foreground/40 focus:bg-(--brand-bg)"
                    placeholder="…"
                    aria-label={`Filtrer sur ${c.libelle}`}
                  />
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupes
            ? groupes.liste.map((g) => {
                const ouvert = groupes.estOuvert(g);
                const etat = groupes.etat(g);
                const lignes = etat ? appliquer(etat.lignes) : [];
                const reste = etat ? etat.total - etat.lignes.length : 0;
                return (
                  <Fragment key={identiteGroupe(g)}>
                    {/* L'en-tête de groupe : `⊟ Statut : CONCRETISATION
                        (68 items)`, puis les bandes « Total : ». Il couvre
                        toute la largeur — aligner les totaux sous leurs
                        colonnes supposerait que celles-ci soient affichées, ce
                        qu'une colonne décochée dément. */}
                    <TableRow
                      className="cursor-pointer bg-muted/60 hover:bg-muted"
                      tabIndex={0}
                      aria-expanded={ouvert}
                      aria-label={`${ouvert ? 'Replier' : 'Déplier'} le groupe ${libelleGroupeAffiche(g)} — ${g.nombre} ligne(s)`}
                      onClick={() => groupes.basculer(g)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') groupes.basculer(g);
                      }}
                    >
                      <TableCell colSpan={nbColonnes} className="whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          {ouvert ? (
                            <SquareMinus aria-hidden className="size-3 shrink-0 text-(--brand)" />
                          ) : (
                            <SquarePlus aria-hidden className="size-3 shrink-0 text-muted-foreground" />
                          )}
                          <span className="shrink-0 text-muted-foreground">{groupes.colonneLibelle} :</span>
                          <span
                            className={cn(
                              'truncate font-semibold',
                              /* Le groupe des lignes sans valeur est légitime,
                                 pas une anomalie : il est servi pour que la
                                 somme des effectifs retombe sur le total de la
                                 liste. Il se lit comme une absence. */
                              g.libelle === null ? 'font-normal text-muted-foreground italic' : 'text-foreground',
                            )}
                          >
                            {libelleGroupeAffiche(g)}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            ({formatNumber(g.nombre)} item{g.nombre > 1 ? 's' : ''})
                          </span>
                          {groupes.agregats.length > 0 && (
                            <span className="flex shrink-0 items-center gap-3 pl-4 text-micro">
                              {groupes.agregats.map((a) => (
                                <span key={a.jeton}>
                                  <span className="text-muted-foreground">{libelleAgregat(a)} : </span>
                                  <span className="font-semibold tabular-nums">
                                    {formatAgregat(
                                      g.agregats?.[a.jeton],
                                      parNom.get(a.colonne.nom),
                                      a.fonction,
                                      a.colonne.type,
                                    )}
                                  </span>
                                </span>
                              ))}
                            </span>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                    {ouvert && lignes.map(rendreLigne)}
                    {ouvert && etat?.erreur && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={nbColonnes} className="text-destructive">
                          {etat.erreur}
                        </TableCell>
                      </TableRow>
                    )}
                    {ouvert && etat?.chargement && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={nbColonnes} className="text-muted-foreground">
                          Chargement…
                        </TableCell>
                      </TableRow>
                    )}
                    {/* Le reste non chargé est **annoncé**, pas tu : un groupe
                        qui dit « 3 145 items » et n'en montre que 20 doit dire
                        pourquoi, sinon l'écran a l'air faux. */}
                    {ouvert && !etat?.chargement && reste > 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={nbColonnes}>
                          <button
                            type="button"
                            className="text-micro text-(--brand) hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              groupes.chargerPlus(g);
                            }}
                          >
                            {formatNumber(reste)} ligne(s) de plus dans ce groupe — en charger{' '}
                            {formatNumber(Math.min(reste, TAILLE_LOT_GROUPE))}
                          </button>
                        </TableCell>
                      </TableRow>
                    )}
                    {ouvert && !etat?.chargement && etat && etat.lignes.length === 0 && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={nbColonnes} className="text-muted-foreground">
                          Ce groupe ne contient aucune ligne avec les filtres actifs.
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            : visibles.map(rendreLigne)}
          {/* Le « Total : » de bas de grille, servi par le serveur sur **tout
              le périmètre filtré**.

              Distinct du pied Σ plus bas, qui ne somme que les lignes
              effectivement chargées — donc les seuls groupes ouverts. Les deux
              peuvent être à l'écran en même temps et donner des nombres
              différents : c'est pourquoi celui-ci porte son effectif, et
              l'autre son intitulé. Deux totaux non étiquetés côte à côte se
              contrediraient. */}
          {groupes && groupes.agregats.length > 0 && (
            <TableRow className="border-t border-border bg-(--surface-hover) hover:bg-(--surface-hover)">
              <TableCell colSpan={nbColonnes} className="whitespace-nowrap">
                <span className="flex items-center gap-3 text-micro">
                  <span className="shrink-0 font-semibold">
                    Total sur {formatNumber(groupes.nombreTotal)} ligne(s)
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    {groupes.agregats.map((a) => (
                      <span key={a.jeton}>
                        <span className="text-muted-foreground">{libelleAgregat(a)} : </span>
                        <span className="font-semibold tabular-nums">
                          {formatAgregat(
                            groupes.totaux?.[a.jeton],
                            parNom.get(a.colonne.nom),
                            a.fonction,
                            a.colonne.type,
                          )}
                        </span>
                      </span>
                    ))}
                  </span>
                </span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {sommes.size > 0 && (
          <TableFooter>
            <TableRow className="hover:bg-muted/50">
              {rendreDetail && <TableCell className="w-(--gutter-check) p-0" />}
              <TableCell className="w-(--gutter-mark) p-0" />
              <TableCell className="w-(--gutter-check) p-0" />
              {actions && <TableCell className="px-1" />}
              {colonnes.map((c) => (
                <TableCell
                  key={c.nom}
                  className={cn('truncate text-micro', aDroite(c) && 'text-right tabular-nums')}
                  style={{ maxWidth: plafondColonne(c) }}
                >
                  {resumes.get(c.nom) ?? null}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  );
}
