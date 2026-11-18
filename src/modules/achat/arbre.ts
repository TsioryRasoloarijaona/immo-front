import { BadgeCheck, Banknote, Coins, FileMinus, FileText, Link2, Receipt, Tags, Truck, Users, Wallet, Workflow } from 'lucide-react';
import type { ArbreModule } from '../arbre';

const DOCUMENTS = '/achat/documents';
const DEPENSES = '/achat/depenses';
const RECETTES = '/achat/recettes';
const BUY = '?modules=BUY';
const IMPAYES = `${DOCUMENTS}?natures=INVOICE&natures=DOCUMENT_TO_PAY&nonSoldes=true`;

export const arbreAchat: ArbreModule = () => [
  {
    cle: 'pieces',
    titre: 'Pièces',
    entrees: [
      { to: '/achat/devis', libelle: 'Devis', Icone: FileText },
      { to: '/achat/bons-de-commande', libelle: 'Bons de commande', Icone: Receipt },
      { to: '/achat/bons-de-livraison', libelle: 'Bons de livraison', Icone: Truck },
      { to: `${DOCUMENTS}${BUY}`, libelle: 'Documents Achats', Icone: FileText, exact: true },
    ],
  },
  {
    cle: 'depenses',
    titre: 'Dépenses',
    entrees: [
      { to: `${DEPENSES}/factures${BUY}`, libelle: 'Factures', Icone: Banknote },
      { to: `${DEPENSES}/documents-a-regler${BUY}`, libelle: 'Documents à régler', Icone: Receipt },
      { to: `${DEPENSES}/avoirs${BUY}`, libelle: 'Avoirs', Icone: FileMinus },
      { to: `${DEPENSES}/decaissements`, libelle: 'Décaissements', Icone: Banknote },
      { to: `${DEPENSES}/affectations`, libelle: 'Affectations', Icone: Link2 },
    ],
  },
  {
    cle: 'recettes',
    titre: 'Recettes',
    entrees: [
      { to: `${RECETTES}/proforma`, libelle: 'Proforma', Icone: FileText },
      { to: `${RECETTES}/factures`, libelle: 'Factures', Icone: Receipt },
      { to: `${RECETTES}/avoirs`, libelle: 'Avoirs', Icone: FileMinus },
      { to: `${RECETTES}/encaissements`, libelle: 'Encaissements', Icone: Coins },
      { to: `${RECETTES}/affectations`, libelle: 'Affectations', Icone: Link2 },
    ],
  },
  {
    cle: 'impayes',
    titre: 'Impayés',
    entrees: [
      { to: `${DOCUMENTS}?nonSoldes=true`, libelle: 'Non soldées', Icone: Wallet },
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
