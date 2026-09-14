import { useCallback, useState } from 'react';
import type { ColonneDto } from '../types';

/** Libellés des groupes du sélecteur. Le serveur envoie des clés
 * d'énumération (`IDENTITE`…), pas des libellés : la traduction est une
 * décision d'affichage, elle reste ici. Un groupe inconnu — le serveur en
 * ajoutera — retombe sur sa clé brute plutôt que de disparaître. */
export const LIBELLES_GROUPE: Record<string, string> = {
  // Prospections
  IDENTITE: 'Identité',
  CONTACT: 'Contact',
  CONTEXTE: 'Contexte',
  FINANCIER: 'Financier',
  ACTIVITE: 'Activité',
  CONVERSION: 'Conversion',
  // Dossiers de vente
  ACTEURS: 'Acteurs',
  ORIGINE: 'Origine',
  PATRIMOINE: 'Patrimoine',
  ARTICLE: 'Article',
  DELAIS: 'Délais',
  // Encaissements
  SUIVI: 'Suivi',
  // Prospects
  ADRESSE: 'Adresse',
  PROFESSION: 'Profession',
  // Les trois catalogues
  AUDIT: 'Traçabilité',
};

export function libelleGroupe(groupe: string): string {
  return LIBELLES_GROUPE[groupe] ?? groupe;
}

/** Minuscules sans accents. Distinct de `normalizeStatus` de `dossierStatus.ts`,
 * qui supprime aussi les espaces : ici ils séparent les mots de la recherche. */
