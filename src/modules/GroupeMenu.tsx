import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../components/ui/sidebar';
import { useAuth } from '../lib/auth';
import type { EntreeMenu } from './types';

function estActive(pathname: string, e: EntreeMenu): boolean {
  if (e.exact) return pathname === e.to;
  const prefixe = e.actif ?? e.to;
  return pathname === prefixe || pathname.startsWith(`${prefixe}/`);
}

/** Groupe de menu d'un module déclaré par données ; `children` s'ajoute après les entrées. */
export default function GroupeMenu({ titre, entrees, pathname, children }: Readonly<{
  titre: string;
  entrees: readonly EntreeMenu[];
  pathname: string;
  children?: ReactNode;
}>) {
  const { user } = useAuth();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{titre}</SidebarGroupLabel>
      <SidebarMenu>
        {entrees.filter((e) => !e.visible || e.visible(user)).map((e) => (
          <SidebarMenuItem key={e.to}>
            <SidebarMenuButton render={<NavLink to={e.to} />} isActive={estActive(pathname, e)} tooltip={e.tooltip ?? e.libelle}>
              <e.Icone style={e.couleur ? { color: e.couleur } : undefined} />
              {e.libelle}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {children}
      </SidebarMenu>
    </SidebarGroup>
  );
}
