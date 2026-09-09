import { useCallback, useState } from 'react';

/** Type d'une colonne — reprend les cinq valeurs que renverra
 * `GET /api/referentiels/colonnes/prospections`. Il porte l'alignement et le
 * formatage, ce qui évite une table de correspondance côté front. */
export type TypeColonne = 'texte' | 'nombre' | 'date' | 'montant' | 'booleen';

/** Une colonne sélectionnable.
 *
 * Les cinq premiers champs sont exactement ceux du référentiel serveur décrit
 * au §5.3 du `GUIDE-FRONT-fiche-prospection.md`, pour que le jour où
 * l'endpoint existe, la bascule soit un remplacement de source et non une
 * réécriture. Les deux derniers sont des ajouts front, additifs :
 *
 * - `champs` existe parce qu'une colonne d'écran ne vaut pas toujours un champ
 *   de DTO — « Tranche » lit `trancheDescription` avec repli sur `trancheCode`,
 *   comme partout ailleurs dans l'application. C'est aussi ce qu'il faudra
 *   envoyer dans `?colonnes=` : `colonnes.flatMap((c) => c.champs)`.
 * - `poids` remplace les pourcentages en dur du `table-fixed` : avec une
 *   sélection variable, une largeur absolue ne tient plus. Les valeurs
 *   reprennent les pourcentages actuels, normalisés à l'affichage. */
export interface ColonneDefinition {
  nom: string;
  libelle: string;
  groupe: string;
  type: TypeColonne;
  parDefaut: boolean;
  champs: string[];
  poids: number;
}

/** Catalogue des colonnes de prospection.
 *
 * Limité aux 20 champs que `ProspectionListItemDto` sert **aujourd'hui**
 * (guide §4). Les colonnes réellement intéressantes — `joursInactivite`,
 * `nbInteractions`, `derniereCommunicationDate`, `nbVisites`, `dossierCode` —
 * n'y sont pas : elles vivent dans le bloc `activite` du DTO de *détail*, et
 * les servir en liste sans sélection de colonnes coûte 5 942 ms à la page 250
 * contre 123 ms. C'est précisément ce que le mécanisme du §5 doit débloquer.
 *
 * `parDefaut` reproduit à l'identique les neuf colonnes affichées jusqu'ici :
 * le jour où le serveur prendra `?colonnes=` en compte, personne ne verra son
 * écran changer (guide §5.4.2).
 *
 * Sont volontairement absents du catalogue les champs déjà rendus par une
 * autre colonne : `fermee` (le badge d'étape affiche « Clôturée »),
 * `tempDescription` (repli du nom du prospect), `derniereAlerteMessage`
 * (infobulle de la colonne Relance), et les identifiants techniques.
 *
 * **L'ordre du tableau est l'ordre d'affichage**, pas l'ordre des sections du
 * sélecteur : il reproduit exactement celui des neuf colonnes d'avant, d'où un
 * `groupe` qui n'est pas contigu (Date et Code sont tous deux « Identité » mais
 * séparés). Le sélecteur regroupe par `groupe` de son côté, donc rien ne
 * l'oblige à l'être ici — et c'est bien l'affichage qui doit rester stable. */
export const COLONNES_PROSPECTION: ColonneDefinition[] = [
  { nom: 'code', libelle: 'Code', groupe: 'Identité', type: 'texte', parDefaut: false, champs: ['code'], poids: 9 },
  { nom: 'prospectNom', libelle: 'Prospect', groupe: 'Identité', type: 'texte', parDefaut: true, champs: ['prospectNom', 'tempDescription', 'code'], poids: 17 },
  { nom: 'etape', libelle: 'Étape', groupe: 'Suivi', type: 'texte', parDefaut: true, champs: ['etape', 'fermee'], poids: 10 },
  { nom: 'origine', libelle: 'Origine', groupe: 'Suivi', type: 'texte', parDefaut: true, champs: ['origine'], poids: 10 },
  { nom: 'commercialNom', libelle: 'Commercial', groupe: 'Suivi', type: 'texte', parDefaut: true, champs: ['commercialNom'], poids: 11 },
  { nom: 'tranche', libelle: 'Tranche', groupe: 'Bien', type: 'texte', parDefaut: false, champs: ['trancheDescription', 'trancheCode'], poids: 12 },
  { nom: 'prix', libelle: 'Prix', groupe: 'Bien', type: 'montant', parDefaut: true, champs: ['prix'], poids: 11 },
  { nom: 'surface', libelle: 'Superficie', groupe: 'Bien', type: 'nombre', parDefaut: false, champs: ['surface'], poids: 9 },
  { nom: 'dateDocument', libelle: 'Date', groupe: 'Identité', type: 'date', parDefaut: true, champs: ['dateDocument'], poids: 9 },
  { nom: 'telephone', libelle: 'Téléphone', groupe: 'Contact', type: 'texte', parDefaut: true, champs: ['telephone'], poids: 10 },
  { nom: 'email', libelle: 'Email', groupe: 'Contact', type: 'texte', parDefaut: true, champs: ['email'], poids: 12 },
  { nom: 'derniereAlerteDate', libelle: 'Relance', groupe: 'Suivi', type: 'date', parDefaut: true, champs: ['derniereAlerteDate', 'derniereAlerteMessage'], poids: 10 },
];

