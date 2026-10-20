import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Calendar,
  ChartNoAxesColumn,
  ChevronDown,
  CircleAlert,
  Contact,
  FileText,
  Folder,
  Gauge,
  Inbox,
  LayoutDashboard,
  Link2,
  ListChecks,
  Phone,
  Sun,
  Target,
  Trophy,
  UserCheck,
  UserCircle,
  UserPlus,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from './ui/sidebar';
import CompteurTri from './parcours/CompteurTri';
import { useAuth } from '../lib/auth';
import { estAdministrateur, estChefOuExempte, estCommercialTerrain, estExempte, voitParcoursCommercial } from '../lib/roles';
import { cn } from '../lib/utils';

interface Entree {
  to: string;
  libelle: string;
  icone: ReactNode;
  exact?: boolean;
  badge?: ReactNode;
}

interface Groupe {
  cle: string;
  titre: string;
  entrees: Entree[];
}

type Utilisateur = Parameters<typeof estAdministrateur>[0];

const CLE_REPLIES = 'arpent.sidebar.vente.replies';

function lireReplies(): Set<string> {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(CLE_REPLIES) ?? '[]');
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function ecrireReplies(replies: ReadonlySet<string>) {
  try {
    localStorage.setItem(CLE_REPLIES, JSON.stringify([...replies]));
  } catch {
    // Stockage indisponible (navigation privée) : l'état reste en mémoire.
  }
}

function estActive(pathname: string, e: Entree): boolean {
  return e.exact ? pathname === e.to : pathname.startsWith(e.to);
}

/** `replies` sans le groupe de la page courante, ou `null` s'il n'y était pas. */
function rouvrirGroupeActif(replies: ReadonlySet<string>, groupes: readonly Groupe[], pathname: string): Set<string> | null {
  const actif = groupes.find((g) => g.entrees.some((e) => estActive(pathname, e)));
  if (!actif || !replies.has(actif.cle)) return null;
  const suivant = new Set(replies);
  suivant.delete(actif.cle);
  return suivant;
}

const SUIVI_ACTIONS = '/suivi-actions';

/** Groupes du module Vente selon le rôle — le serveur reste l'autorité (403). */
function groupesVente(user: Utilisateur, terrain: boolean): Groupe[] {
  const parcours = voitParcoursCommercial(user);
  const activite: Entree[] = [];
  if (parcours && !terrain) activite.push({ to: '/journee', libelle: 'Ma journée', icone: <Sun /> });
  if (parcours) {
    activite.push({
      to: '/tri',
      libelle: 'Boîte de tri',
      icone: <Inbox style={{ color: 'var(--sec-preprospection)' }} />,
      badge: <CompteurTri />,
    });
  }
  activite.push(
    { to: '/calendrier', libelle: 'Calendrier', icone: <Calendar /> },
    { to: '/hotline', libelle: 'Hotline', icone: <Phone /> },
  );

  const groupes: Groupe[] = [
    { cle: 'activite', titre: 'Mon activité', entrees: activite },
    {
      cle: 'pipeline',
      titre: 'Pipeline',
      entrees: [
        { to: '/pre-prospections', libelle: 'Pré-prospections', icone: <UserPlus style={{ color: 'var(--sec-preprospection)' }} /> },
        { to: '/prospections', libelle: 'Prospections', icone: <Users style={{ color: 'var(--sec-prospection)' }} /> },
        { to: '/prospects', libelle: 'Prospects', icone: <Contact style={{ color: 'var(--sec-prospect)' }} /> },
      ],
    },
    {
      cle: 'dossiers',
      titre: 'Dossiers',
      entrees: [
        { to: '/offres', libelle: 'Offres', icone: <FileText style={{ color: 'var(--sec-offre)' }} /> },
        { to: '/clients', libelle: 'Clients', icone: <UserCheck style={{ color: 'var(--sec-client)' }} /> },
        { to: '/dossiers', libelle: 'Dossiers de vente', icone: <Folder style={{ color: 'var(--sec-dossier)' }} /> },
        { to: '/encaissements', libelle: 'Encaissements', icone: <Wallet style={{ color: 'var(--sec-dossier)' }} /> },
        { to: '/impayes', libelle: 'Impayés', icone: <CircleAlert style={{ color: 'var(--sec-dossier)' }} /> },
      ],
    },
  ];

  const mesActions: Entree = { to: SUIVI_ACTIONS, libelle: 'Mes actions', icone: <ListChecks /> };
  // Ouvert à tous : le serveur restreint les tranches au périmètre de chacun.
  const tableauxDeBord: Entree[] = [
    { to: '/etat-des-ventes', libelle: 'État des ventes', icone: <ChartNoAxesColumn /> },
    // Le serveur restreint aux commerciaux de la portée de chacun.
    { to: '/suivi-commerciaux', libelle: 'Suivi des commerciaux', icone: <Target /> },
    { to: '/suivi-affectations', libelle: 'Suivi des affectations', icone: <Link2 /> },
  ];
  if (terrain) {
    groupes.push({
      cle: 'moi',
      titre: 'Moi',
      entrees: [
        { to: '/mes-performances', libelle: 'Mes performances', icone: <Gauge /> },
        mesActions,
        ...tableauxDeBord,
        { to: '/profil', libelle: 'Mon profil', icone: <UserCircle /> },
      ],
    });
  } else if (estExempte(user)) {
    const admin = estAdministrateur(user);
    const pilotage: Entree[] = [{ to: '/equipe', libelle: 'Mon équipe', icone: <UsersRound /> }];
    if (admin) pilotage.push({ to: '/performances', libelle: 'Performances commerciales', icone: <Trophy /> });
    // Le serveur ne sert le suivi général qu'à l'administrateur ; les autres n'y voient que leurs actions.
    pilotage.push(admin ? { ...mesActions, libelle: 'Suivi des actions' } : mesActions, ...tableauxDeBord);
    groupes.push({ cle: 'pilotage', titre: 'Pilotage', entrees: pilotage });
  } else if (estChefOuExempte(user)) {
    groupes.push({
      cle: 'equipe',
      titre: 'Mon équipe',
      entrees: [{ to: '/equipe', libelle: 'Distribution & équipe', icone: <UsersRound /> }, mesActions, ...tableauxDeBord],
    });
  } else {
    groupes.push({ cle: 'suivi', titre: 'Suivi', entrees: [mesActions, ...tableauxDeBord] });
  }
  return groupes;
}

