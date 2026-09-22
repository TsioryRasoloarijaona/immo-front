import type { ReactNode } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Building2, Calendar, Contact, FileText, Folder, Gauge, Home, KeyRound, LayoutDashboard, LayoutGrid, LogOut, Phone, Trophy, UserCheck, UserCircle, UserPlus, Users, Wallet } from 'lucide-react';
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
      {/* variant="inset" (redesign 20/09, référence Uxerflow) : le fond de
          fenêtre prend la couleur canvas (--sidebar, greige chaud), la
          sidebar y vit à nu, et SidebarInset devient une FEUILLE flottante
          (m-2 rounded-xl shadow) qui porte tout le contenu. PageShell
          compense la marge : fullHeight y vaut calc(100svh - 1rem). */}
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-1 px-1 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Link
              to="/"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 no-underline group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:px-0"
              title="Arpent"
            >
              {/* La marque Arpent (adoptée le 20/09) : le « A »-pignon aux
                  pieds d'arpentage, encre + sommet orange. Deux <img> plutôt
                  qu'un filtre CSS : la variante inverse (crème) porte le
                  sombre, la normale (encre) le clair. Le mot-symbole passe en
                  encre — c'est le sommet orange de la marque qui porte
                  l'accent, pas le texte. Rail replié : la marque seule. */}
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
                    render={<NavLink to="/utilisateurs/nouveau" />}
                    isActive={location.pathname.startsWith('/utilisateurs/nouveau')}
                    tooltip="Nouvel utilisateur"
                  >
                    <UserPlus />
                    Nouvel utilisateur
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
                    render={<NavLink to="/performances" />}
                    isActive={location.pathname.startsWith('/performances')}
                    tooltip="Performances commerciales"
                  >
                    <Trophy />
                    Performances commerciales
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter>
          {/* Synchronisation manuelle (MB4) — pleine largeur au-dessus du
              profil, visible sur toutes les pages sans rien recouvrir (la
              pilule flottante essayée d'abord cachait la pagination). Le
              composant se cache lui-même pour les rôles auxquels le backend
              refuse l'appel. */}
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

      {/* `min-w-0` : `SidebarProvider` est un conteneur flex en ligne, et
          `SidebarInset` y est un élément flex sans largeur minimale déclarée —
          sa `min-width: auto` vaut donc la largeur minimale de son *contenu*.
          Un tableau large (les listes de prospection montent à ~108rem toutes
          colonnes cochées) remonte ainsi jusqu'ici, empêche le volet principal
          de rétrécir, et c'est la **fenêtre** qui se met à défiler
          horizontalement : en-tête et barre de filtres coupés au bord droit.
          Ni un `overflow` ni un `min-w-0` posés plus bas n'y changent quoi que
          ce soit — la contrainte doit être cassée sur l'élément flex de l'axe
          concerné, et c'est celui-ci. Avec, chaque page garde sa largeur et le
          débordement est absorbé par son propre conteneur de défilement. */}
      <SidebarInset className="min-w-0">{children}</SidebarInset>
    </SidebarProvider>
  );
}