const PREFIXE_STOCKAGE = 'ayad.colonnes.';

function defauts(catalogue: ColonneDefinition[]): string[] {
  return catalogue.filter((c) => c.parDefaut).map((c) => c.nom);
}

/** Relit la sélection stockée en la confrontant au catalogue.
 *
 * Le filtrage contre les noms connus n'est pas de la prudence gratuite : le
 * catalogue va dériver (c'est la raison d'être du référentiel serveur du
 * §5.3), et une préférence enregistrée il y a six mois peut nommer une colonne
 * qui n'existe plus. Sans ce tri, elle ferait planter le rendu ; avec, elle
 * disparaît en silence, ce qui est le bon comportement.
 *
 * Une sélection vide retombe sur les défauts plutôt que d'afficher un tableau
 * sans colonne — cas atteignable en éditant `localStorage` à la main. */
function lireSelection(cle: string, catalogue: ColonneDefinition[]): string[] {
  try {
    const brut = window.localStorage.getItem(PREFIXE_STOCKAGE + cle);
    if (!brut) return defauts(catalogue);
    const parsed: unknown = JSON.parse(brut);
    if (!Array.isArray(parsed)) return defauts(catalogue);
    const connus = new Set(catalogue.map((c) => c.nom));
    const retenues = parsed.filter((n): n is string => typeof n === 'string' && connus.has(n));
    return retenues.length > 0 ? retenues : defauts(catalogue);
  } catch {
    return defauts(catalogue);
  }
}

/** Sélection de colonnes persistée par écran.
 *
 * `localStorage` et non le serveur : aucune table légataire ne stocke de
 * disposition de colonnes — le logiciel de bureau les garde sur le poste
 * client (guide §5.4.1). Retrouver son affichage d'un poste à l'autre est une
 * décision métier distincte, à demander via `from_front.md` si elle se pose.
 *
 * L'ordre d'affichage est celui du catalogue, jamais celui de la sélection :
 * cocher puis décocher une colonne ne doit pas la déplacer. */
export function useColonnesVisibles(cle: string, catalogue: ColonneDefinition[]) {
  const [visibles, setVisibles] = useState<string[]>(() => lireSelection(cle, catalogue));

  const enregistrer = useCallback(
    (noms: string[]) => {
      setVisibles(noms);
      try {
        window.localStorage.setItem(PREFIXE_STOCKAGE + cle, JSON.stringify(noms));
      } catch {
        // Navigation privée ou quota plein : la sélection reste valable pour
        // la session, elle ne survivra simplement pas au rechargement. Rien à
        // signaler à l'utilisateur, qui n'y peut rien.
      }
    },
    [cle],
  );

  const basculer = useCallback(
    (nom: string) => {
      // Le garde-fou du dernier décochage vit ici plutôt que dans l'UI : c'est
      // l'invariant « un tableau a au moins une colonne », pas une règle
      // d'affichage.
      if (visibles.includes(nom)) {
        if (visibles.length === 1) return;
        enregistrer(visibles.filter((n) => n !== nom));
      } else {
        enregistrer([...visibles, nom]);
      }
    },
    [visibles, enregistrer],
  );

  const reinitialiser = useCallback(() => enregistrer(defauts(catalogue)), [enregistrer, catalogue]);

  const selection = new Set(visibles);
  const colonnes = catalogue.filter((c) => selection.has(c.nom));
  const parDefaut = defauts(catalogue);
  const estDefaut = colonnes.length === parDefaut.length && parDefaut.every((n) => selection.has(n));

  return { colonnes, visibles, basculer, reinitialiser, estDefaut };
}
