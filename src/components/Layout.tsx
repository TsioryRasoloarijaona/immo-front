import type { ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { CircleHelp, LogOut } from 'lucide-react';
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
import { APP_MODULES, moduleForPath } from '../lib/modules';
import { useAuth } from '../lib/auth';
import { estAdministrateur } from '../lib/roles';
import GroupeMenu from '../modules/GroupeMenu';
import { MODULES_DECLARES } from '../modules/registre';
import type { ModuleApp } from '../modules/types';

function MessageModule({ titre, children }: Readonly<{ titre: string; children: ReactNode }>) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{titre}</SidebarGroupLabel>
      <p className="px-2 text-xs leading-relaxed text-muted-foreground group-data-[collapsible=icon]:hidden">{children}</p>
    </SidebarGroup>
  );
}

function MenuDuModule({ module, isAdmin, pathname }: Readonly<{ module: ModuleApp; isAdmin: boolean; pathname: string }>) {
  if (module.reserveAdmin && !isAdmin) {
    return <MessageModule titre={module.label}>Ce module est réservé aux comptes ayant le rôle Administrateur.</MessageModule>;
  }
  if (module.Menu) return <module.Menu pathname={pathname} />;
  return module.menu ? <GroupeMenu titre={module.menu.titre} entrees={module.menu.entrees} pathname={pathname} /> : null;
}

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const location = useLocation();
  const activeModule = moduleForPath(location.pathname);
  const { user, logout } = useAuth();
  const isAdmin = estAdministrateur(user);
  const moduleDeclare = MODULES_DECLARES.find((m) => m.slug === activeModule);
  const activeSoonModule = activeModule && !moduleDeclare ? APP_MODULES.find((m) => m.slug === activeModule) : undefined;

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
          {moduleDeclare && <MenuDuModule module={moduleDeclare} isAdmin={isAdmin} pathname={location.pathname} />}

          {activeSoonModule && (
            <MessageModule titre={activeSoonModule.label}>
              Ce module n'a pas encore de sous-menu — il sera disponible dans une prochaine phase.
            </MessageModule>
          )}
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
