import type { ComponentType, SVGProps } from 'react';
import {
  Building2,
  Calculator,
  Folder,
  Key,
  Landmark,
  Settings,
  ShoppingCart,
  Users,
  Wrench,
} from 'lucide-react';

// Single source of truth for the module switcher grid, the sidebar's
// "Bientôt" section, and the /bientot/:slug placeholder screens — so all
// three stay in sync. See instructions/FIX-clients-and-module-switcher.md.
export interface AppModule {
  slug: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  active: boolean;
  path?: string;
}

/** Which module a given route belongs to, purely from the URL — the single
 * source of truth the sidebar uses to show only that module's submenu.
 * Returns null for module-neutral routes (Dashboard). */
export function moduleForPath(pathname: string): string | null {
  if (
    pathname.startsWith('/hotline') ||
    pathname.startsWith('/calendrier') ||
    pathname.startsWith('/suivi-actions') ||
    // Le classement des commerciaux a quitté Administration pour la section
    // « Suivi » du module Vente (23/09) : c'est du pilotage d'activité.
    pathname.startsWith('/performances') ||
    pathname.startsWith('/prospections') ||
    pathname.startsWith('/pre-prospections') ||
    pathname.startsWith('/prospects') ||
    pathname.startsWith('/clients') ||
    pathname.startsWith('/dossiers') ||
    pathname.startsWith('/offres') ||
    pathname.startsWith('/encaissements')
  ) {
    return 'vente';
  }
  if (pathname.startsWith('/tranches') || pathname.startsWith('/articles') || pathname.startsWith('/projets')) {
    return 'patrimoine';
  }
  // `/mes-performances` ne relève d'aucun module : elle est destinée au
  // commercial, dont les groupes de sidebar ne dépendent pas de la route.
  // `/cles-api` : les clés des clients machine (n8n), quatrième écran
  // d'Administration à côté des comptes.
  if (pathname.startsWith('/utilisateurs') || pathname.startsWith('/cles-api')) {
    return 'administration';
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
  { slug: 'administration', label: 'Administration', icon: Settings, active: true, path: '/utilisateurs/nouveau' },
];
