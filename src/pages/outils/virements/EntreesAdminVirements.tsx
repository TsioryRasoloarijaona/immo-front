import { NavLink } from 'react-router-dom';
import { Landmark, ScrollText } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '../../../components/ui/sidebar';
import { useContexteVirement } from './contexte';

/** Réservé aux administrateurs du service (`moi.admin`), pas aux rôles CRM. `Layout` ne le rend que dans le
 * module Outils, pour que `/moi` ne soit chargé que là. */
export default function EntreesAdminVirements({ pathname }: Readonly<{ pathname: string }>) {
  const { moi } = useContexteVirement();
  if (!moi?.admin) return null;
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<NavLink to="/outils/virements/societes" />}
          isActive={pathname.startsWith('/outils/virements/societes')}
          tooltip="Sociétés émettrices"
        >
          <Landmark />
          Sociétés
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          render={<NavLink to="/outils/virements/journal" />}
          isActive={pathname.startsWith('/outils/virements/journal')}
          tooltip="Journal d'activité"
        >
          <ScrollText />
          Journal
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}
