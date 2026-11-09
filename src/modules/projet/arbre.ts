import { FileText, HardHat, ListChecks, Shapes, Tags } from 'lucide-react';
import { estAdministrateur } from '../../lib/roles';
import type { ArbreModule } from '../arbre';

const COULEUR = 'var(--sec-projet)';

export const arbreProjet: ArbreModule = ({ user }) => [
  {
    cle: 'chantier',
    titre: 'Chantier',
    entrees: [
      { to: '/projet/lots', libelle: 'Lots', Icone: ListChecks, couleur: COULEUR },
      { to: '/projet/decomptes', libelle: 'Décomptes', Icone: FileText, couleur: COULEUR },
    ],
  },
  {
    cle: 'configuration',
    titre: 'Configuration',
    entrees: [
      ...(estAdministrateur(user) ? [{ to: '/projet/config/projets', libelle: 'Projets', Icone: HardHat, couleur: COULEUR }] : []),
      { to: '/projet/config/types-lot', libelle: 'Types de lot', Icone: Shapes, couleur: COULEUR },
      { to: '/projet/config/statuts-lot', libelle: 'Statuts de lot', Icone: Tags, couleur: COULEUR },
    ],
  },
];
