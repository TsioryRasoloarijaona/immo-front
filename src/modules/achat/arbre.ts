import {
  Banknote, BarChart3, Boxes, Calendar, CircleDollarSign, CreditCard, FileClock, FileMinus, FileSpreadsheet, FileStack, FolderTree, Gavel, Handshake, History, ListTree, PackageCheck,
  Percent, PiggyBank, ReceiptText, Scale, Send, ShoppingCart, Tag, Truck, Wallet, Workflow,
} from 'lucide-react';
import type { ArbreModule, EntreeArbre } from '../arbre';

const m = (cle: string, libelle: string, Icone: EntreeArbre['Icone']): EntreeArbre => ({ to: `/achat/${cle}`, libelle, Icone });

export const arbreAchat: ArbreModule = () => [
  {
    cle: 'achats',
    titre: 'Achats',
    entrees: [
      m('consultations', 'Consultations', Gavel), m('devis', 'Devis', FileSpreadsheet), m('bons-commande', 'Bons de commande', ShoppingCart), m('bons-livraison', 'Bons de livraison', PackageCheck),
      m('factures', 'Factures', ReceiptText), m('documents-a-regler', 'Documents à régler', FileClock), m('avoirs', 'Avoirs', FileMinus),
    ],
  },
  {
    cle: 'reglements',
    titre: 'Règlements',
    entrees: [m('reglements', 'Règlements', Wallet), m('virements', 'Virements à émettre', Send), m('impayes', 'Liste des impayés', Banknote), m('documents', 'Documents', History)],
  },
  {
    cle: 'credits',
    titre: 'Crédits',
    entrees: [m('prets', 'Gestion des prêts', PiggyBank), m('echeances', 'Échéances crédits', Calendar)],
  },
  {
    cle: 'tableaux-de-bord',
    titre: 'Tableaux de bords',
    entrees: [m('soldes', 'Solde fournisseurs', CircleDollarSign), m('tva', 'État de la TVA déductible', Percent), m('rs', 'État de la RS', Scale), m('rapports', 'Rapports', BarChart3)],
  },
  {
    cle: 'configuration',
    titre: 'Configuration',
    entrees: [
      m('statuts', 'Statuts', Tag), m('transitions', 'Transitions', Workflow), m('groupements', 'Dossiers de groupement', FileStack), m('familles', 'Familles', FolderTree),
      m('sous-familles', 'Sous-familles', ListTree), m('articles', 'Articles', Boxes), m('types-credit', 'Types de crédit', CreditCard), m('fournisseurs', 'Fournisseurs', Truck),
      m('types-consultation', 'Types de consultation', Handshake),
    ],
  },
];
