import { BadgeCheck, FileText, Receipt, Tags, Users, Wallet, Workflow } from 'lucide-react';
import type { ArbreModule } from '../arbre';

const DOCUMENTS = '/achat/documents';
const IMPAYES = `${DOCUMENTS}?natures=INVOICE&natures=DOCUMENT_TO_PAY&nonSoldes=true`;

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
    cle: 'impayes',
    titre: 'Impayés',
    entrees: [
      { to: `${IMPAYES}&okPourPaiement=true`, libelle: 'Validées, non réglées', Icone: BadgeCheck },
      { to: IMPAYES, libelle: 'Tous les impayés', Icone: Wallet },
      { to: '/achat/fournisseurs', libelle: 'Soldes fournisseurs', Icone: Users },
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
