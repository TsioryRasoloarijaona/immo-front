import { NavLink } from 'react-router-dom';
import { Building, FilePlus2, LayoutDashboard, PhoneCall, Receipt, type LucideIcon } from 'lucide-react';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../../components/ui/sidebar';

const ENTREES: { chemin: string; libelle: string; icone: LucideIcon }[] = [
  { chemin: '/outils/syndic/tableau-de-bord', libelle: 'Tableau de bord', icone: LayoutDashboard },
  { chemin: '/outils/syndic/appartements', libelle: 'Appartements', icone: Building },
  { chemin: '/outils/syndic/paiement/nouveau', libelle: 'Nouveau paiement', icone: FilePlus2 },
  { chemin: '/outils/syndic/paiements', libelle: 'Paiements', icone: Receipt },
  { chemin: '/outils/syndic/qui-doit', libelle: 'Qui doit', icone: PhoneCall },
];

/** À côté de « Ordres de virement », pour les mêmes rôles : `Layout` ne le rend que là où il rend les virements. */
export default function EntreesSyndic({ pathname }: Readonly<{ pathname: string }>) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Syndic</SidebarGroupLabel>
      <SidebarMenu>
        {ENTREES.map(({ chemin, libelle, icone: Icone }) => (
          <SidebarMenuItem key={chemin}>
            <SidebarMenuButton render={<NavLink to={chemin} />} isActive={pathname.startsWith(chemin)} tooltip={libelle}>
              <Icone />
              {libelle}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
