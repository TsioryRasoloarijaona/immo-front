import type { BadgeTone } from '../types';
import type { ResultatImport, TypeImportPatrimoine } from '../types/importPatrimoine';

export const RESULTAT_IMPORT: Record<ResultatImport, { libelle: string; ton: BadgeTone }> = {
  CREATION: { libelle: 'Création', ton: 'success' },
  MISE_A_JOUR: { libelle: 'Mise à jour', ton: 'info' },
  INCHANGEE: { libelle: 'Inchangée', ton: 'neutral' },
  ERREUR: { libelle: 'Erreur', ton: 'warning' },
  NON_VERIFIEE: { libelle: 'Non vérifiée', ton: 'amber' },
};

export function typeImportDepuis(valeur: string | null): TypeImportPatrimoine {
  return valeur === 'sous-articles' ? 'sous-articles' : 'articles';
}
