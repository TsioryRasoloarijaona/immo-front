import { NavLink } from 'react-router-dom';
import { Building, FilePlus2, LayoutDashboard, PhoneCall, Receipt, Settings, type LucideIcon } from 'lucide-react';
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../../components/ui/sidebar';
import { useContexteVirement } from '../virements/contexte';

const ENTREES: { chemin: string; libelle: string; icone: LucideIcon }[] = [
  { chemin: '/outils/syndic/tableau-de-bord', libelle: 'Tableau de bord', icone: LayoutDashboard },
  { chemin: '/outils/syndic/appartements', libelle: 'Appartements', icone: Building },
  { chemin: '/outils/syndic/paiement/nouveau', libelle: 'Nouveau paiement', icone: FilePlus2 },
  { chemin: '/outils/syndic/paiements', libelle: 'Paiements', icone: Receipt },
  { chemin: '/outils/syndic/qui-doit', libelle: 'Qui doit', icone: PhoneCall },
];
const REGLAGES = { chemin: '/outils/syndic/reglages', libelle: 'Réglages', icone: Settings };

/** À côté de « Ordres de virement », pour les mêmes rôles : `MenuOutils` ne le rend que là où il rend les virements.
 * « Réglages » : administrateurs du service seulement (`/moi`). */
export default function EntreesSyndic({ pathname }: Readonly<{ pathname: string }>) {
  const { moi } = useContexteVirement();
  const entrees = moi?.admin ? [...ENTREES, REGLAGES] : ENTREES;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Syndic</SidebarGroupLabel>
      <SidebarMenu>
        {entrees.map(({ chemin, libelle, icone: Icone }) => (
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
