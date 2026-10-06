import { NavLink } from 'react-router-dom';
import { Landmark, ScrollText } from 'lucide-react';
import { SidebarMenuButton, SidebarMenuItem } from '../../../components/ui/sidebar';
import { useContexteVirement } from './contexte';

/** Entrées de barre latérale réservées aux administrateurs **du service**
 * (`GET /moi` → `admin`) : Sociétés et Journal. Rendu par `Layout` seulement
 * quand le module Outils est actif, donc `/moi` n'est chargé que là. */
export default function EntreesAdminVirements({ pathname }: { pathname: string }) {
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
