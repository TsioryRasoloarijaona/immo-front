import { AlertCircle, Banknote, ClipboardList, FileText, HardHat, ListChecks, Receipt, Shapes, Tags, Undo2, Wallet } from 'lucide-react';
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
    cle: 'depenses',
    titre: 'Dépenses',
    entrees: [
      { to: '/projet/depenses', libelle: 'Synthèse', Icone: Wallet, couleur: COULEUR },
      { to: '/projet/depenses/factures', libelle: 'Factures', Icone: Receipt, couleur: COULEUR },
      { to: '/projet/depenses/documents-a-regler', libelle: 'Documents à régler', Icone: ClipboardList, couleur: COULEUR },
      { to: '/projet/depenses/avoirs', libelle: 'Avoirs', Icone: Undo2, couleur: COULEUR },
      { to: '/projet/depenses/impayes', libelle: 'Impayés', Icone: AlertCircle, couleur: COULEUR },
      { to: '/projet/depenses/reglements', libelle: 'Décaissements', Icone: Banknote, couleur: COULEUR },
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
