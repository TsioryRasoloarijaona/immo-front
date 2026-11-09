import { FileText, ListChecks } from 'lucide-react';
import type { ArbreModule } from '../arbre';

const COULEUR = 'var(--sec-projet)';

// Un groupe « Configuration » s'ajoutera ici (lot P9a).
export const arbreProjet: ArbreModule = () => [
  {
    cle: 'chantier',
    titre: 'Chantier',
    entrees: [
      { to: '/projet/lots', libelle: 'Lots', Icone: ListChecks, couleur: COULEUR },
      { to: '/projet/decomptes', libelle: 'Décomptes', Icone: FileText, couleur: COULEUR },
    ],
  },
];
