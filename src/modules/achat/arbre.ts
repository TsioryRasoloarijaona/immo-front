import { FileText, Receipt, Tags, Wallet, Workflow } from 'lucide-react';
import type { ArbreModule } from '../arbre';

const DOCUMENTS = '/achat/documents';

export const arbreAchat: ArbreModule = () => [
  {
    cle: 'pieces',
    titre: 'Pièces',
    entrees: [
      { to: DOCUMENTS, libelle: 'Toutes les pièces', Icone: FileText, exact: true },
      { to: `${DOCUMENTS}?natures=INVOICE`, libelle: 'Factures', Icone: Receipt },
      { to: `${DOCUMENTS}?nonSoldes=true`, libelle: 'Non soldées', Icone: Wallet },
    ],
  },
  {
    cle: 'configuration',
    titre: 'Configuration',
    entrees: [
      { to: '/achat/config/statuts', libelle: 'Statuts', Icone: Tags },
      { to: '/achat/config/transitions', libelle: 'Transitions', Icone: Workflow },
    ],
  },
];
