import type { PorteeCleApi } from '../types';

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

export const PORTEES_N8N: PorteeCleApi[] = ['PRE_PROSPECTIONS_ECRIRE', 'REFERENTIELS_LIRE'];

export function libellePortee(code: PorteeCleApi | string): string {
  return PORTEES_CLE_API.find((p) => p.code === code)?.libelle ?? code;
}
