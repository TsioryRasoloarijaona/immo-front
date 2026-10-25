import type { BadgeTone } from '../types';
import type { ResultatImport, TypeImportPatrimoine } from '../types/importPatrimoine';

export const RESULTAT_IMPORT: Record<ResultatImport, { libelle: string; ton: BadgeTone }> = {
  CREATION: { libelle: 'Création', ton: 'success' },
  MISE_A_JOUR: { libelle: 'Mise à jour', ton: 'info' },
  INCHANGEE: { libelle: 'Inchangée', ton: 'neutral' },
  ERREUR: { libelle: 'Erreur', ton: 'warning' },
  NON_VERIFIEE: { libelle: 'Non vérifiée', ton: 'amber' },
};

interface ConfigImport {
  /** Pluriel affiché dans le titre. */
  libelle: string;
  /** Fil d'Ariane : libellé de la liste et sa route. */
  liste: { libelle: string; to: string };
  /** Vrai = le serveur exige une tranche (400 sinon). */
  tranche: boolean;
  /** Complément du nom du fichier modèle (`<code tranche>_STOCK_<suffixe>.xlsx`). */
  suffixe: string;
  /** Contenu du modèle, pour l'aide à la saisie. */
  aide: string;
}

export const CONFIG_IMPORT: Record<TypeImportPatrimoine, ConfigImport> = {
  articles: { libelle: 'articles', liste: { libelle: 'Articles', to: '/articles' }, tranche: true, suffixe: 'ARTICLES', aide: 'de la tranche (pré-rempli avec ses articles)' },
  'sous-articles': { libelle: 'sous-articles', liste: { libelle: 'Sous-articles', to: '/sous-articles' }, tranche: true, suffixe: 'SOUS_ARTICLES', aide: 'de la tranche (pré-rempli avec ses sous-articles)' },
  terrains: { libelle: 'terrains', liste: { libelle: 'Terrains', to: '/terrains' }, tranche: false, suffixe: 'TERRAINS', aide: '(pré-rempli avec les terrains visibles)' },
  presentations: {
    libelle: 'types de présentation', liste: { libelle: 'Référentiels', to: '/configuration/referentiels/types-presentation' },
    tranche: false, suffixe: 'TYPES_PRESENTATION', aide: '(pré-rempli avec les types existants)',
  },
  previsions: { libelle: 'prévisions de base', liste: { libelle: 'Tranches', to: '/tranches' }, tranche: true, suffixe: 'PREVISIONS', aide: 'de la tranche (pré-rempli avec ses prévisions)' },
};

export function typeImportDepuis(valeur: string | null): TypeImportPatrimoine {
  return valeur !== null && Object.hasOwn(CONFIG_IMPORT, valeur) ? (valeur as TypeImportPatrimoine) : 'articles';
}
