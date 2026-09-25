import type { PorteeCleApi } from '../types';

/** Les trois portées que le serveur connaît (`domain/PorteeCleApi`), dans
 * l'ordre de l'écran de création. Le libellé dit ce que la clé pourra
 * faire, pas le nom technique — l'administrateur qui configure n8n n'a pas
 * à connaître le code. La description reprend la FEATURE : c'est le seul
 * endroit où le front explique la portée. */
export const PORTEES_CLE_API: { code: PorteeCleApi; libelle: string; description: string }[] = [
  {
    code: 'PRE_PROSPECTIONS_ECRIRE',
    libelle: 'Pré-prospections — écrire',
    description: 'Créer des pré-prospections (POST /api/pre-prospections). Ce que n8n fait pour chaque lead reçu.',
  },
  {
    code: 'PRE_PROSPECTIONS_LIRE',
    libelle: 'Pré-prospections — lire',
    description: 'Lister et consulter les pré-prospections.',
  },
  {
    code: 'REFERENTIELS_LIRE',
    libelle: 'Référentiels — lire',
    description: 'Lire les référentiels (tranches, origines, étapes…) pour trouver les ids à envoyer.',
  },
];

/** Préréglage n8n de la FEATURE §8 : écrire les pré-prospections + lire les
 * référentiels. Coché par défaut à la création — c'est le cas d'usage qui a
 * motivé la fonctionnalité. */
export const PORTEES_N8N: PorteeCleApi[] = ['PRE_PROSPECTIONS_ECRIRE', 'REFERENTIELS_LIRE'];

export function libellePortee(code: PorteeCleApi | string): string {
  return PORTEES_CLE_API.find((p) => p.code === code)?.libelle ?? code;
}
