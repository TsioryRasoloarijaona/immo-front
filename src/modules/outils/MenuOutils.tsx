import { BookUser, FilePlus2, History } from 'lucide-react';
import EntreesAdminVirements from '../../pages/outils/virements/EntreesAdminVirements';
import EntreesSyndic from '../../pages/outils/syndic/EntreesSyndic';
import GroupeMenu from '../GroupeMenu';
import type { EntreeMenu } from '../types';

const VIREMENTS: EntreeMenu[] = [
  { to: '/outils/virements/nouveau', libelle: 'Nouvel ordre', Icone: FilePlus2 },
  { to: '/outils/virements/historique', libelle: 'Historique', Icone: History },
  { to: '/outils/virements/beneficiaires', libelle: 'Bénéficiaires', Icone: BookUser },
];

export default function MenuOutils({ pathname }: Readonly<{ pathname: string }>) {
  return (
    <>
      <GroupeMenu titre="Ordres de virement" entrees={VIREMENTS} pathname={pathname}>
        {/* Sociétés et Journal : selon `admin` de `GET /moi` du service, pas selon les rôles CRM. */}
        <EntreesAdminVirements pathname={pathname} />
      </GroupeMenu>
      <EntreesSyndic pathname={pathname} />
    </>
  );
}
