import type { ComponentType, SVGProps } from 'react';
import { Calculator, Key, Landmark, ShoppingCart, Users, Wrench } from 'lucide-react';
import { MODULES_DECLARES } from '../modules/registre';

export interface AppModule {
  slug: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  active: boolean;
  path?: string;
  adminOnly?: boolean;
}

export function moduleForPath(pathname: string): string | null {
  const declare = MODULES_DECLARES.find((m) => m.prefixes.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p))));
  if (declare) {
    return declare.slug;
  }
  if (pathname.startsWith('/bientot/')) {
    return pathname.split('/')[2] ?? null;
  }
  return null;
}

/** Modules sans écran (« Bientôt ») ; les autres se déclarent dans `src/modules/<module>/routes.tsx`. */
const MODULES_A_VENIR: (AppModule & { ordre: number })[] = [
  { slug: 'achat', label: 'Achat', icon: ShoppingCart, active: false, ordre: 3 },
  { slug: 'location', label: 'Location', icon: Key, active: false, ordre: 4 },
  { slug: 'sav', label: 'Service Après Vente', icon: Wrench, active: false, ordre: 5 },
  { slug: 'rh', label: 'Ressources Humaines', icon: Users, active: false, ordre: 6 },
  { slug: 'tresorerie', label: 'Trésorerie', icon: Landmark, active: false, ordre: 7 },
  { slug: 'comptabilite', label: 'Comptabilité', icon: Calculator, active: false, ordre: 8 },
];

export const APP_MODULES: AppModule[] = [
  ...MODULES_DECLARES.map(({ slug, label, icon, path, adminOnly, ordre }) => ({ slug, label, icon, active: true, path, adminOnly, ordre })),
  ...MODULES_A_VENIR,
].sort((a, b) => a.ordre - b.ordre);
