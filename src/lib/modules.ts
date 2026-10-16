import type { ComponentType, SVGProps } from 'react';
import {
  Building2,
  Calculator,
  Folder,
  Hammer,
  Key,
  Landmark,
  Settings,
  ShoppingCart,
  Users,
  Wrench,
} from 'lucide-react';

export interface AppModule {
  slug: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  active: boolean;
  path?: string;
  adminOnly?: boolean;
}

export function moduleForPath(pathname: string): string | null {
  // Le tableau de bord n'existe que pour la vente ; profil et performances suivent le menu Vente.
  if (
    pathname === '/' ||
    pathname.startsWith('/tableau-de-bord') ||
    pathname.startsWith('/profil') ||
    pathname.startsWith('/mes-performances') ||
    pathname.startsWith('/hotline') ||
    pathname.startsWith('/calendrier') ||
    pathname.startsWith('/suivi-actions') ||
    pathname.startsWith('/performances') ||
    pathname.startsWith('/equipe') ||
    pathname.startsWith('/journee') ||
    pathname.startsWith('/tri') ||
    pathname.startsWith('/prospections') ||
    pathname.startsWith('/pre-prospections') ||
    pathname.startsWith('/prospects') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/dossiers') ||
    pathname.startsWith('/offres') ||
    pathname.startsWith('/encaissements') ||
    pathname.startsWith('/impayes') ||
    pathname.startsWith('/aide')
  ) {
    return 'vente';
  }
  if (pathname.startsWith('/tranches') || pathname.startsWith('/articles') || pathname.startsWith('/projets')) {
    return 'patrimoine';
  }
  if (pathname.startsWith('/utilisateurs') || pathname.startsWith('/cles-api') || pathname.startsWith('/modeles-documents')) {
    return 'administration';
  }
  if (pathname.startsWith('/outils')) {
    return 'outils';
  }
  if (pathname.startsWith('/bientot/')) {
    return pathname.split('/')[2] ?? null;
  }
  return null;
}

export const APP_MODULES: AppModule[] = [
  { slug: 'vente', label: 'Vente', icon: Folder, active: true, path: '/prospections' },
  { slug: 'patrimoine', label: 'Patrimoine', icon: Building2, active: true, path: '/tranches' },
  { slug: 'achat', label: 'Achat', icon: ShoppingCart, active: false },
  { slug: 'location', label: 'Location', icon: Key, active: false },
  { slug: 'sav', label: 'Service Après Vente', icon: Wrench, active: false },
  { slug: 'rh', label: 'Ressources Humaines', icon: Users, active: false },
  { slug: 'tresorerie', label: 'Trésorerie', icon: Landmark, active: false },
  { slug: 'comptabilite', label: 'Comptabilité', icon: Calculator, active: false },
  { slug: 'administration', label: 'Administration', icon: Settings, active: true, path: '/utilisateurs' },
  { slug: 'outils', label: 'Outils', icon: Hammer, active: true, path: '/outils/virements/nouveau', adminOnly: true },
];
