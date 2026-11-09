import {
  Banknote, BarChart3, BookUser, Boxes, Building2, CalendarRange, ChartGantt, ClipboardCheck, FilePen, FileText, Flag, FlaskConical, FolderTree, Gauge,
  Gavel, Layers, Palette, Receipt, Ruler, ShieldCheck, Tag, Truck, Users, Workflow,
} from 'lucide-react';
import type { ArbreModule, EntreeArbre } from '../arbre';

const m = (cle: string, libelle: string, Icone: EntreeArbre['Icone']): EntreeArbre => ({ to: `/projet/${cle}`, libelle, Icone });

export const arbreProjet: ArbreModule = () => [
  {
    cle: 'chantier',
    titre: 'Chantier',
    entrees: [
      m('lots', 'Lots', Boxes), m('decomptes', 'Décomptes', Receipt), m('reunions', 'Réunions de chantier', Users), m('modifications', 'Modifications', FilePen),
      m('previsions', 'Prévisions', CalendarRange), m('gantt', 'Gantt', ChartGantt),
    ],
  },
  {
    cle: 'tableaux-de-bord',
    titre: 'Tableaux de bords',
    entrees: [m('bilans', 'Bilans', BarChart3), m('tresorerie', 'Trésorerie', Banknote), m('suivi-lots', 'Suivi des lots', Gauge), m('rapports', 'Rapports', FileText)],
  },
  {
    cle: 'configuration',
    titre: 'Configuration',
    entrees: [
      m('tranches', 'Tranches', Layers), m('nivellements', 'Nivellements', Ruler), m('projets', 'Projets', Building2), m('statuts-lots', 'Statuts des lots', Tag),
      m('transitions', 'Transitions', Workflow), m('types-lots', 'Types de lot', FolderTree), m('statuts-reserves', 'Statuts des réserves', Flag),
      m('plages-couleurs', 'Plages des couleurs', Palette), m('modeles-simulation', 'Modèles de simulation', FlaskConical), m('types-reception', 'Types de réception', ClipboardCheck),
      m('natures-reception', 'Natures de réception', ShieldCheck), m('types-reunion', 'Types de réunion', Gavel), m('fournisseurs', 'Fournisseurs', Truck), m('contacts', 'Contacts', BookUser),
    ],
  },
];
