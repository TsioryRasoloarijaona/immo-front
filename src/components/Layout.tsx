import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PreloadNavLink from './PreloadNavLink';
import { Building2, Calendar, Contact, FileText, Folder, Home, KeyRound, LayoutDashboard, LayoutGrid, LogOut, Phone, UserCheck, UserCircle, UserPlus, Users, Wallet } from 'lucide-react';
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
  const isAdmin = user?.roles?.includes('Administrateur') ?? false;
  // Commercial accounts only ever touch Ventes/Patrimoine/Profil — for this
  // role the sidebar skips the module-switcher concept entirely (no picking
  // one module at a time) and instead lists all three sections at once,
  // each under its own group label. Every other role keeps the normal
  // module-scoped sidebar (one section shown at a time, driven by the
  // current route) plus the module switcher in the header.
  const isCommercial = user?.roles?.includes('Commercial') ?? false;
  const activeSoonModule = activeModule && activeModule !== 'vente' && activeModule !== 'patrimoine' && activeModule !== 'administration'
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
              {/* Wordmark instead of the raster app-icon — one styled word
                  carries the brand identity now that --brand is a plain
                  ink/graphite tone (see index.css) rather than a color mark
                  that needed its own image. group-data-[collapsible=icon]
                  variants keep a single-letter mark when the sidebar rail
                  collapses to icon-only width. */}
              <span
                aria-hidden={true}
                className="block shrink-0 font-heading text-hero leading-none font-black tracking-tighter text-(--brand) group-data-[collapsible=icon]:text-page"
              >
                <span className="group-data-[collapsible=icon]:hidden">Ayad</span>
                <span className="hidden group-data-[collapsible=icon]:inline">A</span>
              </span>
              <span className="sr-only">Ayad Développement</span>
              <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
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
                  render={<PreloadNavLink to="/" end />}
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
              instead of stacking every module's links at once. Commercial
              accounts are the one exception: `isCommercial` short-circuits
              the route gate so Ventes/Patrimoine both render together,
              always — see the `isCommercial` comment above. */}
          {(isCommercial || activeModule === 'vente') && (
            <SidebarGroup>
              <SidebarGroupLabel>Ventes</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/hotline" />} isActive={location.pathname.startsWith('/hotline')} tooltip="Hotline">
                    <Phone />
                    Hotline
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/calendrier" />} isActive={location.pathname.startsWith('/calendrier')} tooltip="Calendrier">
                    <Calendar />
                    Calendrier
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/prospections" />} isActive={location.pathname.startsWith('/prospections')} tooltip="Prospections">
                    <Users style={{ color: 'var(--sec-prospection)' }} />
                    Prospections
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/pre-prospections" />} isActive={location.pathname.startsWith('/pre-prospections')} tooltip="Pré-prospections">
                    <UserPlus style={{ color: 'var(--sec-preprospection)' }} />
                    Pré-prospections
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/prospects" />} isActive={location.pathname.startsWith('/prospects')} tooltip="Prospects">
                    <Contact style={{ color: 'var(--sec-prospect)' }} />
                    Prospects
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/clients" />} isActive={location.pathname.startsWith('/clients')} tooltip="Clients">
                    <UserCheck style={{ color: 'var(--sec-client)' }} />
                    Clients
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/dossiers" />} isActive={location.pathname.startsWith('/dossiers')} tooltip="Dossiers de vente">
                    <Folder style={{ color: 'var(--sec-dossier)' }} />
                    Dossiers de vente
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/offres" />} isActive={location.pathname.startsWith('/offres')} tooltip="Offres">
                    <FileText style={{ color: 'var(--sec-offre)' }} />
                    Offres
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/encaissements" />} isActive={location.pathname.startsWith('/encaissements')} tooltip="Encaissements">
                    <Wallet style={{ color: 'var(--sec-dossier)' }} />
                    Encaissements
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {(isCommercial || activeModule === 'patrimoine') && (
            <SidebarGroup>
              <SidebarGroupLabel>Patrimoine</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/projets" />} isActive={location.pathname.startsWith('/projets')} tooltip="Projets">
                    <LayoutGrid style={{ color: 'var(--sec-projet)' }} />
                    Projets
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/tranches" />} isActive={location.pathname.startsWith('/tranches')} tooltip="Tranches">
                    <Building2 style={{ color: 'var(--sec-tranche)' }} />
                    Tranches
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/articles" />} isActive={location.pathname.startsWith('/articles')} tooltip="Articles">
                    <Home style={{ color: 'var(--sec-tranche)' }} />
                    Articles
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {/* Commercial's third and last section — always shown alongside
              Ventes/Patrimoine above, not route-gated either. Just the
              profile page for now; the footer's own "Mon profil" link
              (below) still works for every other role, this is purely
              about surfacing it as a proper nav item for Commercial. */}
          {isCommercial && (
            <SidebarGroup>
              <SidebarGroupLabel>Profil</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<PreloadNavLink to="/profil" />} isActive={location.pathname.startsWith('/profil')} tooltip="Mon profil">
                    <UserCircle />
                    Mon profil
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          {/* Everything below (Bientôt placeholders, Administration) stays
              route-gated as before — Commercial never routes there in the
              first place (no module switcher to get to it from), so no
              extra guard is needed beyond the existing activeModule check. */}
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
                    render={<PreloadNavLink to="/utilisateurs" />}
                    isActive={location.pathname === '/utilisateurs'}
                    tooltip="Comptes utilisateurs"
                  >
                    <Users />
                    Comptes utilisateurs
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<PreloadNavLink to="/utilisateurs/nouveau" />}
                    isActive={location.pathname.startsWith('/utilisateurs/nouveau')}
                    tooltip="Nouvel utilisateur"
                  >
                    <UserPlus />
                    Nouvel utilisateur
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<PreloadNavLink to="/utilisateurs/reinitialiser-mot-de-passe" />}
                    isActive={location.pathname.startsWith('/utilisateurs/reinitialiser-mot-de-passe')}
                    tooltip="Réinitialiser un mot de passe"
                  >
                    <KeyRound />
                    Réinitialiser un mot de passe
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2 border-t border-sidebar-border px-2 pt-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
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

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
