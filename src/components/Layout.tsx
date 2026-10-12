import type { ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { BookUser, Bot, Building2, Calendar, Contact, FilePlus2, FileText, Folder, Gauge, HardHat, History, Home, KeyRound, Landmark, LayoutDashboard, LayoutGrid, ListChecks, LogOut, Phone, ReceiptText, Trophy, UserCheck, UserCircle, UserPlus, Users, UsersRound, Wallet } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from './ui/sidebar';
import { Button } from './ui/button';
import SyncButton from './SyncButton';
import ActionsRecentes from './ActionsRecentes';
import EntreesAdminVirements from '../pages/outils/virements/EntreesAdminVirements';
import EntreesSyndic from '../pages/outils/syndic/EntreesSyndic';
import { APP_MODULES, moduleForPath } from '../lib/modules';
import { useAuth } from '../lib/auth';
import { estAdministrateur, estChefOuExempte } from '../lib/roles';

const MODULES_AVEC_MENU = new Set(['vente', 'patrimoine', 'chantier', 'administration', 'outils']);

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();
  const activeModule = moduleForPath(location.pathname);
  const { user, logout } = useAuth();
  const isAdmin = estAdministrateur(user);
  const chefOuExempte = estChefOuExempte(user);
  // Le commercial voit Ventes, Patrimoine, Chantier et Profil ensemble, hors du découpage
  // par module que suivent les autres rôles.
  const isCommercial = user?.roles?.includes('Commercial') ?? false;
  const activeSoonModule = activeModule && !MODULES_AVEC_MENU.has(activeModule)
    ? APP_MODULES.find((m) => m.slug === activeModule)
    : undefined;

  return (
    <SidebarProvider>
      {/* variant="inset" : SidebarInset est une feuille à marge (m-2) que PageShell
          compense — fullHeight y vaut calc(100svh - 1rem). */}
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-1 px-1 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Link
              to="/"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 no-underline group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:px-0"
              title="Arpent"
            >
              {/* Deux <img> plutôt qu'un filtre CSS : la variante inverse (crème)
                  porte le thème sombre, la normale (encre) le clair. */}
              <img src="/brand/arpent-mark.svg" alt="" aria-hidden className="size-9 shrink-0 dark:hidden" />
              <img src="/brand/arpent-mark-inverse.svg" alt="" aria-hidden className="hidden size-9 shrink-0 dark:block" />
              <span
                aria-hidden={true}
                className="block shrink-0 font-heading text-page leading-none font-black tracking-tighter text-foreground group-data-[collapsible=icon]:hidden"
              >
                Arpent
              </span>
              <span className="sr-only">Arpent</span>
              <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-xs text-muted-foreground">CRM immobilier</span>
              </div>
            </Link>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<NavLink to="/" end />}
                  isActive={location.pathname === '/'}
                  tooltip="Dashboard"
                >
                  <LayoutDashboard />
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {(isCommercial || activeModule === 'vente') && (
            <SidebarGroup>
              <SidebarGroupLabel>Ventes</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/hotline" />} isActive={location.pathname.startsWith('/hotline')} tooltip="Hotline">
                    <Phone />
                    Hotline
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/calendrier" />} isActive={location.pathname.startsWith('/calendrier')} tooltip="Calendrier">
                    <Calendar />
                    Calendrier
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/prospections" />} isActive={location.pathname.startsWith('/prospections')} tooltip="Prospections">
                    <Users style={{ color: 'var(--sec-prospection)' }} />
                    Prospections
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/pre-prospections" />} isActive={location.pathname.startsWith('/pre-prospections')} tooltip="Pré-prospections">
                    <UserPlus style={{ color: 'var(--sec-preprospection)' }} />
                    Pré-prospections
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/prospects" />} isActive={location.pathname.startsWith('/prospects')} tooltip="Prospects">
                    <Contact style={{ color: 'var(--sec-prospect)' }} />
                    Prospects
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/clients" />} isActive={location.pathname.startsWith('/clients')} tooltip="Clients">
                    <UserCheck style={{ color: 'var(--sec-client)' }} />
                    Clients
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/dossiers" />} isActive={location.pathname.startsWith('/dossiers')} tooltip="Dossiers de vente">
                    <Folder style={{ color: 'var(--sec-dossier)' }} />
                    Dossiers de vente
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/offres" />} isActive={location.pathname.startsWith('/offres')} tooltip="Offres">
                    <FileText style={{ color: 'var(--sec-offre)' }} />
                    Offres
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/encaissements" />} isActive={location.pathname.startsWith('/encaissements')} tooltip="Encaissements">
                    <Wallet style={{ color: 'var(--sec-dossier)' }} />
                    Encaissements
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {chefOuExempte && (
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<NavLink to="/equipe" />} isActive={location.pathname.startsWith('/equipe')} tooltip="Mon équipe">
                      <UsersRound />
                      Mon équipe
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroup>
          )}

          {(isCommercial || activeModule === 'patrimoine') && (
            <SidebarGroup>
              <SidebarGroupLabel>Patrimoine</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/projets" />} isActive={location.pathname.startsWith('/projets')} tooltip="Projets">
                    <LayoutGrid style={{ color: 'var(--sec-projet)' }} />
                    Projets
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/tranches" />} isActive={location.pathname.startsWith('/tranches')} tooltip="Tranches">
                    <Building2 style={{ color: 'var(--sec-tranche)' }} />
                    Tranches
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/articles" />} isActive={location.pathname.startsWith('/articles')} tooltip="Articles">
                    <Home style={{ color: 'var(--sec-tranche)' }} />
                    Articles
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/entites-juridiques" />}
                    isActive={location.pathname.startsWith('/entites-juridiques')}
                    tooltip="Entités juridiques"
                  >
                    <Landmark style={{ color: 'var(--sec-projet)' }} />
                    Entités juridiques
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {(isCommercial || activeModule === 'chantier') && (
            <SidebarGroup>
              <SidebarGroupLabel>Chantier</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  {/* Une fiche lot appartient à son projet : l'entrée Projets reste active dessus. */}
                  <SidebarMenuButton
                    render={<NavLink to="/chantier/projets" />}
                    isActive={location.pathname.startsWith('/chantier/projets') || location.pathname.startsWith('/chantier/lots')}
                    tooltip="Projets"
                  >
                    <HardHat style={{ color: 'var(--sec-chantier-projet)' }} />
                    Projets
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/chantier/decomptes" />}
                    isActive={location.pathname.startsWith('/chantier/decomptes')}
                    tooltip="Décomptes"
                  >
                    <ReceiptText style={{ color: 'var(--sec-chantier-decompte)' }} />
                    Décomptes
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {isCommercial && (
            <SidebarGroup>
              <SidebarGroupLabel>Profil</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/profil" />} isActive={location.pathname.startsWith('/profil')} tooltip="Mon profil">
                    <UserCircle />
                    Mon profil
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/mes-performances" />}
                    isActive={location.pathname.startsWith('/mes-performances')}
                    tooltip="Mes performances"
                  >
                    <Gauge />
                    Mes performances
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/suivi-actions" />} isActive={location.pathname.startsWith('/suivi-actions')} tooltip="Mes actions">
                    <ListChecks />
                    Mes actions
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {!isCommercial && activeModule === 'vente' && (
            <SidebarGroup>
              <SidebarGroupLabel>Suivi</SidebarGroupLabel>
              <SidebarMenu>
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<NavLink to="/performances" />}
                      isActive={location.pathname.startsWith('/performances')}
                      tooltip="Performances commerciales"
                    >
                      <Trophy />
                      Performances commerciales
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  {/* Le serveur ne sert le suivi général qu'à l'administrateur ;
                      les autres rôles n'y voient que leurs propres actions. */}
                  <SidebarMenuButton render={<NavLink to="/suivi-actions" />} isActive={location.pathname.startsWith('/suivi-actions')} tooltip={isAdmin ? 'Suivi des actions' : 'Mes actions'}>
                    <ListChecks />
                    {isAdmin ? 'Suivi des actions' : 'Mes actions'}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {activeSoonModule && (
            <SidebarGroup>
              <SidebarGroupLabel>{activeSoonModule.label}</SidebarGroupLabel>
              <p className="px-2 text-xs leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
                Ce module n'a pas encore de sous-menu — il sera disponible dans une prochaine phase.
              </p>
            </SidebarGroup>
          )}

          {activeModule === 'administration' && !isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <p className="px-2 text-xs leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
                Ce module est réservé aux comptes ayant le rôle Administrateur.
              </p>
            </SidebarGroup>
          )}

          {activeModule === 'administration' && isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/utilisateurs" />}
                    isActive={location.pathname === '/utilisateurs'}
                    tooltip="Comptes utilisateurs"
                  >
                    <Users />
                    Comptes utilisateurs
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/utilisateurs/reinitialiser-mot-de-passe" />}
                    isActive={location.pathname.startsWith('/utilisateurs/reinitialiser-mot-de-passe')}
                    tooltip="Réinitialiser un mot de passe"
                  >
                    <KeyRound />
                    Réinitialiser un mot de passe
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/cles-api" />}
                    isActive={location.pathname.startsWith('/cles-api')}
                    tooltip="Clés d'API — clients machine (n8n, agents)"
                  >
                    <Bot />
                    Clés d'API
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {activeModule === 'outils' && !isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Outils</SidebarGroupLabel>
              <p className="px-2 text-xs leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">
                Ce module est réservé aux comptes ayant le rôle Administrateur.
              </p>
            </SidebarGroup>
          )}

          {activeModule === 'outils' && isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel>Ordres de virement</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/outils/virements/nouveau" />}
                    isActive={location.pathname.startsWith('/outils/virements/nouveau')}
                    tooltip="Nouvel ordre"
                  >
                    <FilePlus2 />
                    Nouvel ordre
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/outils/virements/historique" />}
                    isActive={location.pathname.startsWith('/outils/virements/historique')}
                    tooltip="Historique"
                  >
                    <History />
                    Historique
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/outils/virements/beneficiaires" />}
                    isActive={location.pathname.startsWith('/outils/virements/beneficiaires')}
                    tooltip="Bénéficiaires"
                  >
                    <BookUser />
                    Bénéficiaires
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* Sociétés et Journal : selon `admin` de `GET /moi` du service,
                    pas selon les rôles CRM. */}
                <EntreesAdminVirements pathname={location.pathname} />
              </SidebarMenu>
            </SidebarGroup>
          )}

          {activeModule === 'outils' && isAdmin && <EntreesSyndic pathname={location.pathname} />}
        </SidebarContent>

        <SidebarFooter>
          {/* SyncButton se cache lui-même pour les rôles auxquels le backend refuse l'appel. */}
          <ActionsRecentes />
          <SyncButton />
          <div className="flex items-center gap-2 px-2 pt-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Link
              to="/profil"
              className="flex min-w-0 flex-1 flex-col leading-tight no-underline group-data-[collapsible=icon]:hidden"
              title="Mon profil"
            >
              <span className="truncate text-label font-medium text-foreground hover:text-primary">{user?.description || user?.username}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.roles?.join(', ') || user?.username}</span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Se déconnecter"
              aria-label="Se déconnecter"
              onClick={() => void logout()}
            >
              <LogOut />
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* `min-w-0` obligatoire ici : sans lui, un tableau large impose sa largeur
          à cet élément flex et c'est la fenêtre qui défile horizontalement. Le
          poser plus bas ne suffit pas. */}
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  );
}
