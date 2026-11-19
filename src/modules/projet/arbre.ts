import {
  AlertCircle, Banknote, CalendarClock, CircleCheck, ClipboardCheck, ClipboardList, Coins, FileText, HardHat, LineChart, Link2, ListChecks, ListTodo,
  PackageCheck, Palette, Receipt, Shapes, Tags, Undo2, Users, Wallet,
} from 'lucide-react';
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
      { to: '/projet/reunions', libelle: 'Réunions chantier', Icone: CalendarClock, couleur: COULEUR },
      { to: '/projet/previsions', libelle: 'Prévisions', Icone: LineChart, couleur: COULEUR },
    ],
  },
  {
    cle: 'depenses',
    titre: 'Dépenses',
    entrees: [
      { to: '/projet/depenses', libelle: 'Synthèse', Icone: Wallet, couleur: COULEUR, exact: true },
      { to: '/projet/depenses/factures', libelle: 'Factures', Icone: Receipt, couleur: COULEUR },
      { to: '/projet/depenses/documents-a-regler', libelle: 'Documents à régler', Icone: ClipboardList, couleur: COULEUR },
      { to: '/projet/depenses/avoirs', libelle: 'Avoirs', Icone: Undo2, couleur: COULEUR },
      { to: '/projet/depenses/impayes', libelle: 'Impayés', Icone: AlertCircle, couleur: COULEUR },
      { to: '/projet/depenses/decaissements', libelle: 'Décaissements', Icone: Banknote, couleur: COULEUR },
      { to: '/projet/depenses/affectations', libelle: 'Affectations', Icone: Link2, couleur: COULEUR },
    ],
  },
  {
    cle: 'recettes',
    titre: 'Recettes',
    entrees: [
      { to: '/projet/recettes/proforma', libelle: 'Proforma', Icone: FileText, couleur: COULEUR },
      { to: '/projet/recettes/factures', libelle: 'Factures', Icone: Receipt, couleur: COULEUR },
      { to: '/projet/recettes/avoirs', libelle: 'Avoirs', Icone: Undo2, couleur: COULEUR },
      { to: '/projet/recettes/encaissements', libelle: 'Encaissements', Icone: Coins, couleur: COULEUR },
      { to: '/projet/recettes/affectations', libelle: 'Affectations', Icone: Link2, couleur: COULEUR },
    ],
  },
  {
    cle: 'configuration',
    titre: 'Configuration',
    entrees: [
      ...(estAdministrateur(user) ? [{ to: '/projet/config/projets', libelle: 'Projets', Icone: HardHat, couleur: COULEUR }] : []),
      { to: '/projet/config/types-lot', libelle: 'Types de lot', Icone: Shapes, couleur: COULEUR },
      { to: '/projet/config/statuts-lot', libelle: 'Statuts de lot', Icone: Tags, couleur: COULEUR },
      { to: '/projet/config/modeles-simulation', libelle: 'Modèles de simulation', Icone: LineChart, couleur: COULEUR },
      { to: '/projet/config/types-reunion', libelle: 'Types de réunion', Icone: Users, couleur: COULEUR },
      { to: '/projet/config/statuts-reserves', libelle: 'Statuts des réserves', Icone: CircleCheck, couleur: COULEUR },
      { to: '/projet/config/plages-couleurs', libelle: 'Plages de couleurs', Icone: Palette, couleur: COULEUR },
      { to: '/projet/config/types-reception', libelle: 'Types réception', Icone: PackageCheck, couleur: COULEUR },
      { to: '/projet/config/natures-reception', libelle: 'Natures réception', Icone: ClipboardCheck, couleur: COULEUR },
      { to: '/projet/config/types-tache', libelle: 'Type de tâche', Icone: ListTodo, couleur: COULEUR },
    ],
  },
];
