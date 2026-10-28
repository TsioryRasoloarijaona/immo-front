import {
  Calendar,
  ChartNoAxesColumn,
  CircleAlert,
  Contact,
  FileBarChart,
  FileText,
  Folder,
  FolderX,
  Gauge,
  History,
  Inbox,
  LayoutDashboard,
  Link2,
  ListChecks,
  Map,
  Percent,
  Phone,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';
import CompteurTri from '../../components/parcours/CompteurTri';
import { estAdministrateur, estChefOuExempte, voitParcoursCommercial } from '../../lib/roles';
import type { ArbreModule, EntreeArbre, GroupeArbre } from '../arbre';
import type { Utilisateur } from '../types';

const JOURNEE: EntreeArbre = { to: '/journee', libelle: 'Ma journée', Icone: Sun };

/** « Mon activité » selon le rôle — le serveur reste l'autorité (403). */
function monActivite(user: Utilisateur, terrain: boolean): GroupeArbre {
  const parcours = voitParcoursCommercial(user);
  const entrees: EntreeArbre[] = [];
  if (terrain) entrees.push(JOURNEE);
  else entrees.push({ to: '/', libelle: 'Tableau de bord', Icone: LayoutDashboard, exact: true });
  if (parcours && !terrain) entrees.push(JOURNEE);
  if (parcours) {
    entrees.push({ to: '/tri', libelle: 'Boîte de tri', Icone: Inbox, couleur: 'var(--sec-preprospection)', badge: <CompteurTri /> });
  }
  entrees.push({ to: '/calendrier', libelle: 'Calendrier', Icone: Calendar });
  if (terrain) entrees.push({ to: '/mes-performances', libelle: 'Mes performances', Icone: Gauge });
  else if (estChefOuExempte(user)) entrees.push({ to: '/equipe', libelle: 'Mon équipe', Icone: UsersRound });
  if (!terrain && estAdministrateur(user)) entrees.push({ to: '/performances', libelle: 'Performances', Icone: Trophy });
  return { cle: 'activite', titre: 'Mon activité', entrees };
}

function tableauxDeBord(user: Utilisateur): GroupeArbre {
  // Le serveur filtre chaque liste selon les droits de chacun ; la page vide l'explique.
  const actions = estAdministrateur(user) ? 'Suivi des actions' : 'Mes actions';
  return {
    cle: 'tableaux',
    titre: 'Tableaux de bords',
    entrees: [
      { to: '/suivi-previsions', libelle: 'Suivi des prévisions', Icone: TrendingUp },
      { to: '/suivi-commerciaux', libelle: 'Suivi des commerciaux', Icone: Target },
      { to: '/suivi-actions', libelle: actions, Icone: ListChecks },
      { to: '/suivi-affectations', libelle: 'Suivi des affectations', Icone: Link2 },
      { to: '/historique-ventes', libelle: 'Suivi des dossiers de vente', Icone: History },
      { to: '/etat-des-ventes', libelle: 'État des ventes', Icone: ChartNoAxesColumn },
      { to: '/rapports', libelle: 'Rapports', Icone: FileBarChart },
    ],
  };
}

export const arbreVente: ArbreModule = ({ user, terrain }) => [
  monActivite(user, terrain),
  {
    cle: 'commercial',
    entrees: [
      { to: '/hotline', libelle: 'Hot Line', Icone: Phone },
      { to: '/prospects', libelle: 'Prospects', Icone: Contact, couleur: 'var(--sec-prospect)' },
      { to: '/pre-prospections', libelle: 'Pré-Prospections', Icone: UserPlus, couleur: 'var(--sec-preprospection)' },
      { to: '/prospections', libelle: 'Prospections', Icone: Users, couleur: 'var(--sec-prospection)' },
      { to: '/offres', libelle: 'Offres', Icone: FileText, couleur: 'var(--sec-offre)' },
      { to: '/clients', libelle: 'Clients', Icone: UserCheck, couleur: 'var(--sec-client)' },
      { to: '/plans', libelle: 'Plans', Icone: Map },
      { to: '/dossiers', libelle: 'Dossiers de vente', Icone: Folder, couleur: 'var(--sec-dossier)' },
    ],
  },
  {
    cle: 'recettes',
    titre: 'Recettes',
    entrees: [
      { to: '/encaissements', libelle: 'Encaissements', Icone: Wallet, couleur: 'var(--sec-dossier)' },
      { to: '/impayes', libelle: 'Impayés', Icone: CircleAlert, couleur: 'var(--sec-dossier)' },
    ],
  },
  {
    cle: 'sorties',
    entrees: [
      { to: '/desistements', libelle: 'Désistements', Icone: FolderX, couleur: 'var(--sec-dossier)' },
      { to: '/commissions', libelle: 'Commissions', Icone: Percent, couleur: 'var(--sec-dossier)' },
    ],
  },
  tableauxDeBord(user),
];
