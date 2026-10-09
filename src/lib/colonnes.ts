import { useCallback, useMemo, useState } from 'react';
import type { ColonneDto } from '../types';

/** Le serveur envoie des clés d'énumération ; un groupe inconnu retombe sur sa clé brute plutôt que de disparaître. */
export const LIBELLES_GROUPE: Record<string, string> = {
  IDENTITE: 'Identité',
  CONTACT: 'Contact',
  CONTEXTE: 'Contexte',
  FINANCIER: 'Financier',
  ACTIVITE: 'Activité',
  CONVERSION: 'Conversion',
  ACTEURS: 'Acteurs',
  ORIGINE: 'Origine',
  PATRIMOINE: 'Patrimoine',
  ARTICLE: 'Article',
  DELAIS: 'Délais',
  SUIVI: 'Suivi',
  ADRESSE: 'Adresse',
  PROFESSION: 'Profession',
  ACTION: 'Action',
  RATTACHEMENT: 'Rattachement',
  IDENTIFIANTS: 'Identifiants',
  AUDIT: 'Traçabilité',
};

export function libelleGroupe(groupe: string): string {
  return LIBELLES_GROUPE[groupe] ?? groupe;
}

/** Distinct de `normalizeStatus` (`dossierStatus.ts`), qui supprime aussi les espaces : ici ils séparent les mots. */
export function sansAccents(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function filtrerColonnes(catalogue: ColonneDto[], requete: string): ColonneDto[] {
  const mots = sansAccents(requete).split(/\s+/).filter(Boolean);
  if (mots.length === 0) return catalogue;
  return catalogue.filter((c) => {
    const cible = sansAccents(`${c.libelle} ${c.nom} ${libelleGroupe(c.groupe)}`);
    return mots.every((mot) => cible.includes(mot));
  });
}

export type DispositionColonnes = {
  /** Un nom absent passe en fin, dans l'ordre du catalogue. */
  ordre: string[];
  poids: Record<string, number>;
  /** Le `parDefaut` du serveur décrit la charge utile, pas la grille : il inclut des clés UUID à ne jamais afficher. */
  masquees?: Set<string>;
  /** `?colonnes=` est une liste close : un compagnon non demandé est absent de la charge utile, et la colonne qui
   * s'appuie dessus se dégrade en silence (lien remplacé par un tiret). */
  dependances?: Record<string, string[]>;
  /** Demandées quelle que soit la sélection, car la grille en a besoin sans les afficher. Sans effet sur les
   * défauts : aucun paramètre n'est alors envoyé, et le serveur les sert déjà en `parDefaut`. */
  toujoursDemandees?: string[];
};

const POIDS_DEFAUT = 10;

export function poidsColonne(nom: string, poids: Record<string, number>): number {
  return poids[nom] ?? POIDS_DEFAUT;
}

const PREFIXE_STOCKAGE = 'arpent.colonnes.';
/** Clé distincte de la sélection : les mélanger ferait perdre l'ordre à chaque colonne cochée, et inversement. */
const PREFIXE_ORDRE = 'arpent.ordre-colonnes.';

function lireNoms(cleComplete: string): string[] | null {
  try {
    const brut = window.localStorage.getItem(cleComplete);
    if (!brut) return null;
    const parsed: unknown = JSON.parse(brut);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((n): n is string => typeof n === 'string');
  } catch {
    return null;
  }
}

function ecrireNoms(cleComplete: string, noms: string[] | null) {
  try {
    if (noms === null) window.localStorage.removeItem(cleComplete);
    else window.localStorage.setItem(cleComplete, JSON.stringify(noms));
  } catch {
    // Navigation privée ou quota plein : la préférence vaut pour la session.
  }
}

function lireStockees(cle: string): string[] | null {
  return lireNoms(PREFIXE_STOCKAGE + cle);
}

/** Rien n'est stocké tant que l'utilisateur n'a rien déplacé : l'écran suit son défaut, qui peut évoluer.
 * Une colonne absente de l'ordre stocké passe en fin, pour qu'une colonne ajoutée côté serveur apparaisse.
 * `cle` absente = ordre en mémoire seulement, perdu au rechargement. */
export function useOrdreColonnes<C extends { nom: string }>(
  cle: string | undefined,
  colonnes: C[],
): {
  colonnesOrdonnees: C[];
  deplacerVers: (nom: string, cible: string) => void;
  decaler: (nom: string, sens: -1 | 1) => void;
  reinitialiser: () => void;
  personnalise: boolean;
} {
  const [ordre, setOrdre] = useState<string[] | null>(() => (cle ? lireNoms(PREFIXE_ORDRE + cle) : null));

  const colonnesOrdonnees = useMemo(() => {
    if (!ordre || ordre.length === 0) return colonnes;
    const parNom = new Map<string, C>(colonnes.map((c) => [c.nom, c]));
    const place = new Set(ordre);
    const connues = ordre.map((n) => parNom.get(n)).filter((c): c is C => c !== undefined);
    return [...connues, ...colonnes.filter((c) => !place.has(c.nom))];
  }, [colonnes, ordre]);

  const enregistrer = useCallback(
    (noms: string[] | null) => {
      setOrdre(noms);
      if (cle) ecrireNoms(PREFIXE_ORDRE + cle, noms);
    },
    [cle],
  );

  /* Toujours réécrit en entier : un ordre partiel rendrait la position d'une colonne dépendante de celles
     visibles au moment du déplacement. */
  const noms = useMemo(() => colonnesOrdonnees.map((c) => c.nom), [colonnesOrdonnees]);

  const deplacerVers = useCallback(
    (nom: string, cible: string) => {
      const depuis = noms.indexOf(nom);
      const vers = noms.indexOf(cible);
      if (depuis === -1 || vers === -1 || depuis === vers) return;
      const suivant = [...noms];
      suivant.splice(depuis, 1);
      suivant.splice(vers, 0, nom);
      enregistrer(suivant);
    },
    [noms, enregistrer],
  );

  const decaler = useCallback(
    (nom: string, sens: -1 | 1) => {
      const depuis = noms.indexOf(nom);
      const vers = depuis + sens;
      if (depuis === -1 || vers < 0 || vers >= noms.length) return;
      const suivant = [...noms];
      suivant.splice(depuis, 1);
      suivant.splice(vers, 0, nom);
      enregistrer(suivant);
    },
    [noms, enregistrer],
  );

  const reinitialiser = useCallback(() => enregistrer(null), [enregistrer]);

  return { colonnesOrdonnees, deplacerVers, decaler, reinitialiser, personnalise: !!ordre && ordre.length > 0 };
}

/** Rien n'est stocké tant que rien n'a changé, et « réinitialiser » efface l'entrée : l'écran suit le `parDefaut`
 * du serveur, qui peut évoluer. Tant que le catalogue (asynchrone) est vide, `colonnes` l'est aussi.
 * Donner au sélecteur `catalogueServi` (masquées retirées), pas le catalogue brut. */
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
        // Navigation privée ou quota plein : la sélection vaut pour la session.
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
        // La dernière colonne cochée se verrouille : l'invariant vit ici, pas dans l'UI.
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

  /* `undefined` sur les défauts, à ne pas casser : `estDefaut` est aussi vrai tant que le catalogue est vide,
     donc la clé de `useApi` ne change pas quand il arrive, et pas de seconde requête. */
  const nomsCatalogue = new Set(catalogueBrut.map((c) => c.nom));
  const demandees = estDefaut
    ? undefined
    : [
        ...new Set([
          ...visibles.flatMap((nom) => [nom, ...(disposition.dependances?.[nom] ?? [])]),
          // Filtrées sur le catalogue : un nom inconnu du serveur fait 400 sur toute la liste.
          ...(disposition.toujoursDemandees ?? []).filter((n) => nomsCatalogue.has(n)),
        ]),
      ];

  return { colonnes, visibles, demandees, basculer, reinitialiser, estDefaut, catalogueServi };
}
