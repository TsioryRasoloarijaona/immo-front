import { useCallback, useState } from 'react';
import type { ColonneDto, GroupeColonne } from '../types';

/** Libellés des groupes du sélecteur. Le serveur envoie des clés
 * d'énumération (`IDENTITE`…), pas des libellés : la traduction est une
 * décision d'affichage, elle reste ici. Un groupe inconnu — le serveur en
 * ajoutera — retombe sur sa clé brute plutôt que de disparaître. */
export const LIBELLES_GROUPE: Record<GroupeColonne, string> = {
  IDENTITE: 'Identité',
  CONTACT: 'Contact',
  CONTEXTE: 'Contexte',
  FINANCIER: 'Financier',
  ACTIVITE: 'Activité',
  CONVERSION: 'Conversion',
};

export function libelleGroupe(groupe: string): string {
  return LIBELLES_GROUPE[groupe as GroupeColonne] ?? groupe;
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

/** Ordre d'affichage des colonnes connues, et **rien d'autre** : ni la liste
 * des colonnes, ni lesquelles sont par défaut, qui viennent maintenant du
 * serveur. Les colonnes hors de cette liste s'affichent après, dans l'ordre
 * du catalogue — une colonne ajoutée côté serveur apparaît donc sans qu'on
 * touche à ce fichier, simplement en fin de tableau.
 *
 * Les huit premières reproduisent l'ordre historique de la liste, pour que le
 * passage à la sélection serveur ne déplace rien à l'écran. `prix` n'y est
 * plus par défaut — mesuré mort, 4 lignes sur 14 114 — mais garde son rang au
 * cas où on le coche. */
const ORDRE = [
  // Identité du lead et de son prospect
  'code',
  'prospectCode',
  'prospectNom',
  'typeProspect',
  'ancienClient',
  // Type de document légataire. Juste après `typeProspect` parce que les deux
  // se confondent au premier coup d'œil et qu'il vaut mieux les voir côte à
  // côte que séparés par dix colonnes. `typeProspectionId` n'est pas listé :
  // c'est un UUID, il n'a rien à faire dans une colonne.
  'typeProspectionCode',
  'typeProspection',
  // Suivi commercial
  'etape',
  'origine',
  'origineSupport',
  'actionCommerciale',
  'commercialNom',
  'commercialCode',
  // Rattachements
  'societeCode',
  'societeLibelle',
  'trancheCode',
  'trancheDescription',
  'projetCode',
  'projetLibelle',
  // Financier — mesuré mort, hors défauts, mais gardé à son rang historique
  'prix',
  'surface',
  'dateDocument',
  // Contact. `telephone`/`email` appliquent un repli ; les variantes « fiche »
  // sont les valeurs brutes, utiles pour éditer ou dédoublonner.
  'telephone',
  'indicatifMobile',
  'mobileProspect',
  'email',
  'emailFiche',
  'pays',
  'cin',
  // Relance et clôture
  'derniereAlerteDate',
  'dateFermeture',
  'raisonFermeture',
  // Activité, servie par la vue légataire
  'joursInactivite',
  'nbInteractions',
  'derniereActionDate',
  'derniereCommunicationDate',
  'derniereCommunicationResultat',
  'nbVisites',
  'derniereVisiteDate',
  // Conversion
  'dossierCode',
  'statutDossier',
  // Traçabilité, en dernier : utile ponctuellement, jamais au quotidien
  'creeLe',
  'creePar',
  'modifieLe',
  'modifiePar',
];

/** Largeurs relatives, normalisées à l'affichage. Le serveur ne porte pas
 * cette information et n'a pas à la porter : c'est de la mise en page. Les
 * valeurs reprennent les pourcentages en dur d'avant le sélecteur. */
const POIDS: Record<string, number> = {
  code: 9,
  prospectCode: 9,
  prospectNom: 17,
  typeProspect: 10,
  // `ComPreProspection` est le plus long code servi — 12 suffit sans tronquer.
  typeProspectionCode: 12,
  typeProspection: 11,
  ancienClient: 8,
  etape: 10,
  origine: 10,
  origineSupport: 11,
  actionCommerciale: 12,
  commercialNom: 11,
  commercialCode: 9,
  societeCode: 9,
  societeLibelle: 12,
  trancheCode: 9,
  trancheDescription: 12,
  projetCode: 9,
  projetLibelle: 12,
  prix: 11,
  surface: 9,
  dateDocument: 9,
  telephone: 10,
  indicatifMobile: 7,
  mobileProspect: 10,
  email: 12,
  emailFiche: 12,
  pays: 9,
  cin: 9,
  derniereAlerteDate: 10,
  dateFermeture: 9,
  raisonFermeture: 12,
  creeLe: 9,
  creePar: 10,
  modifieLe: 9,
  modifiePar: 10,
  joursInactivite: 9,
  nbInteractions: 8,
  derniereActionDate: 10,
  derniereCommunicationDate: 11,
  derniereCommunicationResultat: 12,
  nbVisites: 8,
  derniereVisiteDate: 10,
  dossierCode: 10,
  statutDossier: 11,
};

const POIDS_DEFAUT = 10;

export function poidsColonne(nom: string): number {
  return POIDS[nom] ?? POIDS_DEFAUT;
}

function rang(nom: string): number {
  const i = ORDRE.indexOf(nom);
  return i === -1 ? ORDRE.length : i;
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
 * en silence — c'est le bon comportement, pas un plantage. */
export function useColonnesVisibles(cle: string, catalogue: ColonneDto[]) {
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

  const connus = new Set(catalogue.map((c) => c.nom));
  const retenues = (stockees ?? []).filter((n) => connus.has(n));
  const selection = new Set(
    retenues.length > 0 ? retenues : catalogue.filter((c) => c.parDefaut).map((c) => c.nom),
  );

  const colonnes = catalogue
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

  const parDefaut = catalogue.filter((c) => c.parDefaut).map((c) => c.nom);
  const estDefaut =
    stockees === null || (visibles.length === parDefaut.length && parDefaut.every((n) => selection.has(n)));

  return { colonnes, visibles, basculer, reinitialiser, estDefaut };
}
