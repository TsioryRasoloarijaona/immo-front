import type { ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { BookUser, Bot, Building2, CircleHelp, FileCode2, FilePlus2, History, Home, KeyRound, Landmark, Layers, LayoutGrid, LogOut, Settings2, UserRound, Users, UsersRound } from 'lucide-react';
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
import { estAdministrateur } from '../lib/roles';
import NavVente from './NavVente';

const ENTREES_ENTITES = [
  { to: '/entites-juridiques', libelle: 'Entités juridiques', Icone: Landmark },
  { to: '/actionnaires', libelle: 'Actionnaires', Icone: UserRound },
  { to: '/groupes-actionnaires', libelle: "Groupes d'actionnaires", Icone: UsersRound },
];

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();
  const activeModule = moduleForPath(location.pathname);
  const { user, logout } = useAuth();
  const isAdmin = estAdministrateur(user);
  const activeSoonModule = activeModule && activeModule !== 'vente' && activeModule !== 'patrimoine' && activeModule !== 'administration' && activeModule !== 'outils'
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
          {activeModule === 'vente' && <NavVente pathname={location.pathname} />}

          {activeModule === 'patrimoine' && (
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
                  <SidebarMenuButton render={<NavLink to="/sous-articles" />} isActive={location.pathname.startsWith('/sous-articles')} tooltip="Sous-articles">
                    <Layers style={{ color: 'var(--sec-tranche)' }} />
                    Sous-articles
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isAdmin && ENTREES_ENTITES.map(({ to, libelle, Icone }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton render={<NavLink to={to} />} isActive={location.pathname.startsWith(to)} tooltip={libelle}>
                      <Icone style={{ color: 'var(--sec-projet)' }} />
                      {libelle}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/configuration/referentiels" />} isActive={location.pathname.startsWith('/configuration')} tooltip="Configuration">
                    <Settings2 style={{ color: 'var(--sec-projet)' }} />
                    Configuration
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
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<NavLink to="/modeles-documents" />}
                    isActive={location.pathname.startsWith('/modeles-documents')}
                    tooltip="Modèles de documents — actes, lettres, fiches"
                  >
                    <FileCode2 />
                    Modèles de documents
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
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<NavLink to="/aide" />} isActive={location.pathname.startsWith('/aide')} tooltip="Aide">
                <CircleHelp />
                Aide
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
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
