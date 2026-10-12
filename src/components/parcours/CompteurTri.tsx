import { SidebarMenuBadge } from '../ui/sidebar';
import { listBoiteDeTri } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { useApi } from '../../lib/useApi';

/** Nombre de pré-prospections à trier, à côté de « Boîte de tri » ; rien tant qu'il est inconnu ou nul. */
export default function CompteurTri() {
  const { data } = useApi(() => listBoiteDeTri(false, { page: 0, size: 1 }), [], 'boite-de-tri-compte');
  const total = data?.totalElements ?? 0;
  if (total === 0) return null;
  return <SidebarMenuBadge aria-label={`${formatNumber(total)} à trier`}>{formatNumber(total)}</SidebarMenuBadge>;
}
