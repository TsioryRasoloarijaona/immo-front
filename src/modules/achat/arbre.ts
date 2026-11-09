import { FileText, Receipt, Wallet } from 'lucide-react';
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
];
