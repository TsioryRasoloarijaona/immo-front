import { useEffect } from 'react';
import { SidebarMenuBadge } from '../ui/sidebar';
import { listBoiteDeTri } from '../../lib/api';
import { onCacheClear } from '../../lib/apiCache';
import { formatNumber } from '../../lib/format';
import { useApi } from '../../lib/useApi';
import { useRafraichirAuRetour } from '../../lib/useRafraichirAuRetour';

/**
 * Nombre de pré-prospections à trier, à côté de « Boîte de tri » ; rien tant qu'il est inconnu ou nul. La barre
 * latérale ne se remonte jamais : relu après chaque écriture (vidage du cache) et au retour sur l'onglet.
 */
export default function CompteurTri() {
  const { data, refetch } = useApi(() => listBoiteDeTri(false, { page: 0, size: 1 }), [], 'boite-de-tri-compte');
  useRafraichirAuRetour(refetch);
  useEffect(() => onCacheClear(() => void refetch()), [refetch]);
  const total = data?.totalElements ?? 0;
  if (total === 0) return null;
  return <SidebarMenuBadge aria-label={`${formatNumber(total)} à trier`}>{formatNumber(total)}</SidebarMenuBadge>;
}