function sansAccents(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Recherche dans le catalogue de colonnes.
 *
 * Multi-mots et non sous-chaîne unique : les mots saisis doivent tous
 * apparaître, dans n'importe quel ordre. « date com » trouve donc « Dernière
 * communication », ce qu'un simple `includes` sur la chaîne entière raterait.
 *
 * Trois cibles par colonne : le libellé, le **nom technique** — quelqu'un qui a
 * lu la spec cherchera `joursInactivite` avant « Inactivité » — et le libellé du
 * groupe, ce qui fait de « activité » un moyen d'afficher la section entière. */
export function filtrerColonnes(catalogue: ColonneDto[], requete: string): ColonneDto[] {
  const mots = sansAccents(requete).split(/\s+/).filter(Boolean);
  if (mots.length === 0) return catalogue;
  return catalogue.filter((c) => {
    const cible = sansAccents(`${c.libelle} ${c.nom} ${libelleGroupe(c.groupe)}`);
    return mots.every((mot) => cible.includes(mot));
  });
}

/** Mise en page d'une liste : ce que le catalogue serveur ne porte pas.
 *
 * Une par écran, et non une table globale, parce que les trois catalogues
 * partagent des noms avec des intentions différentes — `code` tient en 9 sur
 * une prospection, en 11 sur un dossier et en 12 sur un prospect ; `email` en
 * 12 contre 18. Une table unique donnerait des largeurs mesurément fausses sur
 * au moins cinq colonnes, et rangerait ex æquo tous les noms propres à un seul
 * écran.
 *
 * Vit à côté de l'adaptateur de tableau qui la consomme, pas ici : ce fichier
 * porte le mécanisme, les écrans portent leurs choix. */
export type DispositionColonnes = {
  /** Ordre d'affichage. Un nom absent passe en fin, dans l'ordre du catalogue —
   * une colonne ajoutée côté serveur apparaît donc sans toucher à ce tableau. */
  ordre: string[];
  /** Poids relatifs, normalisés par `DataGrid`. Défaut `POIDS_DEFAUT`. */
  poids: Record<string, number>;
  /** Colonnes du catalogue jamais proposées ni affichées.
   *
   * Le `parDefaut` du serveur décrit la charge utile, pas la grille : les 13
   * défauts des dossiers comprennent `id`, `clientId`, `commercialId` et
   * `prospectionId`. Sans ce filtre, la vue par défaut montre des UUID. */
  masquees?: Set<string>;
  /** Colonnes à demander en plus quand la clé est visible.
   *
   * `?colonnes=` est une liste close : un champ non demandé n'est **pas** dans
   * la charge utile — vérifié contre le serveur, `prospectionCode` revient bien
   * sans `prospectionId` quand on ne demande que le premier.
   *
   * La colonne qui s'appuie sur le compagnon se dégrade alors en silence : le
   * rendu de `prospectionCode` teste `d.prospectionId` et retombe sur un tiret,
   * si bien que le lien vers la prospection **disparaît** sans erreur, sans
   * trace, et sans que rien à l'écran n'explique pourquoi. */
  dependances?: Record<string, string[]>;
  /** Colonnes demandées au serveur **quelle que soit la sélection**, parce que
   * la grille en a besoin sans les afficher.
   *
   * Distinct de `dependances`, qui s'accroche à une colonne *visible* : ici
   * rien ne s'affiche. Le cas réel est le fond rouge des relances en retard,
   * calculé sur `derniereAlerteDate` et `fermee` — décocher l'une des deux
   * ferait disparaître le repère sans que rien ne l'explique, `?colonnes=`
   * étant une liste close.
   *
   * N'a d'effet que **hors** sélection par défaut : tant qu'on est sur les
   * défauts, aucun paramètre n'est envoyé et le serveur sert déjà ces colonnes
   * puisqu'elles sont `parDefaut`. La propriété « ne rien envoyer sur les
   * défauts » reste donc intacte. */
  toujoursDemandees?: string[];
};

const POIDS_DEFAUT = 10;

export function poidsColonne(nom: string, poids: Record<string, number>): number {
  return poids[nom] ?? POIDS_DEFAUT;
}

const PREFIXE_STOCKAGE = 'arpent.colonnes.';

function lireStockees(cle: string): string[] | null {
  try {
    const brut = window.localStorage.getItem(PREFIXE_STOCKAGE + cle);
    if (!brut) return null;
    const parsed: unknown = JSON.parse(brut);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((n): n is string => typeof n === 'string');
  } catch {
    return null;
  }
}

/** Sélection de colonnes persistée par écran.
 *
 * `localStorage` et non le serveur : aucune table légataire ne stocke de
 * disposition de colonnes, le logiciel de bureau les garde sur le poste
 * client. Retrouver son affichage d'un poste à l'autre serait une décision
 * métier distincte.
 *
 * **Rien n'est stocké tant que l'utilisateur n'a rien changé**, et
 * « réinitialiser » efface l'entrée au lieu d'y écrire les défauts du jour :
 * l'écran suit ainsi le `parDefaut` du serveur, qui peut évoluer — `prix`
 * vient précisément d'en sortir.
 *
 * Le catalogue arrive de façon asynchrone : tant qu'il est vide, `colonnes`
 * l'est aussi, et l'appelant doit attendre avant de dessiner un tableau. Une
 * préférence enregistrée nommant une colonne disparue du catalogue est ignorée
 * en silence — c'est le bon comportement, pas un plantage.
 *
 * `catalogue` est le catalogue **brut** du serveur : le hook lui applique
 * `disposition.masquees` et renvoie le résultat dans `catalogueServi`, qui est
 * ce qu'il faut donner au sélecteur. Un écran qui a besoin d'un filtre
 * supplémentaire — les pré-prospections écartent deux groupes entiers — le pose
 * avant l'appel ; les deux se composent. */
export function useColonnesVisibles(
  cle: string,
  catalogueBrut: ColonneDto[],
  disposition: DispositionColonnes,
) {
  const [stockees, setStockees] = useState<string[] | null>(() => lireStockees(cle));

  const enregistrer = useCallback(
    (noms: string[] | null) => {
      setStockees(noms);
      try {
        if (noms === null) window.localStorage.removeItem(PREFIXE_STOCKAGE + cle);
        else window.localStorage.setItem(PREFIXE_STOCKAGE + cle, JSON.stringify(noms));
      } catch {
        // Navigation privée ou quota plein : la sélection vaut pour la session
        // et ne survivra pas au rechargement. L'utilisateur n'y peut rien, on
        // ne l'en informe pas.
      }
    },
    [cle],
  );

  const masquees = disposition.masquees;
  const catalogueServi = masquees ? catalogueBrut.filter((c) => !masquees.has(c.nom)) : catalogueBrut;

  const rang = (nom: string) => {
    const i = disposition.ordre.indexOf(nom);
    return i === -1 ? disposition.ordre.length : i;
  };

  const connus = new Set(catalogueServi.map((c) => c.nom));
  const retenues = (stockees ?? []).filter((n) => connus.has(n));
  const selection = new Set(
    retenues.length > 0 ? retenues : catalogueServi.filter((c) => c.parDefaut).map((c) => c.nom),
  );

  const colonnes = catalogueServi
    .filter((c) => selection.has(c.nom))
    .sort((a, b) => rang(a.nom) - rang(b.nom));
  const visibles = colonnes.map((c) => c.nom);

  const basculer = useCallback(
    (nom: string) => {
      const suivantes = visibles.includes(nom)
        // Un tableau sans colonne n'a pas de sens : la dernière cochée se
        // verrouille. L'invariant vit ici et non dans l'UI.
        ? visibles.length === 1
          ? null
          : visibles.filter((n) => n !== nom)
        : [...visibles, nom];
      if (suivantes) enregistrer(suivantes);
    },
    [visibles, enregistrer],
  );

  const reinitialiser = useCallback(() => enregistrer(null), [enregistrer]);

  const parDefaut = catalogueServi.filter((c) => c.parDefaut).map((c) => c.nom);
  const estDefaut =
    stockees === null || (visibles.length === parDefaut.length && parDefaut.every((n) => selection.has(n)));

  /* Ce qu'il faut passer à `?colonnes=`, et `undefined` quand la sélection ne
     s'écarte pas des défauts.
     Deux raisons de ne rien envoyer dans ce cas : le paramètre absent produit
     exactement la réponse par défaut, et comme `estDefaut` est aussi vrai tant
     que le catalogue est vide, la clé de dépendance de `useApi` ne change pas
     quand le catalogue atterrit — donc pas de seconde requête. Propriété
     portante, ne pas la casser.
     Les colonnes masquées ne sont jamais demandées : `id` est servi de toute
     façon, et les autres `*Id` n'arrivent que par une dépendance déclarée. */
  const nomsCatalogue = new Set(catalogueBrut.map((c) => c.nom));
  const demandees = estDefaut
    ? undefined
    : [
        ...new Set([
          ...visibles.flatMap((nom) => [nom, ...(disposition.dependances?.[nom] ?? [])]),
          // Filtrées sur le catalogue : un nom inconnu du serveur fait 400 sur
          // toute la liste, et cette table est écrite à la main alors que le
          // catalogue, lui, bouge d'une livraison à l'autre.
          ...(disposition.toujoursDemandees ?? []).filter((n) => nomsCatalogue.has(n)),
        ]),
      ];

  return { colonnes, visibles, demandees, basculer, reinitialiser, estDefaut, catalogueServi };
}