function LienNav({ entree, pathname }: Readonly<{ entree: Entree; pathname: string }>) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<NavLink to={entree.to} end={entree.exact} />}
        isActive={estActive(pathname, entree)}
        tooltip={entree.libelle}
      >
        {entree.icone}
        {entree.libelle}
      </SidebarMenuButton>
      {entree.badge}
    </SidebarMenuItem>
  );
}

/**
 * Menu du module Vente : en tête le tableau de bord (Ma journée pour le commercial de terrain), puis des groupes
 * repliables mémorisés dans le navigateur. Le groupe de la page courante se rouvre à chaque navigation ; en barre
 * réduite (icônes), tout reste visible.
 */
export default function NavVente({ pathname }: Readonly<{ pathname: string }>) {
  const { user } = useAuth();
  const { state, isMobile } = useSidebar();
  const terrain = estCommercialTerrain(user);
  const groupes = groupesVente(user, terrain);
  const [replies, setReplies] = useState(() => {
    const lues = lireReplies();
    return rouvrirGroupeActif(lues, groupes, pathname) ?? lues;
  });
  const [cheminVu, setCheminVu] = useState(pathname);

  // Ajustement pendant le rendu (pas d'effet) : à chaque navigation, rouvrir le groupe de la page.
  if (cheminVu !== pathname) {
    setCheminVu(pathname);
    const suivant = rouvrirGroupeActif(replies, groupes, pathname);
    if (suivant) {
      setReplies(suivant);
      ecrireReplies(suivant);
    }
  }

  function basculer(cle: string) {
    const suivant = new Set(replies);
    if (suivant.has(cle)) suivant.delete(cle);
    else suivant.add(cle);
    setReplies(suivant);
    ecrireReplies(suivant);
  }

  const icones = state === 'collapsed' && !isMobile;
  const tete: Entree = terrain
    ? { to: '/journee', libelle: 'Ma journée', icone: <Sun /> }
    : { to: '/', libelle: 'Tableau de bord', icone: <LayoutDashboard />, exact: true };

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          <LienNav entree={tete} pathname={pathname} />
        </SidebarMenu>
      </SidebarGroup>
      {groupes.map((g) => {
        const ouvert = icones || !replies.has(g.cle);
        return (
          <SidebarGroup key={g.cle}>
            <SidebarGroupLabel
              render={<button type="button" aria-expanded={ouvert} onClick={() => basculer(g.cle)} />}
              className="w-full cursor-pointer justify-between hover:text-sidebar-foreground"
            >
              {g.titre}
              <ChevronDown className={cn('transition-transform', !ouvert && '-rotate-90')} />
            </SidebarGroupLabel>
            {ouvert && (
              <SidebarMenu>
                {g.entrees.map((e) => <LienNav key={e.to} entree={e} pathname={pathname} />)}
              </SidebarMenu>
            )}
          </SidebarGroup>
        );
      })}
    </>
  );
}
