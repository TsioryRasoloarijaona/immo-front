import type { ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Building2, Calendar, Contact, Folder, LayoutDashboard, LayoutGrid, LogOut, Phone, UserCheck, Users } from 'lucide-react';
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
import { APP_MODULES, moduleForPath } from '../lib/modules';
import { useAuth } from '../lib/auth';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const activeModule = moduleForPath(location.pathname);
  const { user, logout } = useAuth();
  const activeSoonModule = activeModule && activeModule !== 'vente' && activeModule !== 'patrimoine'
    ? APP_MODULES.find((m) => m.slug === activeModule)
    : undefined;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-1 px-1 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Link
              to="/"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 no-underline group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:px-0"
              title="Ayad Développement"
            >
              <img src="/brand/app-icon.png" alt="" width={30} height={30} className="block size-7.5 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <strong className="truncate text-[13px] font-bold tracking-tight text-foreground">Ayad Développement</strong>
                <span className="text-xs text-muted-foreground">CRM prototype</span>
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

          {/* Only the active module's own submenu shows — the sidebar is
              module-scoped, driven purely by the current route, so switching
              modules (via the launcher or a direct link) swaps the section
              instead of stacking every module's links at once. */}
          {activeModule === 'vente' && (
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
                    <Users />
                    Prospections
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/prospects" />} isActive={location.pathname.startsWith('/prospects')} tooltip="Prospects">
                    <Contact />
                    Prospects
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/clients" />} isActive={location.pathname.startsWith('/clients')} tooltip="Clients">
                    <UserCheck />
                    Clients
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/dossiers" />} isActive={location.pathname.startsWith('/dossiers')} tooltip="Dossiers de vente">
                    <Folder />
                    Dossiers de vente
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {activeModule === 'patrimoine' && (
            <SidebarGroup>
              <SidebarGroupLabel>Patrimoine</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/projets" />} isActive={location.pathname.startsWith('/projets')} tooltip="Projets">
                    <LayoutGrid />
                    Projets
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<NavLink to="/tranches" />} isActive={location.pathname.startsWith('/tranches')} tooltip="Tranches">
                    <Building2 />
                    Tranches
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
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2 border-t border-sidebar-border px-2 pt-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-[13px] font-medium text-foreground">{user?.description || user?.username}</span>
              <span className="truncate text-xs text-muted-foreground">{user?.roles?.join(', ') || user?.username}</span>
            </div>
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

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
